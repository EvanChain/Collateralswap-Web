// Test file to verify wallet connection fixes
// Run this in browser console to test wallet connection

console.log('Testing wallet connection...');

// Check if Web3 provider is available
if (typeof window !== 'undefined' && window.ethereum) {
    console.log('✓ Ethereum provider found');

    // Test wallet connection
    window.ethereum.request({ method: 'eth_requestAccounts' })
        .then((accounts) => {
            console.log('✓ Wallet connected:', accounts[0]);
            return window.ethereum.request({ method: 'eth_chainId' });
        })
        .then((chainId) => {
            console.log('✓ Chain ID:', chainId);
            console.log('✓ Is Sepolia (0x61a):', chainId === '0xaa36a7');
        })
        .catch((error) => {
            console.error('✗ Wallet connection failed:', error);
        });
} else {
    console.error('✗ No Ethereum provider found');
}

// Test React component state
setTimeout(() => {
    const debugElement = document.querySelector('[class*="bg-yellow-100"]');
    if (debugElement) {
        console.log('✓ Debug info found:', debugElement.textContent);
    } else {
        console.log('✗ Debug info not found');
    }
}, 3000);
