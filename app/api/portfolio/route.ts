import { NextResponse } from 'next/server';
import { WALLETS } from '@/lib/constants';

export async function GET() {
  const data = {
    summary: {
      totalCapitalUSD: 72450,
      annualizedCashFlowUSD: 10220,
      blendedAPR: "14.1%"
    },
    wallets: WALLETS,
    assets: {
      cvx: {
        symbol: "CVX",
        name: "Convex Finance",
        balance: 14200,
        priceUSD: 2.10,
        principalUSD: 29820,
        monthlyCashFlowUSD: 380,
        apr: "15.3%",
        revenueSource: "Votium Bribe Auctions (vlCVX)",
        history: [
          { month: "Jan", principalUSD: 26000, revenueUSD: 310 },
          { month: "Feb", principalUSD: 27500, revenueUSD: 340 },
          { month: "Mar", principalUSD: 28200, revenueUSD: 360 },
          { month: "Apr", principalUSD: 29820, revenueUSD: 380 }
        ]
      },
      aero: {
        symbol: "AERO",
        name: "Aerodrome Finance",
        balance: 28500,
        priceUSD: 0.85,
        principalUSD: 24225,
        monthlyCashFlowUSD: 310,
        apr: "15.4%",
        revenueSource: "Epoch Vote Incentives (veAERO)",
        history: [
          { month: "Jan", principalUSD: 21000, revenueUSD: 250 },
          { month: "Feb", principalUSD: 22800, revenueUSD: 280 },
          { month: "Mar", principalUSD: 23500, revenueUSD: 295 },
          { month: "Apr", principalUSD: 24225, revenueUSD: 310 }
        ]
      },
      rsup: {
        symbol: "RSUP",
        name: "Resupply Protocol",
        balance: 85000,
        priceUSD: 0.12,
        principalUSD: 10200,
        monthlyCashFlowUSD: 95,
        apr: "11.2%",
        revenueSource: "Mainnet Revenue Shares",
        history: [
          { month: "Jan", principalUSD: 9100, revenueUSD: 80 },
          { month: "Feb", principalUSD: 9500, revenueUSD: 85 },
          { month: "Mar", principalUSD: 9800, revenueUSD: 90 },
          { month: "Apr", principalUSD: 10200, revenueUSD: 95 }
        ]
      },
      yb: {
        symbol: "YB",
        name: "Yield Basis",
        balance: 15400,
        priceUSD: 0.53,
        principalUSD: 8205,
        monthlyCashFlowUSD: 66,
        apr: "9.7%",
        revenueSource: "Vault Optimization Fees",
        history: [
          { month: "Jan", principalUSD: 7500, revenueUSD: 55 },
          { month: "Feb", principalUSD: 7800, revenueUSD: 60 },
          { month: "Mar", principalUSD: 8000, revenueUSD: 62 },
          { month: "Apr", principalUSD: 8205, revenueUSD: 66 }
        ]
      }
    }
  };

  return NextResponse.json(data);
}
