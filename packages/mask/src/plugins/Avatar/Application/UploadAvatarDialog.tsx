import { Button, DialogActions, DialogContent, Slider } from '@mui/material'
import AvatarEditor from 'react-avatar-editor'
import { makeStyles, useCustomSnackbar } from '@masknet/theme'
import { useCallback, useState } from 'react'
import { Twitter } from '@masknet/web3-providers'
import { PluginNFTAvatarRPC } from '../../Avatar/messages'
import { useCurrentVisitingIdentity } from '../../../components/DataSource/useActivatedUI'
import { RSS3_KEY_SNS } from '../../Avatar/constants'
import type { ERC721TokenDetailed } from '@masknet/web3-shared-evm'
import { getAvatarId } from '../../../social-network-adaptor/twitter.com/utils/user'
const useStyles = makeStyles()(() => ({
    root: {},
}))

interface UploadAvatarDialogProps {
    account?: string
    image?: string | File
    token?: ERC721TokenDetailed
    onClose: () => void
}

export function UploadAvatarDialog(props: UploadAvatarDialogProps) {
    const { image, account, token, onClose } = props
    const { classes } = useStyles()
    const identity = useCurrentVisitingIdentity()
    const [editor, setEditor] = useState<AvatarEditor | null>(null)
    const [scale, setScale] = useState(1)
    const { showSnackbar } = useCustomSnackbar()
    const onSave = useCallback(() => {
        if (!editor || !account || !token) return
        editor.getImage().toBlob(async (blob) => {
            if (!blob) return
            const data = await Twitter.uploadUserAvatar(identity.identifier.userId, blob)
            const avatarId = getAvatarId(data?.imageUrl ?? '')

            const avatar = await PluginNFTAvatarRPC.saveNFTAvatar(
                account,
                {
                    userId: data?.userId ?? '',
                    address: token.contractDetailed.address,
                    tokenId: token.tokenId,
                    avatarId,
                },
                identity.identifier.network,
                RSS3_KEY_SNS.TWITTER,
            ).catch((error) => {
                showSnackbar(error.message, { variant: 'error' })
                window.alert()
                return
            })
            if (!avatar) {
                showSnackbar('Sorry, failed to save NFT Avatar. Please set again.', { variant: 'error' })
                return
            }
            showSnackbar('Update NFT Avatar Success!', { variant: 'success' })
            onClose()
        })
    }, [editor, identity, onClose])

    if (!account || !image || !token) return null

    return (
        <>
            <DialogContent>
                <AvatarEditor
                    ref={(e) => setEditor(e)}
                    image={image!}
                    border={50}
                    style={{ width: '100%', height: '100%' }}
                    scale={scale ?? 1}
                    rotate={0}
                    borderRadius={300}
                />
                <Slider
                    max={2}
                    min={0.5}
                    step={0.1}
                    defaultValue={1}
                    onChange={(_, value) => setScale(value as number)}
                    aria-label="Scale"
                />
            </DialogContent>
            <DialogActions>
                <Button sx={{ flex: 1 }} variant="text">
                    Cancel
                </Button>
                <Button sx={{ flex: 1 }} variant="contained" onClick={onSave}>
                    Save
                </Button>
            </DialogActions>
        </>
    )
}
