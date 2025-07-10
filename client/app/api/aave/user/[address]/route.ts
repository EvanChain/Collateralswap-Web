import { NextRequest, NextResponse } from 'next/server';

// Aave API proxy to avoid CORS issues
export async function GET(
    request: NextRequest,
    { params }: { params: { address: string } }
) {
    const { address } = params;

    try {
        console.log('Proxy: Fetching Aave data for address:', address);

        // Validate address format
        if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
            return NextResponse.json(
                { error: 'Invalid Ethereum address format' },
                { status: 400 }
            );
        }

        // Try multiple data sources
        const dataSources = [
            // Aave official API
            {
                name: 'Aave Official API',
                url: `https://aave-api-v2.aave.com/data/users/${address}/summary?poolId=0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951`,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                } as Record<string, string>
            },
            // Alternative: DeFiLlama or other data provider
            {
                name: 'Alternative Data Source',
                url: `https://api.defillama.com/aave/user/${address}`,
                headers: {
                    'Content-Type': 'application/json',
                } as Record<string, string>
            }
        ];

        let userData = null;
        let usedSource = '';

        for (const source of dataSources) {
            try {
                console.log(`Proxy: Trying ${source.name}...`);
                const response = await fetch(source.url, {
                    method: 'GET',
                    headers: source.headers,
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log(`Proxy: Successfully fetched from ${source.name}`);
                    userData = data;
                    usedSource = source.name;
                    break;
                } else {
                    console.warn(`Proxy: ${source.name} failed with status:`, response.status);
                }
            } catch (sourceError) {
                console.warn(`Proxy: ${source.name} failed with error:`, sourceError);
            }
        }

        // If all sources fail, return sample data for development
        if (!userData) {
            if (process.env.NODE_ENV === 'development') {
                console.log('Proxy: All sources failed, returning sample data for development');
                userData = {
                    userReserves: [
                        {
                            underlyingAsset: '0x68194a729c2450ad26072b3d33adacbcef39d574',
                            scaledATokenBalance: '1000000000000000000',
                            scaledVariableDebt: '500000000000000000',
                            usageAsCollateralEnabledOnUser: true,
                            reserve: {
                                symbol: 'DAI',
                                name: 'Dai Stablecoin',
                                decimals: 18,
                                liquidityIndex: '1000000000000000000000000000',
                                variableBorrowIndex: '1000000000000000000000000000',
                                underlyingAsset: '0x68194a729c2450ad26072b3d33adacbcef39d574',
                                liquidityRate: '0',
                                variableBorrowRate: '0',
                            }
                        },
                        {
                            underlyingAsset: '0x6f14c02fc1f78322cfd7d707ab90f18bad3b54f5',
                            scaledATokenBalance: '500000000',
                            scaledVariableDebt: '0',
                            usageAsCollateralEnabledOnUser: true,
                            reserve: {
                                symbol: 'USDC',
                                name: 'USD Coin',
                                decimals: 6,
                                liquidityIndex: '1000000000000000000000000000',
                                variableBorrowIndex: '1000000000000000000000000000',
                                underlyingAsset: '0x6f14c02fc1f78322cfd7d707ab90f18bad3b54f5',
                                liquidityRate: '0',
                                variableBorrowRate: '0',
                            }
                        }
                    ]
                };
                usedSource = 'Sample Data';
            } else {
                return NextResponse.json(
                    { error: 'Failed to fetch user data from all sources' },
                    { status: 503 }
                );
            }
        }

        // Add metadata about the response
        const response = {
            ...userData,
            _meta: {
                source: usedSource,
                timestamp: new Date().toISOString(),
                address: address,
            }
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error('Proxy: Error fetching Aave user data:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
