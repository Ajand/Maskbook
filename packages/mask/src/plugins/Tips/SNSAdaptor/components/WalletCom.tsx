import { makeStyles } from '@masknet/theme'
import { Link, Typography } from '@mui/material'
import { useCopyToClipboard } from 'react-use'
import { useSnackbarCallback, FormattedAddress } from '@masknet/shared'
import { useI18N } from '../../../../utils'
import { Copy, ExternalLink } from 'react-feather'
import { useWeb3State } from '@masknet/plugin-infra'

const useStyles = makeStyles()((theme) => ({
    currentAccount: {
        padding: theme.spacing(1.5),
        marginBottom: theme.spacing(2),
        display: 'flex',
        border: `1px solid ${theme.palette.background.default}`,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    accountInfo: {
        fontSize: 16,
        flexGrow: 1,
        marginLeft: theme.spacing(1),
    },
    infoRow: {
        display: 'flex',
        alignItems: 'center',
    },
    accountName: {
        fontSize: 16,
        marginRight: 6,
    },
    address: {
        fontSize: 14,
        marginRight: theme.spacing(1),
        color: theme.palette.text.secondary,
        display: 'inline-block',
    },
    link: {
        color: theme.palette.text.primary,
        fontSize: 14,
        display: 'flex',
        alignItems: 'center',
    },
    linkIcon: {
        marginRight: theme.spacing(1),
    },
    defaultBtn: {
        fontSize: 16,
        fontWeight: 'bold',
        cursor: 'pointer',
    },
}))

interface WalletComProps {
    name?: string
    address: string
    isDefault?: boolean
}

export function WalletCom({ name, address, isDefault }: WalletComProps) {
    const { classes } = useStyles()
    const { t } = useI18N()
    const [, copyToClipboard] = useCopyToClipboard()
    const { Utils } = useWeb3State() ?? {}
    const onCopy = useSnackbarCallback(
        async (ev: React.MouseEvent<HTMLAnchorElement>) => {
            ev.stopPropagation()
            copyToClipboard(address)
        },
        [],
        undefined,
        undefined,
        undefined,
        t('copy_success_of_wallet_addr'),
    )
    return (
        <div className={classes.currentAccount}>
            <div className={classes.accountInfo}>
                <div className={classes.infoRow}>
                    <Typography className={classes.accountName}>{name}</Typography>
                </div>
                <div className={classes.infoRow}>
                    <Typography className={classes.address} variant="body2" title={address}>
                        <FormattedAddress address={address} size={4} formatter={Utils?.formatAddress} />
                    </Typography>
                    <Link
                        className={classes.link}
                        underline="none"
                        component="button"
                        title={t('wallet_status_button_copy_address')}
                        onClick={onCopy}>
                        <Copy className={classes.linkIcon} size={14} />
                    </Link>
                    <Link
                        className={classes.link}
                        href={Utils?.resolveAddressLink?.(1, address) ?? ''}
                        target="_blank"
                        title={t('plugin_wallet_view_on_explorer')}
                        rel="noopener noreferrer">
                        <ExternalLink className={classes.linkIcon} size={14} />
                    </Link>
                </div>
            </div>
            {isDefault ? null : <Typography className={classes.defaultBtn}>Set as default</Typography>}
        </div>
    )
}
