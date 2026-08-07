'use client';

import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts';
import { WALLETS } from '@/lib/constants';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'cvx' | 'aero' | 'rsup' | 'yb'>('overview');
  const [data, setData] = useState(null);
  const [isPrivacy, setIsPrivacy] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

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
    return React.createElement(
      'div',
      { className: `min-h-screen ${c.bg} flex items-center justify-center p-6` },
      React.createElement('p', { className: `${c.textMuted} text-sm animate-pulse` }, 'Loading AeroLlama Holdings Dashboard...')
    );
  }

  const selectedAsset = activeTab !== 'overview' ? data.assets[activeTab] : null;

  // Header Bar with Controls
  const header = React.createElement(
    'header',
    { className: `flex flex-col md:flex-row md:items-center justify-between gap-4 border-b ${c.border} pb-6` },
    React.createElement(
      'div',
      null,
      React.createElement('h1', { className: `text-2xl font-bold tracking-tight ${c.textMain}` }, 'AeroLlama Holdings'),
      React.createElement('p', { className: `text-xs ${c.textMuted} mt-1` }, 'Multi-Wallet Infrastructure • 2 Connected Vaults')
    ),
    React.createElement(
      'div',
      { className: 'flex flex-wrap items-center gap-3 text-xs' },
      React.createElement(
        'button',
        {
          onClick: () => setIsPrivacy(!isPrivacy),
          className: `px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
            isPrivacy 
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
              : `${c.card} ${c.textMuted} hover:${c.textMain}`
          }`
        },
        isPrivacy ? '🔒 Privacy On' : '👁️ Privacy Off'
      ),
      React.createElement(
        'button',
        {
          onClick: () => setTheme(isDark ? 'light' : 'dark'),
          className: `px-3 py-1.5 rounded-lg border ${c.card} ${c.textMuted} hover:${c.textMain} transition-all`
        },
        isDark ? '☀️ Light' : '🌙 Dark'
      ),
      WALLETS.map((w: any, idx: number) =>
        React.createElement(
          'div',
          { key: idx, className: `${c.card} px-3 py-1.5 rounded-lg flex items-center gap-2` },
          React.createElement('span', { className: `font-mono ${c.textMuted}` }, w.short)
        )
      )
    )
  );

  // Navigation Tabs
  const nav = React.createElement(
    'nav',
    { className: `flex gap-2 border-b ${c.border} pb-3 overflow-x-auto` },
    ['overview', 'cvx', 'aero', 'rsup', 'yb'].map((tab) =>
      React.createElement(
        'button',
        {
          key: tab,
          onClick: () => setActiveTab(tab as any),
          className: `px-4 py-2 rounded-md text-xs font-medium uppercase tracking-wider transition-all ${
            activeTab === tab
              ? isDark 
                ? 'bg-slate-800 text-emerald-400 border border-slate-700' 
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : `${c.textMuted} hover:${c.textMain}`
          }`
        },
        tab === 'overview' ? 'Consolidated Overview' : tab.toUpperCase()
      )
    )
  );

  let content = null;
  if (activeTab === 'overview') {
    content = React.createElement(
      'div',
      { className: 'space-y-6' },
      React.createElement(
        'div',
        { className: 'grid grid-cols-1 md:grid-cols-3 gap-4' },
        React.createElement(
          'div',
          { className: `${c.card} p-5 rounded-xl` },
          React.createElement('span', { className: `${c.textMuted} text-xs` }, 'Total Capital USD'),
          React.createElement('p', { className: `text-2xl font-bold ${c.textMain} mt-2` }, fmt(data.summary.totalCapitalUSD))
        ),
        React.createElement(
          'div',
          { className: `${c.card} p-5 rounded-xl` },
          React.createElement('span', { className: `${c.textMuted} text-xs` }, 'Annualized Cash Flow'),
          React.createElement('p', { className: `text-2xl font-bold ${c.textMain} mt-2` }, isPrivacy ? '$••••••' : `$${data.summary.annualizedCashFlowUSD.toLocaleString()} / yr`)
        ),
        React.createElement(
          'div',
          { className: `${c.card} p-5 rounded-xl` },
          React.createElement('span', { className: `${c.textMuted} text-xs` }, 'Blended Portfolio APR'),
          React.createElement('p', { className: 'text-2xl font-bold text-emerald-500 mt-2' }, data.summary.blendedAPR)
        )
      ),
      React.createElement('h2', { className: `text-sm font-semibold ${c.textMuted} uppercase tracking-wider` }, 'Asset Breakdown'),
      React.createElement(
        'div',
        { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
        Object.entries(data.assets).map(([key, asset]: [string, any]) =>
          React.createElement(
            'div',
            {
              key: key,
              onClick: () => setActiveTab(key as any),
              className: `${c.card} p-5 rounded-xl hover:border-emerald-500/50 cursor-pointer transition-all space-y-3`
            },
            React.createElement(
              'div',
              { className: 'flex items-center justify-between' },
              React.createElement(
                'div',
                null,
                React.createElement('h3', { className: `font-bold ${c.textMain}` }, `${asset.name} (${asset.symbol})`),
                React.createElement('p', { className: `text-xs ${c.textMuted} mt-0.5` }, asset.revenueSource)
              ),
              React.createElement('span', { className: 'text-xs font-mono bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded' }, `${asset.apr} APR`)
            ),
            React.createElement(
              'div',
              { className: `flex justify-between border-t ${c.border} pt-3 text-xs` },
              React.createElement('div', null, React.createElement('span', { className: c.textMuted }, 'Principal Value: '), React.createElement('span', { className: `font-semibold ${c.textMain}` }, fmt(asset.principalUSD))),
              React.createElement('div', null, React.createElement('span', { className: c.textMuted }, 'Monthly Yield: '), React.createElement('span', { className: 'font-semibold text-emerald-500' }, isPrivacy ? '$••••••' : `$${asset.monthlyCashFlowUSD.toLocaleString()}/mo`))
            )
          )
        )
      )
    );
  } else if (selectedAsset) {
    content = React.createElement(
      'div',
      { className: 'space-y-6' },
      React.createElement(
        'div',
        { className: `${c.card} p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4` },
        React.createElement(
          'div',
          null,
          React.createElement('h2', { className: `text-xl font-bold ${c.textMain}` }, `${selectedAsset.name} (${selectedAsset.symbol})`),
          React.createElement('p', { className: `text-xs ${c.textMuted} mt-1` }, `Revenue Mechanism: ${selectedAsset.revenueSource}`)
        ),
        React.createElement(
          'div',
          { className: 'flex gap-4 text-xs' },
          React.createElement('div', { className: `${c.subCard} px-3 py-2 rounded-lg` }, React.createElement('span', { className: `${c.textMuted} block` }, 'Position Value'), React.createElement('span', { className: `font-bold ${c.textMain}` }, fmt(selectedAsset.principalUSD))),
          React.createElement('div', { className: `${c.subCard} px-3 py-2 rounded-lg` }, React.createElement('span', { className: `${c.textMuted} block` }, 'Monthly Yield'), React.createElement('span', { className: 'font-bold text-emerald-500' }, isPrivacy ? '$••••••' : `$${selectedAsset.monthlyCashFlowUSD.toLocaleString()}/mo`)),
          React.createElement('div', { className: `${c.subCard} px-3 py-2 rounded-lg` }, React.createElement('span', { className: `${c.textMuted} block` }, 'Current APR'), React.createElement('span', { className: 'font-bold text-purple-500' }, selectedAsset.apr))
        )
      ),

      // Graph 1: Principal Value
      React.createElement(
        'div',
        { className: `${c.card} p-5 rounded-xl space-y-4` },
        React.createElement(
          'div',
          { className: 'flex items-center justify-between' },
          React.createElement('h3', { className: `text-xs font-semibold ${c.textMuted} uppercase tracking-wider` }, '1. Historical Position Value (USD Volatility)'),
          React.createElement('span', { className: 'text-xs text-blue-500 font-mono' }, '6-12 Month Timeline')
        ),
        React.createElement(
          'div',
          { className: isPrivacy ? 'h-64 w-full filter blur-md select-none transition-all' : 'h-64 w-full transition-all' },
          React.createElement(
            ResponsiveContainer as any,
            { width: '100%', height: '100%' },
            React.createElement(
              AreaChart as any,
              { data: selectedAsset.history },
              React.createElement(CartesianGrid as any, { strokeDasharray: '3 3', stroke: c.grid }),
              React.createElement(XAxis as any, { dataKey: 'month', stroke: c.axis, fontSize: 11 }),
              React.createElement(YAxis as any, { 
                stroke: c.axis, 
                fontSize: 11, 
                domain: [(min: number) => Math.floor(min * 0.92), (max: number) => Math.ceil(max * 1.08)],
                tickFormatter: (val: any) => isPrivacy ? '•••' : `$${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}` 
              }),
              React.createElement(Tooltip as any, { contentStyle: { backgroundColor: c.tooltipBg, borderColor: c.tooltipBorder, borderRadius: '0.5rem', color: c.tooltipText }, formatter: (value: any) => [isPrivacy ? '$••••••' : `$${Number(value).toLocaleString()}`, 'Position Value'] }),
              React.createElement(Area as any, { type: 'monotone', dataKey: 'principalUSD', stroke: '#3b82f6', fill: '#3b82f6', fillOpacity: 0.25, strokeWidth: 2 })
            )
          )
        )
      ),

      // Graph 2: Yield
      React.createElement(
        'div',
        { className: `${c.card} p-5 rounded-xl space-y-4` },
        React.createElement(
          'div',
          { className: 'flex items-center justify-between' },
          React.createElement('h3', { className: `text-xs font-semibold ${c.textMuted} uppercase tracking-wider` }, '2. Estimated Yield / Revenue Stream (USD)'),
          React.createElement('span', { className: 'text-xs text-emerald-500 font-mono' }, 'Bribes & Yields')
        ),
        React.createElement(
          'div',
          { className: isPrivacy ? 'h-64 w-full filter blur-md select-none transition-all' : 'h-64 w-full transition-all' },
          React.createElement(
            ResponsiveContainer as any,
            { width: '100%', height: '100%' },
            React.createElement(
              AreaChart as any,
              { data: selectedAsset.history },
              React.createElement(CartesianGrid as any, { strokeDasharray: '3 3', stroke: c.grid }),
              React.createElement(XAxis as any, { dataKey: 'month', stroke: c.axis, fontSize: 11 }),
              React.createElement(YAxis as any, { 
                stroke: c.axis, 
                fontSize: 11, 
                domain: [(min: number) => Math.floor(min * 0.85), (max: number) => Math.ceil(max * 1.15)],
                tickFormatter: (val: any) => isPrivacy ? '•••' : `$${val}` 
              }),
              React.createElement(Tooltip as any, { contentStyle: { backgroundColor: c.tooltipBg, borderColor: c.tooltipBorder, borderRadius: '0.5rem', color: c.tooltipText }, formatter: (value: any) => [isPrivacy ? '$••••••' : `$${Number(value).toLocaleString()}`, 'Yield'] }),
              React.createElement(Area as any, { type: 'monotone', dataKey: 'revenueUSD', stroke: '#10b981', fill: '#10b981', fillOpacity: 0.25, strokeWidth: 2 })
            )
          )
        )
      )
    );
  }

  return React.createElement(
    'div',
    { className: `min-h-screen ${c.bg} p-6 font-sans transition-colors duration-200` },
    React.createElement('div', { className: 'max-w-6xl mx-auto space-y-6' }, header, nav, content)
  );
}
