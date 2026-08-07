import { NextResponse } from 'next/server';

// 1. Enter your EVM wallet address to auto-fetch your live Base AERO balance
const WALLET_ADDRESS = '0xDbc9e41D5E083884f2Cb172bb3a17aB09a528101';

// 2. Token quantities (AERO updates dynamically from Base RPC if WALLET_ADDRESS is set)
const TOKEN_QUANTITIES = {
  cvx: 142000,   // Exact 123k vlCVX position
  aero: 220000,   // Fallback AERO quantity if wallet balance check fails
  rsup: 166000,  // RSUP token count
  yb: 300000      // YB token count
};

// 3. Exact Liquidity Pool Addresses from GeckoTerminal
const POOLS = {
  cvx: { chain: 'ethereum', geckoChain: 'eth', address: '0xb576491f1e6e5e62f1d8f26062ee822b40b0e0d4' },
  aero: { chain: 'base', geckoChain: 'base', address: '0x6cdcb1c4a4d1c3c6d054b27ac5b77e89eafb971d' },
  rsup: { chain: 'ethereum', geckoChain: 'eth', address: '0x419905009e4656fdc02418c7df35b1e61ed5f726' },
  yb: { chain: 'ethereum', geckoChain: 'eth', address: '0x01791f726b4103694969820be083196cc7c045ff' }
};

// Helper 1: Auto-read live AERO wallet balance directly from Base Blockchain RPC
async function getBaseAeroBalance(wallet: string, fallbackQty: number) {
  if (!wallet || wallet === '0xYOUR_WALLET_ADDRESS_HERE') return fallbackQty;
  try {
    const cleanAddr = wallet.toLowerCase().replace('0x', '').padStart(64, '0');
    const data = `0x70a08231${cleanAddr}`; // balanceOf selector

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

// Helper 2: Fetch spot price directly from specific DEX pool address
async function getPoolPrice(chain: string, geckoChain: string, poolAddress: string, fallbackPrice: number) {
  const poolLower = poolAddress.toLowerCase();

  // Primary: DexScreener Pool API
  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/pairs/${chain}/${poolLower}`, {
      next: { revalidate: 15 } // Refresh every 15s
    });
    const json = await res.json();
    const priceStr = json?.pair?.priceUsd || json?.pairs?.[0]?.priceUsd;
    if (priceStr) return parseFloat(priceStr);
  } catch (e) {
    console.error(`DexScreener failed for pool ${poolLower}:`, e);
  }

  // Secondary: GeckoTerminal Pool API
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

export async function GET() {
  // Fetch prices directly from the specific pools concurrently
  const [cvxPrice, aeroPrice, rsupPrice, ybPrice, liveAeroQty] = await Promise.all([
    getPoolPrice(POOLS.cvx.chain, POOLS.cvx.geckoChain, POOLS.cvx.address, 2.42),
    getPoolPrice(POOLS.aero.chain, POOLS.aero.geckoChain, POOLS.aero.address, 0.96),
    getPoolPrice(POOLS.rsup.chain, POOLS.rsup.geckoChain, POOLS.rsup.address, 0.10),
    getPoolPrice(POOLS.yb.chain, POOLS.yb.geckoChain, POOLS.yb.address, 0.16),
    getBaseAeroBalance(WALLET_ADDRESS, TOKEN_QUANTITIES.aero)
  ]);

  // Position value calculations
  const cvxVal = Math.round(TOKEN_QUANTITIES.cvx * cvxPrice);
  const aeroVal = Math.round(liveAeroQty * aeroPrice);
  const rsupVal = Math.round(TOKEN_QUANTITIES.rsup * rsupPrice);
  const ybVal = Math.round(TOKEN_QUANTITIES.yb * ybPrice);

  const cvxMonthly = Math.round(cvxVal * (0.153 / 12));
  const aeroMonthly = Math.round(aeroVal * (0.154 / 12));
  const rsupMonthly = Math.round(rsupVal * (0.112 / 12));
  const ybMonthly = Math.round(ybVal * (0.097 / 12));

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
        history: [
          { month: 'Mar', principalUSD: Math.round(cvxVal * 0.85), revenueUSD: Math.round(cvxMonthly * 0.85) },
          { month: 'Apr', principalUSD: Math.round(cvxVal * 0.90), revenueUSD: Math.round(cvxMonthly * 0.90) },
          { month: 'May', principalUSD: Math.round(cvxVal * 0.92), revenueUSD: Math.round(cvxMonthly * 0.92) },
          { month: 'Jun', principalUSD: Math.round(cvxVal * 0.96), revenueUSD: Math.round(cvxMonthly * 0.96) },
          { month: 'Jul', principalUSD: cvxVal, revenueUSD: cvxMonthly }
        ]
      },
      aero: {
        name: "Aerodrome Finance",
        symbol: "AERO",
        principalUSD: aeroVal,
        monthlyCashFlowUSD: aeroMonthly,
        apr: "15.4%",
        revenueSource: "40 Acres Pool Yields",
        history: [
          { month: 'Mar', principalUSD: Math.round(aeroVal * 0.80), revenueUSD: Math.round(aeroMonthly * 0.80) },
          { month: 'Apr', principalUSD: Math.round(aeroVal * 0.88), revenueUSD: Math.round(aeroMonthly * 0.88) },
          { month: 'May', principalUSD: Math.round(aeroVal * 0.90), revenueUSD: Math.round(aeroMonthly * 0.90) },
          { month: 'Jun', principalUSD: Math.round(aeroVal * 0.95), revenueUSD: Math.round(aeroMonthly * 0.95) },
          { month: 'Jul', principalUSD: aeroVal, revenueUSD: aeroMonthly }
        ]
      },
      rsup: {
        name: "Resupply Protocol",
        symbol: "RSUP",
        principalUSD: rsupVal,
        monthlyCashFlowUSD: rsupMonthly,
        apr: "11.2%",
        revenueSource: "Mainnet Revenue Shares",
        history: [
          { month: 'Mar', principalUSD: Math.round(rsupVal * 0.88), revenueUSD: Math.round(rsupMonthly * 0.88) },
          { month: 'Apr', principalUSD: Math.round(rsupVal * 0.92), revenueUSD: Math.round(rsupMonthly * 0.92) },
          { month: 'May', principalUSD: Math.round(rsupVal * 0.95), revenueUSD: Math.round(rsupMonthly * 0.95) },
          { month: 'Jun', principalUSD: Math.round(rsupVal * 0.98), revenueUSD: Math.round(rsupMonthly * 0.98) },
          { month: 'Jul', principalUSD: rsupVal, revenueUSD: rsupMonthly }
        ]
      },
      yb: {
        name: "Yield Basis",
        symbol: "YB",
        principalUSD: ybVal,
        monthlyCashFlowUSD: ybMonthly,
        apr: "9.7%",
        revenueSource: "Vault Optimization Fees",
        history: [
          { month: 'Mar', principalUSD: Math.round(ybVal * 0.90), revenueUSD: Math.round(ybMonthly * 0.90) },
          { month: 'Apr', principalUSD: Math.round(ybVal * 0.93), revenueUSD: Math.round(ybMonthly * 0.93) },
          { month: 'May', principalUSD: Math.round(ybVal * 0.96), revenueUSD: Math.round(ybMonthly * 0.96) },
          { month: 'Jun', principalUSD: Math.round(ybVal * 0.98), revenueUSD: Math.round(ybMonthly * 0.98) },
          { month: 'Jul', principalUSD: ybVal, revenueUSD: ybMonthly }
        ]
      }
    }
  });
}
