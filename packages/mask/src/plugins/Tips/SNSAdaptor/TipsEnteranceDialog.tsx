import { DialogContent, Button } from '@mui/material'
import { useI18N } from '../../../utils'
import { makeStyles } from '@masknet/theme'
import { VerifyAlertLine } from './components/VerifyAlertLine'
import { useEffect, useState } from 'react'
import { TipsSupportedChains } from '../constants'
import { WalletsByNetwork } from './components/WalletsByNetwork'
import ActionButton from '../../../extension/options-page/DashboardComponents/ActionButton'
import SettingView from './bodyViews/Setting'
import WalletsView from './bodyViews/Wallets'
import AddWalletView from './bodyViews/AddWallet'
import { useProvedWallets } from '../hooks/useProvedWallets'
import {
    BindingProof,
    ECKeyIdentifier,
    NextIDPersonaBindings,
    NextIDPlatform,
    NextIDStoragePayload,
} from '@masknet/shared-base'
import Empty from './components/empty'
import { getKvPayload, kvSet, useKvGet } from '../hooks/useKv'
import { InjectedDialog, LoadingAnimation } from '@masknet/shared'
import { useAsyncRetry } from 'react-use'
import Services from '../../../extension/service'
export interface TipsEntranceDialogProps {
    open: boolean
    onClose: () => void
}
const useStyles = makeStyles()((theme) => ({
    walletBtn: {
        fontSize: '14px',
    },
    alertBox: {
        marginBottom: '20px',
    },
    actions: {
        position: 'absolute',
        bottom: 16,
        width: 'calc( 100% - 32px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing(1.5),
    },
    dContent: {
        height: 600,
        position: 'relative',
        boxSizing: 'border-box',
    },
    btnContainer: {
        width: '100%',
        display: 'flex',
        flexDirection: 'row-reverse',
    },
    loading: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%,-50%)',
    },
}))

enum BodyViewSteps {
    main = 'Tips',
    setting = 'Settings',
    wallets = 'Wallets',
    addWallet = 'Add wallet',
}
export interface WalletProof extends BindingProof {
    isDefault: number
    isPublic: number
}
export function TipsEntranceDialog({ open, onClose }: TipsEntranceDialogProps) {
    const { t } = useI18N()
    const { classes } = useStyles()
    const [showAlert, setShowAlert] = useState(true)
    const supportedNetworks = TipsSupportedChains
    const [bodyView, setBodyView] = useState<BodyViewSteps>(BodyViewSteps.main)
    const [hasChanged, setHasChanged] = useState(false)
    const [rawPatchData, setRawPatchData] = useState<WalletProof[]>([])
    const [rawWalletList, setRawWalletList] = useState<WalletProof[]>([])
    const { value: currentPersonaIdentifier } = useAsyncRetry(
        () => Services.Settings.getCurrentPersonaIdentifier(),
        [open],
    )
    const clickBack = () => {
        if (bodyView === BodyViewSteps.main) {
            onClose()
        } else {
            setBodyView(BodyViewSteps.main)
        }
    }
    const { value: kv } = useKvGet()
    const { loading, value: proofRes } = useProvedWallets()

    useEffect(() => {
        const walletsList = proofRes
            ? (proofRes as NextIDPersonaBindings).proofs.filter((x) => x.platform === NextIDPlatform.Ethereum)
            : []
        if (!kv || !(kv as any).val.proofs.length) {
            ;(walletsList as WalletProof[]).forEach((x, idx) => {
                x.isPublic = 1
                x.isDefault = 0
                if (idx === 0) {
                    x.isDefault = 1
                    return
                }
            })
        }
        setRawWalletList(JSON.parse(JSON.stringify(walletsList)))
        setRawPatchData(JSON.parse(JSON.stringify(walletsList)))
    }, [proofRes])

    const onChange = () => {
        setHasChanged(true)
    }
    const onCancel = () => {
        setRawPatchData(JSON.parse(JSON.stringify(rawWalletList)))
        setHasChanged(false)
    }
    const WalletButton = () => {
        const { classes } = useStyles()
        return (
            (bodyView !== BodyViewSteps.addWallet && (
                <div className={classes.btnContainer}>
                    <Button
                        onClick={() => {
                            if (bodyView === BodyViewSteps.wallets) {
                                setBodyView(BodyViewSteps.addWallet)
                            } else {
                                setBodyView(BodyViewSteps.wallets)
                            }
                        }}
                        className={classes.walletBtn}
                        variant="contained"
                        size="small">
                        {bodyView === BodyViewSteps.wallets ? BodyViewSteps.addWallet : BodyViewSteps.wallets}
                    </Button>
                </div>
            )) ||
            null
        )
    }
    const setAsDefault = (idx: number) => {
        const changed = JSON.parse(JSON.stringify(rawPatchData))
        changed.forEach((x: any) => (x.isDefault = 0))
        changed[idx].isDefault = 1
        setRawPatchData(changed)
        setHasChanged(true)
    }

    const onConfirm = async () => {
        try {
            const payload = await getKvPayload(rawPatchData)
            if (!payload || !payload.val) throw new Error('payload error')
            const signResult = await Services.Identity.generateSignResult(
                currentPersonaIdentifier as ECKeyIdentifier,
                (payload.val as NextIDStoragePayload).signPayload,
            )
            if (!signResult) throw new Error('sign error')
            await kvSet(payload.val, signResult.signature.signature, rawPatchData)
        } catch (error) {
            console.error(error)
        }
    }
    return (
        <InjectedDialog open={open} onClose={clickBack} title={bodyView} titleTail={WalletButton()}>
            {loading ? (
                <DialogContent className={classes.dContent}>
                    <div className={classes.loading}>
                        <LoadingAnimation />
                    </div>
                </DialogContent>
            ) : (
                <DialogContent className={classes.dContent}>
                    {showAlert && bodyView === BodyViewSteps.main && (
                        <div className={classes.alertBox}>
                            <VerifyAlertLine onClose={() => setShowAlert(false)} />
                        </div>
                    )}

                    {bodyView === BodyViewSteps.main && rawPatchData.length > 0 ? (
                        <div>
                            {supportedNetworks.map((x, idx) => {
                                return (
                                    <WalletsByNetwork
                                        wallets={rawPatchData}
                                        toSetting={() => setBodyView(BodyViewSteps.setting)}
                                        key={idx}
                                        network={x}
                                        setAsDefault={setAsDefault}
                                    />
                                )
                            })}
                        </div>
                    ) : bodyView === BodyViewSteps.main && rawPatchData.length === 0 ? (
                        <Empty />
                    ) : null}

                    {bodyView === BodyViewSteps.setting && <SettingView onChange={onChange} wallets={rawPatchData} />}
                    {bodyView === BodyViewSteps.wallets && <WalletsView wallets={rawPatchData} />}
                    {bodyView === BodyViewSteps.addWallet && <AddWalletView />}

                    {![BodyViewSteps.addWallet, BodyViewSteps.wallets].includes(bodyView) && rawPatchData.length > 0 && (
                        <div className={classes.actions}>
                            <ActionButton fullWidth color="secondary" disabled={!hasChanged} onClick={onCancel}>
                                {t('cancel')}
                            </ActionButton>
                            <ActionButton fullWidth disabled={!hasChanged} onClick={onConfirm}>
                                {t('confirm')}
                            </ActionButton>
                        </div>
                    )}
                </DialogContent>
            )}
        </InjectedDialog>
    )
}
