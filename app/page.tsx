'use client'

import { useState, useEffect } from 'react'

const TIMEFRAMES = ['5MIN', '10MIN', '30MIN', '1H', '6H', '12H', '24H']

interface TokenData {
    symbol: string
    price_change: number
    market_cap: number
    smart_wallets: number
    volume: number
    liquidity: number
    inflows: number
    outflows: number
    net_flows: number
}

function formatNumber(num: number): string {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + 'M'
    } else if (num >= 1000) {
        return (num / 1000).toFixed(2) + 'K'
    } else {
        return num.toFixed(2)
    }
}

export default function Dashboard() {
    const [timeframe, setTimeframe] = useState('5MIN')
    const [data, setData] = useState<TokenData[]>([])
    const [loading, setLoading] = useState(false)

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/get-flows?timeframe=${timeframe.toLowerCase()}`)
            const json = await res.json()
            setData(json)
        } catch (error) {
            console.error('Error fetching data:', error)
            setData([])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, 30000) // auto-refresh every 30s
        return () => clearInterval(interval)
    }, [timeframe])

    return (
        <div className="min-h-screen bg-black text-green p-4 md:p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold mb-2 tracking-wide">
                    SOLANA MICROCAP SMART MONEY TRACKER
                </h1>
                <p className="text-sm opacity-80">
                    Powered by{' '}
                    <a
                        href="https://nsn.ai/gamefi?utm_source=tracker"
                        className="underline hover:text-green-400 transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        NANSEN
                    </a>
                </p>
            </div>

            {/* Timeframe Buttons */}
            <div className="flex flex-wrap gap-2 mb-6">
                {TIMEFRAMES.map(tf => (
                    <button
                        key={tf}
                        onClick={() => setTimeframe(tf)}
                        className={`px-4 py-2 border transition-all font-mono ${timeframe === tf
                                ? 'bg-green text-black border-green font-bold'
                                : 'border-green text-green hover:bg-green-darker'
                            }`}
                    >
                        {tf}
                    </button>
                ))}
                <button
                    onClick={fetchData}
                    className="px-4 py-2 border border-green text-green hover:bg-green-darker transition-all font-mono"
                >
                    REFRESH
                </button>
            </div>

            {/* Loading Indicator */}
            {loading && (
                <div className="text-center py-4 text-green animate-pulse">
                    Loading data...
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto -mx-4 md:mx-0">
                <div className="inline-block min-w-full align-middle">
                    <div className="overflow-hidden">
                        <table className="min-w-full border-collapse">
                            <thead>
                                <tr className="border-b border-green-dark">
                                    <th className="text-left p-3 sticky left-0 bg-black z-10 min-w-[80px]">SYMBOL</th>
                                    <th className="text-right p-3 min-w-[100px]">{timeframe} %</th>
                                    <th className="text-right p-3 min-w-[120px]">MARKETCAP</th>
                                    <th className="text-right p-3 min-w-[110px]">SM WALLETS</th>
                                    <th className="text-right p-3 min-w-[110px]">VOLUMES</th>
                                    <th className="text-right p-3 min-w-[110px]">LIQUIDITY</th>
                                    <th className="text-right p-3 min-w-[110px]">INFLOWS</th>
                                    <th className="text-right p-3 min-w-[110px]">OUTFLOWS</th>
                                    <th className="text-right p-3 min-w-[120px]">NET FLOWS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.length === 0 && !loading ? (
                                    <tr>
                                        <td colSpan={9} className="text-center py-8 text-green opacity-60">
                                            No data available. Click REFRESH to load data.
                                        </td>
                                    </tr>
                                ) : (
                                    data.map((token, idx) => (
                                        <tr
                                            key={`${token.symbol}-${idx}`}
                                            className="border-b border-green-dark/30 hover:bg-green-darker transition-colors"
                                        >
                                            <td className="p-3 sticky left-0 bg-black z-10 font-bold">
                                                {token.symbol}
                                            </td>
                                            <td className={`p-3 text-right font-mono ${token.price_change < 0 ? 'text-red' : 'text-green'}`}>
                                                {token.price_change.toFixed(2)}%
                                            </td>
                                            <td className="p-3 text-right font-mono">
                                                ${formatNumber(token.market_cap)}
                                            </td>
                                            <td className="p-3 text-right font-mono">
                                                {token.smart_wallets}
                                            </td>
                                            <td className="p-3 text-right font-mono">
                                                ${formatNumber(token.volume)}
                                            </td>
                                            <td className="p-3 text-right font-mono">
                                                ${formatNumber(token.liquidity)}
                                            </td>
                                            <td className="p-3 text-right text-green font-mono">
                                                ${formatNumber(token.inflows)}
                                            </td>
                                            <td className="p-3 text-right text-red font-mono">
                                                ${formatNumber(token.outflows)}
                                            </td>
                                            <td className={`p-3 text-right font-bold font-mono ${token.net_flows < 0 ? 'text-red' : 'text-green'}`}>
                                                ${formatNumber(token.net_flows)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
