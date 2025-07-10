"use client"
import React from 'react';
import {
    Sepolia,
    MetaMask,
    OkxWallet,
    TokenPocket,
    WagmiWeb3ConfigProvider,
    WalletConnect,
} from '@ant-design/web3-wagmi';
import { QueryClient } from '@tanstack/react-query';
import { http } from "wagmi";

const queryClient = new QueryClient();

interface Web3ProviderProps {
    children: React.ReactNode;
}

export default function Web3Provider({ children }: Web3ProviderProps) {
    return (
        <WagmiWeb3ConfigProvider
            eip6963={{
                autoAddInjectedWallets: true,
            }}
            ens
            chains={[Sepolia]}
            transports={{
                [Sepolia.id]: http(),
            }}
            walletConnect={{
                projectId: "c07c0051c2055890eade3556618e38a6",
            }}
            wallets={[
                MetaMask(),
                WalletConnect(),
                TokenPocket({
                    group: 'Popular',
                }),
                OkxWallet(),
            ]}
            queryClient={queryClient}
        >
            {children}
        </WagmiWeb3ConfigProvider>
    );
}
