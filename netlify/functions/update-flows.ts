import { Handler, schedule } from '@netlify/functions'
import { supabase } from '../../lib/supabase'

const NANSEN_API_KEY = process.env.NANSEN_API_KEY || ''
const TIMEFRAMES = ['5min', '10min', '30min', '1h', '6h', '12h', '24h']

async function fetchNansenData(timeframe: string): Promise<any[]> {
    try {
        const response = await fetch(
            `https://api.nansen.ai/v1/solana/smart-money?marketCapMax=5000000&timeframe=${timeframe}`,
            {
                headers: {
                    'Authorization': `Bearer ${NANSEN_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        )
        if (!response.ok) throw new Error(`Nansen API error: ${response.status}`)
        const data = await response.json()
        return data.tokens || []
    } catch (error) {
        console.error(`Error fetching Nansen data for ${timeframe}:`, error)
        return []
    }
}

export const handler: Handler = async () => {
    console.log('Fetching data from Nansen...')
    try {
        for (const timeframe of TIMEFRAMES) {
            const tokens = await fetchNansenData(timeframe)
            if (tokens.length === 0) continue

            // Remove stale records for this timeframe before inserting fresh data
            const { error: deleteError } = await supabase.from('token_flows').delete().eq('timeframe', timeframe)
            if (deleteError) {
                console.error(`Error deleting stale data for ${timeframe}:`, deleteError)
                continue
            }

            const rows = tokens.map((token: any) => ({
                symbol: token.symbol,
                mint_address: token.mintAddress,
                timeframe: timeframe,
                price_change_pct: token.price24hChange || 0,
                market_cap: token.marketCap ?? null,
                smart_wallet_count: token.smartWalletCount || 0,
                volume: token.volume || 0,
                liquidity: token.liquidity || 0,
                inflows: token.smartMoneyInflows || 0,
                outflows: token.smartMoneyOutflows || 0,
                net_flows: (token.smartMoneyInflows || 0) - (token.smartMoneyOutflows || 0),
            }))

            const { error } = await supabase.from('token_flows').insert(rows)
            if (error) {
                console.error(`Error inserting data for ${timeframe}:`, error)
            }
        }
        return { statusCode: 200, body: 'Success' }
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify(error) }
    }
}

export const updateFlowsScheduled = schedule('*/5 * * * *', handler)
