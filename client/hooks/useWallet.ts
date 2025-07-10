import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

export interface WalletState {
    isConnected: boolean;
    address: string | null;
    provider: ethers.providers.Web3Provider | null;
    isLoading: boolean;
    error: string | null;
}

export function useWallet() {
    const [walletState, setWalletState] = useState<WalletState>({
        isConnected: false,
        address: null,
        provider: null,
        isLoading: false,
        error: null,
    });

    // Check if wallet is already connected
    const checkConnection = useCallback(async () => {
        if (typeof window !== 'undefined' && window.ethereum) {
            try {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const accounts = await provider.listAccounts();

                if (accounts.length > 0) {
                    setWalletState({
                        isConnected: true,
                        address: accounts[0],
                        provider,
                        isLoading: false,
                        error: null,
                    });
                }
            } catch (error) {
                console.error('Error checking wallet connection:', error);
            }
        }
    }, []);

    // Connect wallet
    const connectWallet = useCallback(async () => {
        if (typeof window === 'undefined' || !window.ethereum) {
            setWalletState(prev => ({
                ...prev,
                error: 'MetaMask not installed',
            }));
            return;
        }

        setWalletState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send('eth_requestAccounts', []);
            const signer = provider.getSigner();
            const address = await signer.getAddress();

            setWalletState({
                isConnected: true,
                address,
                provider,
                isLoading: false,
                error: null,
            });
        } catch (error: any) {
            setWalletState(prev => ({
                ...prev,
                isLoading: false,
                error: error.message || 'Failed to connect wallet',
            }));
        }
    }, []);

    // Disconnect wallet
    const disconnectWallet = useCallback(() => {
        setWalletState({
            isConnected: false,
            address: null,
            provider: null,
            isLoading: false,
            error: null,
        });
    }, []);

    // Listen for account changes
    useEffect(() => {
        if (typeof window !== 'undefined' && window.ethereum) {
            const handleAccountsChanged = (accounts: string[]) => {
                if (accounts.length === 0) {
                    disconnectWallet();
                } else {
                    checkConnection();
                }
            };

            const handleChainChanged = () => {
                // Reload the page on chain change
                window.location.reload();
            };

            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);

            // Check connection on mount
            checkConnection();

            return () => {
                if (window.ethereum) {
                    window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                    window.ethereum.removeListener('chainChanged', handleChainChanged);
                }
            };
        }
    }, [checkConnection, disconnectWallet]);

    return {
        ...walletState,
        connectWallet,
        disconnectWallet,
    };
}
