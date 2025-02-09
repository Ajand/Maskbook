import { useMemo } from 'react'
import { ChainId } from '@masknet/web3-shared-evm'
import { usePostInfoDetails, Plugin, usePluginWrapper } from '@masknet/plugin-infra/content-script'
import { NetworkPluginID, useChainId } from '@masknet/plugin-infra/web3'
import { extractTextFromTypedMessage } from '@masknet/typed-message'
import { parseURL } from '@masknet/shared-base'
import { PreviewCard } from './PreviewCard'
import { base } from '../base'
import { PLUGIN_NAME, PLUGIN_META_KEY } from '../constants'
import { DonateDialog } from './DonateDialog'
import { EthereumChainBoundary } from '../../../web3/UI/EthereumChainBoundary'

const isGitcoin = (x: string): boolean => /^https:\/\/gitcoin.co\/grants\/\d+/.test(x)
const isGitCoinSupported = (chainId: ChainId) => [ChainId.Mainnet, ChainId.Matic].includes(chainId)

const sns: Plugin.SNSAdaptor.Definition = {
    ...base,
    init(signal) {},
    DecryptedInspector: function Comp(props) {
        const link = useMemo(() => {
            const x = extractTextFromTypedMessage(props.message)
            if (x.none) return null
            return parseURL(x.val).find(isGitcoin)
        }, [props.message])
        if (!link) return null
        return <Renderer url={link} />
    },
    CompositionDialogMetadataBadgeRender: new Map([[PLUGIN_META_KEY, () => PLUGIN_NAME]]),
    GlobalInjection() {
        return <DonateDialog />
    },
    PostInspector() {
        const links = usePostInfoDetails.mentionedLinks()

        const link = links.find(isGitcoin)
        if (!link) return null
        return <Renderer url={link} />
    },
}

function Renderer(props: React.PropsWithChildren<{ url: string }>) {
    const [id = ''] = props.url.match(/\d+/) ?? []
    const chainId = useChainId(NetworkPluginID.PLUGIN_EVM)
    usePluginWrapper(true)
    return (
        <EthereumChainBoundary chainId={isGitCoinSupported(chainId) ? chainId : ChainId.Mainnet}>
            <PreviewCard id={id} />
        </EthereumChainBoundary>
    )
}

export default sns
