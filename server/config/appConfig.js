const orderBookAddress = process.env.ORDER_BOOK_ADDRESS || 'YOUR_ORDER_BOOK_ADDRESS_HERE';
const web3ProviderUrl = process.env.WEB3_PROVIDER_URL || 'https://api.zan.top/node/v1/eth/mainnet/e6bd8c0b823d40bc88306c09ee218515/';

module.exports = {
    orderBookAddress,
    web3ProviderUrl,
    pivAddress,
};