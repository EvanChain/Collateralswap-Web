"use client"
import '@ant-design/v5-patch-for-react-19';

import React from "react";
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Mainnet,
  MetaMask,
  OkxWallet,
  TokenPocket,
  WagmiWeb3ConfigProvider,
  WalletConnect,
} from '@ant-design/web3-wagmi';
import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient();
import type { Account } from '@ant-design/web3';
import { http } from "wagmi";
import { ConnectButton, Connector } from '@ant-design/web3';


export default function MainNav() {
  const pathname = usePathname()
  const mockAccount = { address: '3ea2cfd153b8d8505097b81c87c11f5d05097c18' }
  const [account, setAccount] = React.useState<Account | undefined>(mockAccount);

  return (
    <header className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 p-4 md:p-8 bg-white border-b border-gray-200">
      <div className="flex items-center gap-8">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-accent-purple to-accent-pink text-transparent bg-clip-text">
          CollSwap
        </h1>
        <nav className="flex gap-4">
          <Link
            href="/" // Still points to the Swap page (root)
            className={cn(
              "text-lg font-medium transition-colors hover:text-gray-900",
              pathname === "/" ? "text-gray-900" : "text-gray-600",
            )}
          >
            Swap
          </Link>
          <Link
            href="/position" // Now points to the Positions page at /position
            className={cn(
              "text-lg font-medium transition-colors hover:text-gray-900",
              pathname === "/position" ? "text-gray-900" : "text-gray-600",
            )}
          >
            Positions
          </Link>
        </nav>
      </div>
      <WagmiWeb3ConfigProvider
        eip6963={{
          autoAddInjectedWallets: true,
        }}
        ens
        chains={[Mainnet]}
        transports={{
          [Mainnet.id]: http(),
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
        <Connector
          modalProps={{
            mode: 'simple',
          }}
        >
          <ConnectButton quickConnect />
        </Connector>
      </WagmiWeb3ConfigProvider>
      {/* <Button className="bg-gradient-to-r from-accent-purple to-accent-pink hover:from-accent-pink hover:to-accent-purple text-white font-semibold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(192,132,252,0.7)]">
        <Wallet className="mr-2 h-4 w-4" />
        Connect your wallet
      </Button> */}
    </header >
  )
}
