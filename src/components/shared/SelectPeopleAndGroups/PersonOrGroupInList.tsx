import * as React from 'react'
import { Profile, Group } from '../../../database'
import { ListItem, Theme, ListItemAvatar, ListItemText } from '@material-ui/core'
import { DefaultComponentProps } from '@material-ui/core/OverridableComponent'
import { makeStyles } from '@material-ui/styles'
import { Avatar } from '../../../utils/components/Avatar'
import MuiAvatar from '@material-ui/core/Avatar/Avatar'
import GroupIcon from '@material-ui/icons/Group'
import { useFriendsList } from '../../DataSource/useActivatedUI'
import { ProfileIdentifier } from '../../../database/type'
import { geti18nString, useIntlListFormat } from '../../../utils/i18n'
import { isGroup } from './SelectPeopleAndGroupsUI'
import { useResolveSpecialGroupName } from './resolveSpecialGroupName'
import { useStylesExtends } from '../../custom-ui-helper'
import { ListItemTypeMap } from '@material-ui/core/ListItem'

export interface PersonOrGroupInListProps extends withClasses<KeysInferFromUseStyles<typeof useStyle>> {
    onClick: () => void
    disabled?: boolean
    showAtNetwork?: boolean
    ListItemProps?: Partial<DefaultComponentProps<ListItemTypeMap<{ button: true }, 'div'>>>
    item: Group | Profile
}
const useStyle = makeStyles((theme: Theme) => ({
    // ? I want to let the children of this element have no change to
    // ? extends the width of the parent element.
    // ? Only `grid` or `inline-grid` works. but why??
    root: { display: 'inline-grid' },
    overflow: {
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
    },
    networkHint: {
        color: theme.palette.grey[500],
    },
}))
/**
 * Item in the list
 */
export function PersonOrGroupInList(props: PersonOrGroupInListProps) {
    const classes = useStylesExtends(useStyle(), props)
    const nicknamePreviewsForGroup = useNickNamesFromList(isGroup(props.item) ? props.item.members : [])
    const listFormat = useIntlListFormat()

    const { disabled, ListItemProps: listItemProps, onClick, showAtNetwork } = props
    let name = ''
    let avatar: ReturnType<typeof Avatar>
    let secondaryText: string | undefined = undefined
    const groupName = useResolveSpecialGroupName(props.item)
    if (isGroup(props.item)) {
        const group = props.item
        name = groupName
        avatar = (
            <MuiAvatar>
                <GroupIcon />
            </MuiAvatar>
        )
        const joined = listFormat(nicknamePreviewsForGroup)
        const groupSize = group.members.length
        if (groupSize === 0) {
            secondaryText = geti18nString('person_or_group_in_list_0')
        } else if (nicknamePreviewsForGroup.length === 0) {
            secondaryText = geti18nString('person_or_group_in_list_many_no_preview', groupSize + '')
        } else if (groupSize > nicknamePreviewsForGroup.length) {
            secondaryText = geti18nString('person_or_group_in_list_many', [joined, groupSize + ''])
        } else {
            secondaryText = joined
        }
    } else {
        const person = props.item
        name = person.nickname || person.identifier.userId
        avatar = <Avatar person={person} />
        secondaryText = person.linkedPersona?.fingerprint.toLowerCase()
    }
    const withNetwork = (
        <>
            {name}
            <span className={classes.networkHint}> @ {props.item.identifier.network}</span>
        </>
    )
    return (
        <ListItem button disabled={disabled} onClick={onClick} {...listItemProps}>
            <ListItemAvatar>{avatar}</ListItemAvatar>
            <ListItemText
                classes={{
                    root: classes.root,
                    primary: classes.overflow,
                    secondary: classes.overflow,
                }}
                primary={showAtNetwork ? withNetwork : name}
                secondary={secondaryText}
            />
        </ListItem>
    )
}

function useNickNamesFromList(preview: readonly ProfileIdentifier[]) {
    const people = useFriendsList()
    const userWithNames = React.useMemo(() => people.filter(x => x.nickname), [people])

    const [x, y, z] = preview
    const [a] = React.useMemo(() => x && userWithNames.filter(w => w.identifier.equals(x)), [userWithNames, x]) || []
    const [b] = React.useMemo(() => y && userWithNames.filter(w => w.identifier.equals(y)), [userWithNames, y]) || []
    const [c] = React.useMemo(() => z && userWithNames.filter(w => w.identifier.equals(z)), [userWithNames, z]) || []
    return React.useMemo(() => [a, b, c].filter(x => x).map(x => x.nickname!), [a, b, c])
}
