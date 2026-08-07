import { NextResponse } from 'next/server';

// 1. Set your fixed token quantities here (and your wallet address for auto-reading)
const TOKEN_QUANTITIES = {
  cvx: 142000,   // Exact vlCVX count
  aero: 220000,   // Aerodrome quantity (or set wallet address below)
  rsup: 166000,  // Resupply token count
  yb: 300000      // Yield Basis token count
};

// Contract Addresses for GeckoTerminal
const CONTRACTS = {
  cvx: { network: 'eth', address: '0x4e3fbd56cd56c3e7221478a47e9994d53926f135' },
  aero: { network: 'base', address: '0x940181a94a35a256b274e232856ab82d5536e0d2' },
  rsup: { network: 'eth', address: '0x0000000000000000000000000000000000000000' }, // Update with RSUP token address
  yb: { network: 'eth', address: '0x0000000000000000000000000000000000000000' }     // Update with YB token address
};

// Helper function to fetch live price from GeckoTerminal
async function getGeckoTerminalPrice(network: string, address: string, fallbackPrice: number): Promise {
  if (address === '0x0000000000000000000000000000000000000000') return fallbackPrice;
  try {
    const res = await fetch(
      `https://api.geckoterminal.com/api/v2/simple/networks/${network}/token_price/${address}`,
      { next: { revalidate: 60 } } // Cache for 60s
    );
    const json = await res.json();
    const priceStr = json?.data?.attributes?.token_prices?.[address.toLowerCase()];
    return priceStr ? parseFloat(priceStr) : fallbackPrice;
  } catch (err) {
    console.error(`Error fetching price for ${address}:`, err);
    return fallbackPrice;
  }
}

export async function GET() {
  // Fetch live prices in parallel with fallback defaults
  const [cvxPrice, aeroPrice, rsupPrice, ybPrice] = await Promise.all([
    getGeckoTerminalPrice(CONTRACTS.cvx.network, CONTRACTS.cvx.address, 2.42),
    getGeckoTerminalPrice(CONTRACTS.aero.network, CONTRACTS.aero.address, 0.96),
    getGeckoTerminalPrice(CONTRACTS.rsup.network, CONTRACTS.rsup.address, 0.10),
    getGeckoTerminalPrice(CONTRACTS.yb.network, CONTRACTS.yb.address, 0.16)
  ]);

  // Calculate live principal values
  const cvxVal = Math.round(TOKEN_QUANTITIES.cvx * cvxPrice);
  const aeroVal = Math.round(TOKEN_QUANTITIES.aero * aeroPrice);
  const rsupVal = Math.round(TOKEN_QUANTITIES.rsup * rsupPrice);
  const ybVal = Math.round(TOKEN_QUANTITIES.yb * ybPrice);

  // Monthly yield estimates
  const cvxMonthly = Math.round(cvxVal * (0.153 / 12));
  const aeroMonthly = Math.round(aeroVal * (0.154 / 12));
  const rsupMonthly = Math.round(rsupVal * (0.112 / 12));
  const ybMonthly = Math.round(ybVal * (0.097 / 12));

  const totalCapitalUSD = cvxVal + aeroVal + rsupVal + ybVal;
  const totalMonthlyYield = cvxMonthly + aeroMonthly + rsupMonthly + ybMonthly;
  const annualizedCashFlowUSD = totalMonthlyYield * 12;

  const portfolioData = {
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
  };

  return NextResponse.json(portfolioData);
}
