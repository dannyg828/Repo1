'use client';

import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts';
import { Wallet, DollarSign, TrendingUp, ShieldCheck, Layers } from 'lucide-react';
import { WALLETS } from '@/lib/constants';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'cvx' | 'aero' | 'rsup' | 'yb'>('overview');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/portfolio')
      .then((res) => res.json())
      .then((json) => setData(json));
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p className="text-slate-400 text-sm animate-pulse">Loading Sovereign Holding Dashboard...</p>
      </div>
    );
  }

  const selectedAsset = activeTab !== 'overview' ? data.assets[activeTab] : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Bar */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-50 flex items-center gap-2">
              <ShieldCheck className="text-emerald-400 h-6 w-6" />
              Sovereign Capital Holding
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Multi-Wallet Infrastructure • 2 Connected Vaults
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            {WALLETS.map((w, idx) => (
              <div key={idx} className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
                <Wallet className="h-3.5 w-3.5 text-blue-400" />
                <span className="font-mono text-slate-300">{w.short}</span>
              </div>
            ))}
          </div>
        </header>

        {/* Navigation Tabs */}
        <nav className="flex gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
          {['overview', 'cvx', 'aero', 'rsup', 'yb'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-md text-xs font-medium uppercase tracking-wider transition-all ${
                activeTab === tab
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {tab === 'overview' ? 'Consolidated Overview' : tab.toUpperCase()}
            </button>
          ))}
        </nav>

        {/* Overview Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Total Capital USD</span>
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                </div>
                <p className="text-2xl font-bold text-slate-50 mt-2">
                  ${data.summary.totalCapitalUSD.toLocaleString()}
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Annualized Cash Flow</span>
                  <TrendingUp className="h-4 w-4 text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-slate-50 mt-2">
                  ${data.summary.annualizedCashFlowUSD.toLocaleString()} / yr
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Blended Portfolio APR</span>
                  <Layers className="h-4 w-4 text-purple-400" />
                </div>
                <p className="text-2xl font-bold text-emerald-400 mt-2">
                  {data.summary.blendedAPR}
                </p>
              </div>
            </div>

            {/* Assets Grid */}
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Asset Breakdown</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(data.assets).map(([key, asset]: [string, any]) => (
                <div 
                  key={key} 
                  onClick={() => setActiveTab(key as any)}
                  className="bg-slate-900 border border-slate-800 p-5 rounded-xl hover:border-slate-700 cursor-pointer transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-100">{asset.name} ({asset.symbol})</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{asset.revenueSource}</p>
                    </div>
                    <span className="text-xs font-mono bg-slate-800 text-emerald-400 px-2.5 py-1 rounded">
                      {asset.apr} APR
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-3 text-xs">
                    <div>
                      <span className="text-slate-400">Principal Value: </span>
                      <span className="font-semibold text-slate-200">${asset.principalUSD.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Monthly Yield: </span>
                      <span className="font-semibold text-emerald-400">${asset.monthlyCashFlowUSD}/mo</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dedicated Asset Page (Dual Chart View) */}
        {selectedAsset && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-50">{selectedAsset.name} ({selectedAsset.symbol})</h2>
                <p className="text-xs text-slate-400 mt-1">Revenue Mechanism: {selectedAsset.revenueSource}</p>
              </div>
              <div className="flex gap-4 text-xs">
                <div className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block">Position Value</span>
                  <span className="font-bold text-slate-100">${selectedAsset.principalUSD.toLocaleString()}</span>
                </div>
                <div className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block">Monthly Yield</span>
                  <span className="font-bold text-emerald-400">${selectedAsset.monthlyCashFlowUSD}/mo</span>
                </div>
                <div className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block">Current APR</span>
                  <span className="font-bold text-purple-400">{selectedAsset.apr}</span>
                </div>
              </div>
            </div>

            {/* Chart 1: Principal Value */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                1. Principal Value History (USD Capital)
              </h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={selectedAsset.history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                    <Area type="monotone" dataKey="principalUSD" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Revenue Cash Flow */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                2. Monthly Cash Flow & Revenue Yield (USD)
              </h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={selectedAsset.history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                    <Area type="monotone" dataKey="revenueUSD" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}