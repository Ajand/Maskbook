import { useState } from 'react'
import { Web3TokenType } from '@masknet/web3-shared-base'
import type { EthereumTokenDetailedType } from '../types'
import { useFungibleTokenBalance } from './useFungibleTokenBalance'
import { useFungibleTokenDetailed } from './useFungibleTokenDetailed'
import { useNativeTokenDetailed } from './useNativeTokenDetailed'
import type { AsyncStateRetry } from 'react-use/lib/useAsyncRetry'

export function useFungibleTokenWatched(initialToken?: FungibleTokenInitial): FungibleTokenWatched {
    const nativeToken = useNativeTokenDetailed()
    const [token = nativeToken.value, setToken] = useState(initialToken)

    const [amount, setAmount] = useState('')
    const balance = useFungibleTokenBalance(token?.type ?? Web3TokenType.Native, token?.address ?? '')
    const detailed = useFungibleTokenDetailed(token?.type ?? Web3TokenType.Native, token?.address ?? '')

    return {
        amount,
        token: detailed,
        balance,
        setAmount,
        setToken,
    }
}

export interface FungibleTokenWatched {
    amount: string
    token: AsyncStateRetry<EthereumTokenDetailedType<Web3TokenType.Native | Web3TokenType.ERC20> | undefined>
    balance: AsyncStateRetry<string | undefined>
    setAmount: (x: string) => void
    setToken: (x: FungibleTokenInitial) => void
}
export interface FungibleTokenInitial {
    type: Web3TokenType.ERC20 | Web3TokenType.Native
    address: string
}
