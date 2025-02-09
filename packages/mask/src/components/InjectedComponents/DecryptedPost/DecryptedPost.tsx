import { Fragment, useEffect, useMemo, useReducer } from 'react'
import { extractTextFromTypedMessage, TypedMessage } from '@masknet/typed-message'
import type { ProfileIdentifier } from '@masknet/shared-base'

import Services, { ServicesWithProgress } from '../../../extension/service'
import type { Profile } from '../../../database'
import type { DecryptionProgress, FailureDecryption, SuccessDecryption } from './types'
import { DecryptPostSuccess } from './DecryptedPostSuccess'
import { DecryptPostAwaiting } from './DecryptPostAwaiting'
import { DecryptPostFailed } from './DecryptPostFailed'
import { usePostClaimedAuthor } from '../../DataSource/usePostInfo'
import { delay, encodeArrayBuffer, safeUnreachable } from '@dimensiondev/kit'
import { activatedSocialNetworkUI } from '../../../social-network'
import type { DecryptionContext, SocialNetworkEncodedPayload } from '../../../../background/services/crypto/decryption'
import { DecryptIntermediateProgressKind, DecryptProgressKind } from '@masknet/encryption'
import { type PostContext, usePostInfoDetails, usePostInfo } from '@masknet/plugin-infra/content-script'
import { Some } from 'ts-results'

function progressReducer(
    state: { key: string; progress: SuccessDecryption | FailureDecryption | DecryptionProgress }[],
    payload: {
        type: 'refresh'
        key: string
        progress: SuccessDecryption | FailureDecryption | DecryptionProgress
    },
) {
    const { key, progress } = payload
    const currentProgressIndex = state.findIndex((x) => x.key === key)
    if (currentProgressIndex === -1) {
        return [
            ...state,
            {
                key,
                progress,
            },
        ]
    }
    const currentProgress = state[currentProgressIndex].progress
    if (currentProgress && currentProgress.type !== 'progress' && progress.type === 'progress') return state
    state[currentProgressIndex] = {
        key,
        progress,
    }
    return [...state]
}

export interface DecryptPostProps {
    whoAmI: ProfileIdentifier
    profiles: Profile[]
    alreadySelectedPreviously: Profile[]
    requestAppendRecipients?(to: Profile[]): Promise<void>
}
export function DecryptPost(props: DecryptPostProps) {
    const { whoAmI, profiles, alreadySelectedPreviously } = props
    const deconstructedPayload = usePostInfoDetails.containingMaskPayload()
    const authorInPayload = usePostClaimedAuthor()
    const current = usePostInfo()!
    const currentPostBy = usePostInfoDetails.author()
    const postBy = authorInPayload || currentPostBy
    const postMetadataImages = usePostInfoDetails.postMetadataImages()
    const mentionedLinks = usePostInfoDetails.mentionedLinks()
    const postInfo = usePostInfo()

    const requestAppendRecipientsWrapped = useMemo(() => {
        if (!postBy.equals(whoAmI)) return undefined
        if (!props.requestAppendRecipients) return undefined
        return async (people: Profile[]) => {
            await props.requestAppendRecipients!(people)
            await delay(1500)
        }
    }, [props.requestAppendRecipients, postBy, whoAmI])

    // #region Progress
    const [progress, dispatch] = useReducer(progressReducer, [])
    // #endregion

    // #region decrypt

    // pass 1:
    // decrypt post content and image attachments
    const sharedPublic = usePostInfoDetails.publicShared()

    useEffect(() => {
        function setCommentFns(iv: Uint8Array, message: TypedMessage) {
            postInfo!.encryptComment.value = async (comment) =>
                Services.Crypto.encryptComment(iv, extractTextFromTypedMessage(message).unwrap(), comment)
            postInfo!.decryptComment.value = async (encryptedComment) =>
                Services.Crypto.decryptComment(iv, extractTextFromTypedMessage(message).unwrap(), encryptedComment)
        }
        const signal = new AbortController()
        const postURL = current.url.getCurrentValue()?.toString()
        const report =
            (key: string): ReportProgress =>
            (kind, message) => {
                if (kind === 'e2e') {
                    dispatch({
                        type: 'refresh',
                        key,
                        progress: { type: 'progress', progress: 'finding_post_key', internal: false },
                    })
                } else {
                    dispatch({
                        type: 'refresh',
                        key,
                        progress: { type: 'error', error: message, internal: false },
                    })
                }
            }
        if (deconstructedPayload.ok) {
            makeProgress(
                postURL,
                postBy,
                whoAmI,
                {
                    type: 'text',
                    text:
                        extractTextFromTypedMessage(current.rawMessage.getCurrentValue()).unwrapOr('') +
                        ' ' +
                        mentionedLinks.join(' '),
                },
                (message, iv) => {
                    setCommentFns(iv, message)
                    dispatch({
                        type: 'refresh',
                        key: 'text',
                        progress: {
                            type: 'success',
                            content: message,
                            internal: false,
                            iv: encodeArrayBuffer(iv),
                        },
                    })
                },
                current.decryptedReport,
                report('text'),
                signal.signal,
            )
        }
        postMetadataImages.forEach((url) => {
            if (signal.signal.aborted) return
            makeProgress(
                postURL,
                postBy,
                whoAmI,
                { type: 'image-url', image: url },
                (message, iv) => {
                    setCommentFns(iv, message)
                    dispatch({
                        type: 'refresh',
                        key: url,
                        progress: {
                            type: 'success',
                            content: message,
                            internal: false,
                            iv: encodeArrayBuffer(iv),
                        },
                    })
                },
                current.decryptedReport,
                report(url),
                signal.signal,
            )
        })
        return () => signal.abort()
    }, [deconstructedPayload.ok, postBy.toText(), postMetadataImages.join(), whoAmI.toText(), mentionedLinks.join()])

    // it's not a secret post
    if (!deconstructedPayload.ok && progress.every((x) => x.progress.internal)) return null
    return (
        <>
            {progress
                // the internal progress should not display to the end-user
                .filter(({ progress }) => !progress.internal)
                .map(({ progress }, index) => (
                    <Fragment key={index}>{renderProgress(progress)}</Fragment>
                ))}
        </>
    )

    function renderProgress(progress: SuccessDecryption | FailureDecryption | DecryptionProgress) {
        switch (progress.type) {
            case 'success':
                return (
                    <DecryptPostSuccess
                        data={progress}
                        alreadySelectedPreviously={alreadySelectedPreviously}
                        requestAppendRecipients={requestAppendRecipientsWrapped}
                        profiles={profiles}
                        sharedPublic={sharedPublic}
                        author={authorInPayload}
                        postedBy={currentPostBy}
                    />
                )
            case 'error':
                return (
                    <DecryptPostFailed
                        error={new Error(progress.error)}
                        author={authorInPayload}
                        postedBy={currentPostBy}
                    />
                )
            case 'progress':
                return <DecryptPostAwaiting type={progress} author={authorInPayload} postedBy={currentPostBy} />
            default:
                return null
        }
    }
}

type ReportProgress = (type: 'e2e' | 'error', message: string) => void
async function makeProgress(
    postURL: string | undefined,
    authorHint: ProfileIdentifier,
    currentProfile: ProfileIdentifier,
    payload: SocialNetworkEncodedPayload,
    done: (message: TypedMessage, iv: Uint8Array) => void,
    reporter: PostContext['decryptedReport'],
    reportProgress: ReportProgress,
    signal: AbortSignal,
) {
    const context: DecryptionContext = {
        postURL,
        authorHint,
        currentProfile,
        currentSocialNetwork: activatedSocialNetworkUI.encryptionNetwork,
    }
    let iv: Uint8Array | undefined
    for await (const progress of ServicesWithProgress.decryptionWithSocialNetworkDecoding(payload, context)) {
        if (signal.aborted) return
        if (progress.type === DecryptProgressKind.Success) {
            done(progress.content, iv || new Uint8Array())
        } else if (progress.type === DecryptProgressKind.Info) {
            iv ??= progress.iv
            if (typeof progress.isAuthorOfPost === 'boolean')
                reporter({ isAuthorOfPost: Some(progress.isAuthorOfPost) })
            if (progress.iv) reporter({ iv: encodeArrayBuffer(progress.iv) })
            if (progress.version) reporter({ version: progress.version })
            if (typeof progress.publicShared === 'boolean') reporter({ sharedPublic: Some(progress.publicShared) })
        } else if (progress.type === DecryptProgressKind.Progress) {
            if (progress.event === DecryptIntermediateProgressKind.TryDecryptByE2E) reportProgress('e2e', '')
            else safeUnreachable(progress.event)
        } else if (progress.type === DecryptProgressKind.Error) {
            console.log(progress.message)
        } else safeUnreachable(progress)
    }
}
