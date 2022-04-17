import { WalletMessages } from '@masknet/plugin-wallet'
import { useRemoteControlledDialog } from '@masknet/shared-base-ui'
import { makeStyles } from '@masknet/theme'
import { memo } from 'react'
import { ExternalLink } from 'react-feather'
const useStyles = makeStyles()((theme) => ({
    container: {
        position: 'relative',
        width: '100%',
        background:
            'linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.8) 100%), linear-gradient(90deg, rgba(28, 104, 243, 0.2) 0%, rgba(249, 55, 55, 0.2) 100%), #FFFFFF;',
        borderRadius: '16px',
        padding: '16px',
        boxSizing: 'border-box',
        minHeight: 200,
    },
    topBox: {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    tipIcon: {
        width: '20px',
    },
    iconBox: {
        display: 'flex',
        gap: 4,
        fontSize: 16,
        color: 'rgba(7, 16, 27, 1)',
        fontWeight: 700,
    },
    provided: {
        display: 'flex',
        alignItems: 'baseline',
        color: theme.palette.text.secondary,
        gap: 4,
        fontSize: 12,
    },
    badge: {
        cursor: 'pointer',
        fontSize: 14,
        color: 'rgba(7, 16, 27, 1)',
        fontWeight: 500,
    },
    linkIcon: {
        cursor: 'pointer',
    },
    emptyImg: {
        margin: '16px 0',
        width: '100%',
    },
    actionBtn: {
        cursor: 'pointer',
        position: 'absolute',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        minWidth: 200,
        background: theme.palette.background.default,
        borderRadius: '99px',
        padding: '11px 0',
        color: theme.palette.text.primary,
        fontSize: 14,
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        justifyContent: 'center',
    },
}))
const Empty = memo(() => {
    const { classes } = useStyles()
    const { openDialog: openSelectProviderDialog } = useRemoteControlledDialog(
        WalletMessages.events.selectProviderDialogUpdated,
    )
    return (
        <div className={classes.container}>
            <div className={classes.topBox}>
                <div className={classes.iconBox}>
                    <img
                        className={classes.tipIcon}
                        src={new URL('../../assets/Tip.png', import.meta.url).toString()}
                        alt=""
                    />
                    <div>Tips</div>
                </div>
                <div className={classes.provided}>
                    <div>Provided by</div>
                    <div className={classes.badge}>Mask Network</div>
                    <ExternalLink className={classes.linkIcon} size={14} />
                </div>
            </div>
            <img
                className={classes.emptyImg}
                src={new URL('../../assets/emptyUnion.png', import.meta.url).toString()}
                alt=""
            />
            <div className={classes.actionBtn} onClick={openSelectProviderDialog}>
                <img src={new URL('../../assets/wallet.png', import.meta.url).toString()} alt="" />
                <div>Connect your wallet</div>
            </div>
        </div>
    )
})
export default Empty
