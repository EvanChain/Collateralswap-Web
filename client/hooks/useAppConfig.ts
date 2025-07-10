// React hook for configuration management and validation
import { useEffect, useState } from 'react'
import { validateConfig } from '../config/appConfig'

interface ConfigStatus {
    isValid: boolean
    errors: string[]
    warnings: string[]
}

export function useAppConfig() {
    const [configStatus, setConfigStatus] = useState<ConfigStatus>({
        isValid: false,
        errors: [],
        warnings: []
    })

    useEffect(() => {
        const checkConfig = () => {
            const isValid = validateConfig()
            const errors: string[] = []
            const warnings: string[] = []

            // Additional runtime checks
            if (typeof window !== 'undefined') {
                // Check if Web3 is available
                if (!window.ethereum) {
                    warnings.push('MetaMask or Web3 wallet not detected')
                }

                // Check environment
                const isDev = process.env.NODE_ENV === 'development'
                if (isDev) {
                    warnings.push('Running in development mode')
                }
            }

            setConfigStatus({
                isValid,
                errors,
                warnings
            })
        }

        checkConfig()
    }, [])

    return configStatus
}

// Hook for checking wallet connection
export function useWalletConnection() {
    const [isConnected, setIsConnected] = useState(false)
    const [address, setAddress] = useState<string | null>(null)
    const [chainId, setChainId] = useState<number | null>(null)

    useEffect(() => {
        const checkConnection = async () => {
            if (typeof window !== 'undefined' && window.ethereum) {
                try {
                    const accounts = await window.ethereum.request({
                        method: 'eth_accounts'
                    })

                    if (accounts.length > 0) {
                        setIsConnected(true)
                        setAddress(accounts[0])

                        const chainId = await window.ethereum.request({
                            method: 'eth_chainId'
                        })
                        setChainId(parseInt(chainId, 16))
                    }
                } catch (error) {
                    console.error('Error checking wallet connection:', error)
                }
            }
        }

        checkConnection()

        // Listen for account changes
        if (typeof window !== 'undefined' && window.ethereum) {
            const handleAccountsChanged = (accounts: string[]) => {
                if (accounts.length > 0) {
                    setIsConnected(true)
                    setAddress(accounts[0])
                } else {
                    setIsConnected(false)
                    setAddress(null)
                }
            }

            const handleChainChanged = (chainId: string) => {
                setChainId(parseInt(chainId, 16))
            }

            window.ethereum.on('accountsChanged', handleAccountsChanged)
            window.ethereum.on('chainChanged', handleChainChanged)

            return () => {
                window.ethereum?.removeListener('accountsChanged', handleAccountsChanged)
                window.ethereum?.removeListener('chainChanged', handleChainChanged)
            }
        }
    }, [])

    const connectWallet = async () => {
        if (typeof window !== 'undefined' && window.ethereum) {
            try {
                const accounts = await window.ethereum.request({
                    method: 'eth_requestAccounts'
                })

                if (accounts.length > 0) {
                    setIsConnected(true)
                    setAddress(accounts[0])
                    return accounts[0]
                }
            } catch (error) {
                console.error('Error connecting wallet:', error)
                throw error
            }
        } else {
            throw new Error('MetaMask not installed')
        }
    }

    return {
        isConnected,
        address,
        chainId,
        connectWallet
    }
}
