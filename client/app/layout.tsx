import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import MainNav from "@/components/main-nav" // Import MainNav
import Web3Provider from "@/components/web3-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Personal Insurance Vault",
  description: "DeFi lending risk management and collateral exit solution",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Web3Provider>
          <div className="min-h-screen bg-white text-gray-900">
            <MainNav /> {/* Render MainNav here */}
            <main className="p-4 md:p-8 pt-0">{children}</main> {/* Children will be the page content */}
          </div>
        </Web3Provider>
      </body>
    </html>
  )
}
