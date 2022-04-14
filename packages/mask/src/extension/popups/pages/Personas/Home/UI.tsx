// ! We're going to SSR this UI, so DO NOT import anything new!

// TODO: Migrate following files before we can SSR
// ProfileList
// useI18N

import { memo } from 'react'
import { makeStyles } from '@masknet/theme'
import { Navigator } from '../../../components/Navigator'
import { Avatar, Typography } from '@mui/material'
import { ArrowRightIosIcon, MenuPersonasActiveIcon } from '@masknet/icons'
import { formatPersonaFingerprint } from '@masknet/shared-base'
import { CopyIconButton } from '../../../components/CopyIconButton'
import { useI18N } from '../../../../../utils'
import { formatPersonaName } from '../../../utils'

const useStyles = makeStyles()({
    container: {
        flex: 1,
        backgroundColor: '#F7F9FA',
        display: 'flex',
        flexDirection: 'column',
    },
    item: {
        padding: 16,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        marginBottom: 1,
        fontSize: 14,
        fontWeight: 700,
        lineHeight: '18px',
        color: '#15181B',
    },
    content: {
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        flex: 1,
        cursor: 'pointer',
    },
    copy: {
        fontSize: 16,
        fill: '#767F8D',
        cursor: 'pointer',
        marginLeft: 4,
    },
    avatar: {
        marginRight: 4,
        width: 48,
        height: 48,
    },
    arrow: {
        color: '#7B8192',
        fontSize: 24,
    },
})

export interface PersonaHomeUIProps {
    avatar?: string | null
    fingerprint?: string
    nickname?: string
    accountsCount: number
    walletsCount: number
    onEdit: () => void
    onEnterAccounts: () => void
    onEnterWallets: () => void
}

export const PersonaHomeUI = memo<PersonaHomeUIProps>(
    ({ avatar, fingerprint, nickname, accountsCount, walletsCount, onEdit, onEnterAccounts, onEnterWallets }) => {
        const { t } = useI18N()
        const { classes } = useStyles()

        return (
            <>
                <div className={classes.container}>
                    <div className={classes.item}>
                        <Typography>{t('popups_profile_photo')}</Typography>
                        {avatar ? (
                            <Avatar src={avatar} className={classes.avatar} />
                        ) : (
                            <MenuPersonasActiveIcon
                                className={classes.avatar}
                                style={{ fill: '#f9fafa', backgroundColor: '#F9FAFA', borderRadius: 99 }}
                            />
                        )}
                    </div>
                    <div className={classes.item}>
                        <Typography>{t('popups_public_key')}</Typography>
                        {fingerprint ? (
                            <Typography className={classes.content}>
                                {formatPersonaFingerprint(fingerprint, 4)}
                                <CopyIconButton text={fingerprint} className={classes.copy} />
                            </Typography>
                        ) : null}
                    </div>
                    <div className={classes.item}>
                        <Typography>{t('popups_name')}</Typography>
                        <Typography className={classes.content} onClick={onEdit}>
                            {formatPersonaName(nickname)}
                            <ArrowRightIosIcon className={classes.arrow} />
                        </Typography>
                    </div>
                    <div className={classes.item}>
                        <Typography>{t('popups_social_account')}</Typography>
                        <Typography className={classes.content} onClick={onEnterAccounts}>
                            {accountsCount}
                            <ArrowRightIosIcon className={classes.arrow} />
                        </Typography>
                    </div>
                    <div className={classes.item}>
                        <Typography>{t('popups_connected_wallets')}</Typography>
                        <Typography className={classes.content} onClick={onEnterWallets}>
                            {walletsCount}
                            <ArrowRightIosIcon className={classes.arrow} />
                        </Typography>
                    </div>
                </div>
                <Navigator />
            </>
        )
    },
)
