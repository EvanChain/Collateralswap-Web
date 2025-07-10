"use client"
import '@ant-design/v5-patch-for-react-19';

import React from "react";
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ConnectButton, Connector } from '@ant-design/web3';


export default function MainNav() {
  const pathname = usePathname()

  return (
    <header className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 p-4 md:p-8 bg-white border-b border-gray-200">
      <div className="flex items-center gap-8">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-accent-purple to-accent-pink text-transparent bg-clip-text">
          UnlockX
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
          {/* <Link
            href="/test" // Test page for mock testing
            className={cn(
              "text-lg font-medium transition-colors hover:text-gray-900",
              pathname === "/test" ? "text-gray-900" : "text-gray-600",
            )}
          >
            Tests
          </Link> */}
        </nav>
      </div>
      <Connector
        modalProps={{
          mode: 'simple',
        }}
      >
        <ConnectButton quickConnect />
      </Connector>
    </header >
  )
}
