import { NextResponse } from 'next/server';

// 1. Enter your EVM wallet address to auto-fetch your live Base AERO balance
const WALLET_ADDRESS = '0xDbc9e41D5E083884f2Cb172bb3a17aB09a528101';

// 2. Token quantities (123k vlCVX, RSUP, YB, and fallback AERO)
const TOKEN_QUANTITIES = {
  cvx: 142000,   // Exact 123k vlCVX position
  aero: 220000,   // Fallback AERO quantity if wallet check fails
  rsup: 166000,  // RSUP token count
  yb: 300000      // YB token count
};

// 3. GeckoTerminal Liquidity Pool Addresses
const POOLS = {
  cvx: { chain: 'ethereum', geckoChain: 'eth', address: '0xb576491f1e6e5e62f1d8f26062ee822b40b0e0d4' },
  aero: { chain: 'base', geckoChain: 'base', address: '0x6cdcb1c4a4d1c3c6d054b27ac5b77e89eafb971d' },
  rsup: { chain: 'ethereum', geckoChain: 'eth', address: '0x419905009e4656fdc02418c7df35b1e61ed5f726' },
  yb: { chain: 'ethereum', geckoChain: 'eth', address: '0x01791f726b4103694969820be083196cc7c045ff' }
};

// Helper 1: Fetch live AERO wallet balance from Base RPC
async function getBaseAeroBalance(wallet: string, fallbackQty: number) {
  if (!wallet || wallet === '0xYOUR_WALLET_ADDRESS_HERE') return fallbackQty;
  try {
    const cleanAddr = wallet.toLowerCase().replace('0x', '').padStart(64, '0');
    const data = `0x70a08231${cleanAddr}`;

    const res = await fetch('https://mainnet.base.org', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [{ to: '0x940181a94a35a256b274e232856ab82d5536e0d2', data }, 'latest']
      }),
      next: { revalidate: 30 }
    });

    const json = await res.json();
    if (json?.result && json.result !== '0x') {
      const rawVal = BigInt(json.result);
      return Number(rawVal / BigInt(10 ** 14)) / 10000;
    }
    return fallbackQty;
  } catch (err) {
    console.error('Error fetching Base AERO balance:', err);
    return fallbackQty;
  }
}

// Helper 2: Fetch current spot price from pool
async function getPoolPrice(chain: string, geckoChain: string, poolAddress: string, fallbackPrice: number) {
  const poolLower = poolAddress.toLowerCase();
  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/pairs/${chain}/${poolLower}`, {
      next: { revalidate: 15 }
    });
    const json = await res.json();
    const priceStr = json?.pair?.priceUsd || json?.pairs?.[0]?.priceUsd;
    if (priceStr) return parseFloat(priceStr);
  } catch (e) {
    console.error(`DexScreener failed for pool ${poolLower}:`, e);
  }

  try {
    const res = await fetch(`https://api.geckoterminal.com/api/v2/networks/${geckoChain}/pools/${poolLower}`, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 15 }
    });
    const json = await res.json();
    const priceStr = json?.data?.attributes?.base_token_price_usd;
    if (priceStr) return parseFloat(priceStr);
  } catch (e) {
    console.error(`GeckoTerminal failed for pool ${poolLower}:`, e);
  }

  return fallbackPrice;
}

// Helper 3: Fetch 30-day Daily Historical OHLC Candles from GeckoTerminal
async function getHistoricalCandles(geckoChain: string, poolAddress: string, tokenQty: number, monthlyYieldUSD: number) {
  const poolLower = poolAddress.toLowerCase();
  try {
    const res = await fetch(
      `https://api.geckoterminal.com/api/v2/networks/${geckoChain}/pools/${poolLower}/ohlcv/day?aggregate=1&limit=30`,
      {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 300 } // Cache historical candles for 5 minutes
      }
    );
    const json = await res.json();
    const ohlcList = json?.data?.attributes?.ohlcv_list;

    if (Array.isArray(ohlcList) && ohlcList.length > 0) {
      // Reconstruct chronological order (oldest to newest)
      return ohlcList.slice().reverse().map((candle: any) => {
        const timestamp = candle[0] * 1000;
        const closePrice = candle[4];
        const dateStr = new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        return {
          month: dateStr,
          principalUSD: Math.round(closePrice * tokenQty),
          revenueUSD: Math.round(monthlyYieldUSD / 30) // Daily yield distribution
        };
      });
    }
  } catch (err) {
    console.error(`Failed to fetch OHLC history for ${poolLower}:`, err);
  }

  // Fallback if GeckoTerminal OHLC rate limits
  return [
    { month: 'Jul 10', principalUSD: Math.round(tokenQty * 2.20), revenueUSD: Math.round(monthlyYieldUSD / 30) },
    { month: 'Jul 20', principalUSD: Math.round(tokenQty * 2.35), revenueUSD: Math.round(monthlyYieldUSD / 30) },
    { month: 'Aug 01', principalUSD: Math.round(tokenQty * 2.40), revenueUSD: Math.round(monthlyYieldUSD / 30) }
  ];
}

export async function GET() {
  const [cvxPrice, aeroPrice, rsupPrice, ybPrice, liveAeroQty] = await Promise.all([
    getPoolPrice(POOLS.cvx.chain, POOLS.cvx.geckoChain, POOLS.cvx.address, 2.42),
    getPoolPrice(POOLS.aero.chain, POOLS.aero.geckoChain, POOLS.aero.address, 0.96),
    getPoolPrice(POOLS.rsup.chain, POOLS.rsup.geckoChain, POOLS.rsup.address, 0.10),
    getPoolPrice(POOLS.yb.chain, POOLS.yb.geckoChain, POOLS.yb.address, 0.16),
    getBaseAeroBalance(WALLET_ADDRESS, TOKEN_QUANTITIES.aero)
  ]);

  // Current Principal Values
  const cvxVal = Math.round(TOKEN_QUANTITIES.cvx * cvxPrice);
  const aeroVal = Math.round(liveAeroQty * aeroPrice);
  const rsupVal = Math.round(TOKEN_QUANTITIES.rsup * rsupPrice);
  const ybVal = Math.round(TOKEN_QUANTITIES.yb * ybPrice);

  // Cash Flows
  const cvxMonthly = Math.round(cvxVal * (0.153 / 12));
  const aeroMonthly = Math.round(aeroVal * (0.154 / 12));
  const rsupMonthly = Math.round(rsupVal * (0.112 / 12));
  const ybMonthly = Math.round(ybVal * (0.097 / 12));

  // Fetch true historical OHLC timelines for each pool
  const [cvxHistory, aeroHistory, rsupHistory, ybHistory] = await Promise.all([
    getHistoricalCandles(POOLS.cvx.geckoChain, POOLS.cvx.address, TOKEN_QUANTITIES.cvx, cvxMonthly),
    getHistoricalCandles(POOLS.aero.geckoChain, POOLS.aero.address, liveAeroQty, aeroMonthly),
    getHistoricalCandles(POOLS.rsup.geckoChain, POOLS.rsup.address, TOKEN_QUANTITIES.rsup, rsupMonthly),
    getHistoricalCandles(POOLS.yb.geckoChain, POOLS.yb.address, TOKEN_QUANTITIES.yb, ybMonthly)
  ]);

  const totalCapitalUSD = cvxVal + aeroVal + rsupVal + ybVal;
  const totalMonthlyYield = cvxMonthly + aeroMonthly + rsupMonthly + ybMonthly;
  const annualizedCashFlowUSD = totalMonthlyYield * 12;

  return NextResponse.json({
    summary: {
      totalCapitalUSD,
      annualizedCashFlowUSD,
      blendedAPR: totalCapitalUSD > 0 ? `${((annualizedCashFlowUSD / totalCapitalUSD) * 100).toFixed(1)}%` : "0.0%"
    },
    assets: {
      cvx: {
        name: "Convex Finance",
        symbol: "vlCVX",
        principalUSD: cvxVal,
        monthlyCashFlowUSD: cvxMonthly,
        apr: "15.3%",
        revenueSource: "Votium Bribes & Lock Rewards",
        history: cvxHistory
      },
      aero: {
        name: "Aerodrome Finance",
        symbol: "AERO",
        principalUSD: aeroVal,
        monthlyCashFlowUSD: aeroMonthly,
        apr: "15.4%",
        revenueSource: "40 Acres Pool Yields",
        history: aeroHistory
      },
      rsup: {
        name: "Resupply Protocol",
        symbol: "RSUP",
        principalUSD: rsupVal,
        monthlyCashFlowUSD: rsupMonthly,
        apr: "11.2%",
        revenueSource: "Mainnet Revenue Shares",
        history: rsupHistory
      },
      yb: {
        name: "Yield Basis",
        symbol: "YB",
        principalUSD: ybVal,
        monthlyCashFlowUSD: ybMonthly,
        apr: "9.7%",
        revenueSource: "Vault Optimization Fees",
        history: ybHistory
      }
    }
  });
}
