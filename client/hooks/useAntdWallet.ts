import { useAccount } from '@ant-design/web3';
import { useEffect, useState } from 'react';

export function useAntdWallet() {
    const { account } = useAccount();
    const [isConnected, setIsConnected] = useState(false);
    const [address, setAddress] = useState<string | null>(null);

    useEffect(() => {
        const connected = !!account?.address;
        setIsConnected(connected);
        setAddress(connected ? account.address : null);

        // Debug logging
        console.log('Wallet state updated:', {
            connected,
            address: account?.address,
            account
        });
    }, [account]);

    return {
        isConnected,
        address,
        account,
    };
}
