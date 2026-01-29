import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const timeframe = searchParams.get('timeframe') || '5min'

    const { data, error } = await supabase
      .from('token_flows')
      .select('*')
      .eq('timeframe', timeframe)
      .order('net_flows', { ascending: false })
      .limit(50)

    if (error) throw error

    const formattedData = (data || []).map(token => ({
      symbol: token.symbol,
      price_change: parseFloat(token.price_change_pct || 0),
      market_cap: parseFloat(token.market_cap || 0),
      smart_wallets: token.smart_wallet_count || 0,
      volume: parseFloat(token.volume || 0),
      liquidity: parseFloat(token.liquidity || 0),
      inflows: parseFloat(token.inflows || 0),
      outflows: parseFloat(token.outflows || 0),
      net_flows: parseFloat(token.net_flows || 0),
    }))

    return NextResponse.json(formattedData)
  } catch (error) {
    console.error('Error in get-flows:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}
