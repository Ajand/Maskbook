import type { BindingProof } from '@masknet/shared-base'
import { makeStyles } from '@masknet/theme'
import { Typography } from '@mui/material'
import { memo } from 'react'
import { WalletSwitch } from './WalletSwitch'

const useStyles = makeStyles()((theme) => ({
    container: {
        height: '100%',
    },
    titleBox: {
        display: 'flex',
        gap: 4,
        alignItems: 'center',
        marginBottom: 16,
    },
    walletSwitchBox: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
    },
    swtichContainer: {
        width: 'calc(50% - 6px)',
    },
}))

interface SettingPageProp {
    wallets: BindingProof[]
}

const SettingPage = memo(({ wallets }: SettingPageProp) => {
    const { classes } = useStyles()

    return (
        <div className={classes.container}>
            <div className={classes.titleBox}>
                <Typography sx={{ fontWeight: 'bold', fontSize: 16 }}>Tips</Typography>
                <Typography>(0/4)</Typography>
            </div>
            <div className={classes.walletSwitchBox}>
                {wallets.map((x, idx) => {
                    return (
                        <div key={idx} className={classes.swtichContainer}>
                            <WalletSwitch type={0} address={x.identity} />
                        </div>
                    )
                })}
            </div>
        </div>
    )
})

export default SettingPage
