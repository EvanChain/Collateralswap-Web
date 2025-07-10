// Configuration status component
"use client"

import { useAppConfig, useWalletConnection } from "../hooks/useAppConfig"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { AlertTriangle, CheckCircle, Wallet } from "lucide-react"

export function ConfigStatus() {
    const configStatus = useAppConfig()
    const { isConnected, address, chainId, connectWallet } = useWalletConnection()

    if (configStatus.isValid && configStatus.warnings.length === 0) {
        return null // Don't show anything if everything is fine
    }

    return (
        <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-orange-800">
                    <AlertTriangle className="h-5 w-5" />
                    Configuration Status
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {/* Configuration errors */}
                {configStatus.errors.length > 0 && (
                    <div>
                        <h4 className="font-medium text-red-800 mb-2">Configuration Errors:</h4>
                        <ul className="space-y-1">
                            {configStatus.errors.map((error, index) => (
                                <li key={index} className="flex items-center gap-2 text-sm text-red-700">
                                    <div className="w-1 h-1 bg-red-500 rounded-full" />
                                    {error}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Configuration warnings */}
                {configStatus.warnings.length > 0 && (
                    <div>
                        <h4 className="font-medium text-orange-800 mb-2">Warnings:</h4>
                        <ul className="space-y-1">
                            {configStatus.warnings.map((warning, index) => (
                                <li key={index} className="flex items-center gap-2 text-sm text-orange-700">
                                    <div className="w-1 h-1 bg-orange-500 rounded-full" />
                                    {warning}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Wallet connection status */}
                <div className="border-t pt-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Wallet className="h-4 w-4" />
                            <span className="text-sm font-medium">Wallet Status:</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {isConnected ? (
                                <>
                                    <Badge variant="default" className="bg-green-100 text-green-800">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Connected
                                    </Badge>
                                    {address && (
                                        <span className="text-xs text-gray-600">
                                            {address.slice(0, 6)}...{address.slice(-4)}
                                        </span>
                                    )}
                                </>
                            ) : (
                                <>
                                    <Badge variant="secondary">Not Connected</Badge>
                                    <Button
                                        size="sm"
                                        onClick={connectWallet}
                                        className="h-6 px-2 text-xs"
                                    >
                                        Connect
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                    {chainId && (
                        <div className="text-xs text-gray-600 mt-1">
                            Chain ID: {chainId}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
