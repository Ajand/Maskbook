import { rightShift, Web3TokenType, FungibleTokenDetailed } from '@masknet/web3-shared-base'
import { isSameAddress, useTokenConstants, useTokenTransferCallback } from '@masknet/web3-shared-evm'
import { useCallback } from 'react'
import type { TipTuple } from './type'

export function useTokenTip(recipient: string, token: FungibleTokenDetailed | null, amount: string): TipTuple {
    const { NATIVE_TOKEN_ADDRESS } = useTokenConstants()

    const isNativeToken = isSameAddress(token?.address, NATIVE_TOKEN_ADDRESS)

    const assetType = isNativeToken ? Web3TokenType.Native : Web3TokenType.ERC20
    const [transferState, transferCallback] = useTokenTransferCallback(assetType, token?.address || '')

    const sendTip = useCallback(async () => {
        const transferAmount = rightShift(amount || '0', token?.decimals || 0).toFixed()
        await transferCallback(transferAmount, recipient)
    }, [amount, token, recipient, transferCallback])

    return [transferState, sendTip]
}
