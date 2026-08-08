'use client';

import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { WALLETS } from '@/lib/constants';

type TabKey = 'overview' | 'cvx' | 'aero' | 'rsup' | 'yb';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [data, setData] = useState<any>(null);
  const [isPrivacy, setIsPrivacy] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  useEffect(() => {
    fetch('/api/portfolio')
      .then((res) => res.json())
      .then((json) => setData(json));
  }, []);

  const isDark = theme === 'dark';

  // Theme Styling Palette
  const c = {
    bg: isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900',
    card: isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm',
    subCard: isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200',
    border: isDark ? 'border-slate-800' : 'border-slate-200',
    textMuted: isDark ? 'text-slate-400' : 'text-slate-500',
    textMain: isDark ? 'text-slate-50' : 'text-slate-900',
    grid: isDark ? '#1e293b' : '#e2e8f0',
    axis: isDark ? '#64748b' : '#94a3b8',
    tooltipBg: isDark ? '#0f172a' : '#ffffff',
    tooltipBorder: isDark ? '#334155' : '#cbd5e1',
    tooltipText: isDark ? '#f8fafc' : '#0f172a'
  };

  const fmt = (val: number | string) => {
    if (isPrivacy) return '$••••••';
    if (typeof val === 'number') return `$${val.toLocaleString()}`;
    return val;
  };

  if (!data) {
    return (
      <div className={`min-h-screen ${c.bg} flex items-center justify-center p-6`}>
        <p className={`${c.textMuted} text-sm animate-pulse`}>Loading AeroLlama Holdings Dashboard...</p>
      </div>
    );
  }

  const selectedAsset = activeTab !== 'overview' ? data.assets[activeTab] : null;

  return (
    <div className={`min-h-screen ${c.bg} p-6 font-sans transition-colors duration-200`}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <header className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border-b ${c.border} pb-6`}>
          <div>
            <h1 className={`text-2xl font-bold tracking-tight ${c.textMain}`}>AeroLlama Holdings</h1>
            <p className={`text-xs ${c.textMuted} mt-1`}>Multi-Wallet Infrastructure • 2 Connected Vaults</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            
              href="/administrator"
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${c.card} ${c.textMuted} hover:${c.textMain}`}
            >
              Administrator
            </a>
            <button
              onClick={() => setIsPrivacy(!isPrivacy)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                isPrivacy
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : `${c.card} ${c.textMuted} hover:${c.textMain}`
              }`}
            >
              {isPrivacy ? '🔒 Privacy On' : '👁️ Privacy Off'}
            </button>
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className={`px-3 py-1.5 rounded-lg border ${c.card} ${c.textMuted} hover:${c.textMain} transition-all`}
            >
              {isDark ? '☀️ Light' : '🌙 Dark'}
            </button>
            {WALLETS.map((w: any, idx: number) => (
              <div key={idx} className={`${c.card} px-3 py-1.5 rounded-lg flex items-center gap-2`}>
                <span className={`font-mono ${c.textMuted}`}>{w.short}</span>
              </div>
            ))}
          </div>
        </header>

        {/* Nav */}
        <nav className={`flex gap-2 border-b ${c.border} pb-3 overflow-x-auto`}>
          {(['overview', 'cvx', 'aero', 'rsup', 'yb'] as TabKey[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-xs font-medium uppercase tracking-wider transition-all ${
                activeTab === tab
                  ? isDark
                    ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : `${c.textMuted} hover:${c.textMain}`
              }`}
            >
              {tab === 'overview' ? 'Consolidated Overview' : tab.toUpperCase()}
            </button>
          ))}
        </nav>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`${c.card} p-5 rounded-xl`}>
                <span className={`${c.textMuted} text-xs`}>Total Capital USD</span>
                <p className={`text-2xl font-bold ${c.textMain} mt-2`}>{fmt(data.summary.totalCapitalUSD)}</p>
              </div>
              <div className={`${c.card} p-5 rounded-xl`}>
                <span className={`${c.textMuted} text-xs`}>Annualized Cash Flow</span>
                <p className={`text-2xl font-bold ${c.textMain} mt-2`}>
                  {isPrivacy ? '$••••••' : `$${data.summary.annualizedCashFlowUSD.toLocaleString()} / yr`}
                </p>
              </div>
              <div className={`${c.card} p-5 rounded-xl`}>
                <span className={`${c.textMuted} text-xs`}>Blended Portfolio APR</span>
                <p className="text-2xl font-bold text-emerald-500 mt-2">{data.summary.blendedAPR}</p>
              </div>
            </div>

            {/* Net Worth Over Time */}
            <div className={`${c.card} p-5 rounded-xl space-y-4`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-xs font-semibold ${c.textMuted} uppercase tracking-wider`}>
                  Net Worth Over Time
                </h3>
                <span className="text-xs text-blue-500 font-mono">Since Jan 1, 2026</span>
              </div>
              <div className={isPrivacy ? 'h-64 w-full filter blur-md select-none transition-all' : 'h-64 w-full transition-all'}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.summary.netWorthHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
                    <XAxis dataKey="date" stroke={c.axis} fontSize={11} />
                    <YAxis
                      stroke={c.axis}
                      fontSize={11}
                      domain={[(min: number) => Math.floor(min * 0.95), (max: number) => Math.ceil(max * 1.05)]}
                      tickFormatter={(val: any) => (isPrivacy ? '•••' : `$${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`)}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: c.tooltipBg, borderColor: c.tooltipBorder, borderRadius: '0.5rem', color: c.tooltipText }}
                      formatter={(value: any) => [isPrivacy ? '$••••••' : `$${Number(value).toLocaleString()}`, 'Net Worth']}
                    />
                    <Area type="monotone" dataKey="totalUSD" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <h2 className={`text-sm font-semibold ${c.textMuted} uppercase tracking-wider`}>Asset Breakdown</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(data.assets).map(([key, asset]: [string, any]) => (
                <div
                  key={key}
                  onClick={() => setActiveTab(key as TabKey)}
                  className={`${c.card} p-5 rounded-xl hover:border-emerald-500/50 cursor-pointer transition-all space-y-3`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`font-bold ${c.textMain}`}>{asset.name} ({asset.symbol})</h3>
                      <p className={`text-xs ${c.textMuted} mt-0.5`}>{asset.revenueSource}</p>
                    </div>
                    <span className="text-xs font-mono bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded">{asset.apr} APR</span>
                  </div>
                  <div className={`flex justify-between border-t ${c.border} pt-3 text-xs`}>
                    <div>
                      <span className={c.textMuted}>Principal Value: </span>
                      <span className={`font-semibold ${c.textMain}`}>{fmt(asset.principalUSD)}</span>
                    </div>
                    <div>
                      <span className={c.textMuted}>Monthly Yield: </span>
                      <span className="font-semibold text-emerald-500">
                        {isPrivacy ? '$••••••' : `$${asset.monthlyCashFlowUSD.toLocaleString()}/mo`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab !== 'overview' && selectedAsset && (
          <div className="space-y-6">
            <div className={`${c.card} p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4`}>
              <div>
                <h2 className={`text-xl font-bold ${c.textMain}`}>{selectedAsset.name} ({selectedAsset.symbol})</h2>
                <p className={`text-xs ${c.textMuted} mt-1`}>Revenue Mechanism: {selectedAsset.revenueSource}</p>
              </div>
              <div className="flex gap-4 text-xs">
                <div className={`${c.subCard} px-3 py-2 rounded-lg`}>
                  <span className={`${c.textMuted} block`}>Position Value</span>
                  <span className={`font-bold ${c.textMain}`}>{fmt(selectedAsset.principalUSD)}</span>
                </div>
                <div className={`${c.subCard} px-3 py-2 rounded-lg`}>
                  <span className={`${c.textMuted} block`}>Monthly Yield</span>
                  <span className="font-bold text-emerald-500">
                    {isPrivacy ? '$••••••' : `$${selectedAsset.monthlyCashFlowUSD.toLocaleString()}/mo`}
                  </span>
                </div>
                <div className={`${c.subCard} px-3 py-2 rounded-lg`}>
                  <span className={`${c.textMuted} block`}>Current APR</span>
                  <span className="font-bold text-purple-500">{selectedAsset.apr}</span>
                </div>
              </div>
            </div>

            {/* Graph 1: Principal Value */}
            <div className={`${c.card} p-5 rounded-xl space-y-4`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-xs font-semibold ${c.textMuted} uppercase tracking-wider`}>
                  1. Historical Position Value (USD Volatility)
                </h3>
                <span className="text-xs text-blue-500 font-mono">6-12 Month Timeline</span>
              </div>
              <div className={isPrivacy ? 'h-64 w-full filter blur-md select-none transition-all' : 'h-64 w-full transition-all'}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={selectedAsset.history}>
                    <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
                    <XAxis dataKey="month" stroke={c.axis} fontSize={11} />
                    <YAxis
                      stroke={c.axis}
                      fontSize={11}
                      domain={[(min: number) => Math.floor(min * 0.92), (max: number) => Math.ceil(max * 1.08)]}
                      tickFormatter={(val: any) => (isPrivacy ? '•••' : `$${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`)}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: c.tooltipBg, borderColor: c.tooltipBorder, borderRadius: '0.5rem', color: c.tooltipText }}
                      formatter={(value: any) => [isPrivacy ? '$••••••' : `$${Number(value).toLocaleString()}`, 'Position Value']}
                    />
                    <Area type="monotone" dataKey="principalUSD" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Graph 2: Yield */}
            <div className={`${c.card} p-5 rounded-xl space-y-4`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-xs font-semibold ${c.textMuted} uppercase tracking-wider`}>
                  2. Estimated Yield / Revenue Stream (USD)
                </h3>
                <span className="text-xs text-emerald-500 font-mono">Bribes & Yields</span>
              </div>
              <div className={isPrivacy ? 'h-64 w-full filter blur-md select-none transition-all' : 'h-64 w-full transition-all'}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={selectedAsset.history}>
                    <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
                    <XAxis dataKey="month" stroke={c.axis} fontSize={11} />
                    <YAxis
                      stroke={c.axis}
                      fontSize={11}
                      domain={[(min: number) => Math.floor(min * 0.85), (max: number) => Math.ceil(max * 1.15)]}
                      tickFormatter={(val: any) => (isPrivacy ? '•••' : `$${val}`)}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: c.tooltipBg, borderColor: c.tooltipBorder, borderRadius: '0.5rem', color: c.tooltipText }}
                      formatter={(value: any) => [isPrivacy ? '$••••••' : `$${Number(value).toLocaleString()}`, 'Yield']}
                    />
                    <Area type="monotone" dataKey="revenueUSD" stroke="#10b981" fill="#10b981" fillOpacity={0.25} strokeWidth={2} />
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
