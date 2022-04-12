import Services from '../../extension/service'
import type { SocialNetworkUI } from '../types'

export function requestSNSAdaptorPermission(ui: SocialNetworkUI.Definition) {
    const req = ui.permission?.request()
    if (req) return req
    return Services.Helper.requestExtensionPermission({ origins: [...ui.declarativePermissions.origins] })
}

export function requestSNSAdaptorsPermission(uis: SocialNetworkUI.Definition[]) {
    const req = uis.filter((x) => !x.permission?.request())
    if (!req.length) return req
    return Services.Helper.requestExtensionPermission({
        origins: [...req.map((x) => x.declarativePermissions.origins).flat()],
    })
}
