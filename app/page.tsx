'use client';

import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { WALLETS } from '@/lib/constants';

const el = React.createElement;

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'assets' | 'about'>('overview');
  const [data, setData] = useState(null);
  const [isPrivacy, setIsPrivacy] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [showPrivacyMenu, setShowPrivacyMenu] = useState(false);
  const [privacyPassword, setPrivacyPassword] = useState('');
  const [privacyError, setPrivacyError] = useState(false);

  // Client-side gate only — hides $ figures from over-the-shoulder glances.
  // Not real security: the password lives in this file's JS bundle, so anyone
  // who opens devtools can find it. Don't rely on this for anything sensitive.
  const PRIVACY_PASSWORD = 'Mu$ic88938890';

  const handlePrivacyUnlock = () => {
    if (privacyPassword === PRIVACY_PASSWORD) {
      setIsPrivacy(false);
      setShowPrivacyMenu(false);
      setPrivacyPassword('');
      setPrivacyError(false);
    } else {
      setPrivacyError(true);
    }
  };

  const handlePrivacyHide = () => {
    setIsPrivacy(true);
    setShowPrivacyMenu(false);
    setPrivacyPassword('');
    setPrivacyError(false);
  };

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
    return el(
      'div',
      { className: `min-h-screen ${c.bg} flex items-center justify-center p-6` },
      el('p', { className: `${c.textMuted} text-sm animate-pulse` }, 'Loading AeroLlama Holdings Dashboard...')
    );
  }

  const goToAsset = (key: string) => {
    setActiveTab('assets');
    setTimeout(() => {
      const node = document.getElementById(`asset-${key}`);
      if (node) node.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  // Renders one asset's detail block (position value + yield charts).
  // Used for every asset, stacked, inside the "Assets" tab.
  const renderAssetDetail = (key: string, asset: any) =>
    el(
      'div',
      { key, id: `asset-${key}`, className: 'space-y-6 scroll-mt-6' },
      el(
        'div',
        { className: `${c.card} p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4` },
        el(
          'div',
          null,
          el('h2', { className: `text-xl font-bold ${c.textMain}` }, `${asset.name} (${asset.symbol})`),
          el('p', { className: `text-xs ${c.textMuted} mt-1` }, `Revenue Mechanism: ${asset.revenueSource}`)
        ),
        el(
          'div',
          { className: 'flex gap-4 text-xs' },
          el('div', { className: `${c.subCard} px-3 py-2 rounded-lg` }, el('span', { className: `${c.textMuted} block` }, 'Position Value'), el('span', { className: `font-bold ${c.textMain}` }, fmt(asset.principalUSD))),
          el('div', { className: `${c.subCard} px-3 py-2 rounded-lg` }, el('span', { className: `${c.textMuted} block` }, 'Monthly Yield'), el('span', { className: 'font-bold text-emerald-500' }, isPrivacy ? '$••••••' : `$${asset.monthlyCashFlowUSD.toLocaleString()}/mo`)),
          el('div', { className: `${c.subCard} px-3 py-2 rounded-lg` }, el('span', { className: `${c.textMuted} block` }, 'Current APR'), el('span', { className: 'font-bold text-purple-500' }, asset.apr))
        )
      ),

      // Graph 1: Principal Value
      el(
        'div',
        { className: `${c.card} p-5 rounded-xl space-y-4` },
        el(
          'div',
          { className: 'flex items-center justify-between' },
          el('h3', { className: `text-xs font-semibold ${c.textMuted} uppercase tracking-wider` }, '1. Historical Position Value (USD Volatility)'),
          el('span', { className: 'text-xs text-blue-500 font-mono' }, '6-12 Month Timeline')
        ),
        el(
          'div',
          { className: 'h-64 w-full transition-all' },
          el(
            ResponsiveContainer as any,
            { width: '100%', height: '100%' },
            el(
              AreaChart as any,
              { data: asset.history },
              el(CartesianGrid as any, { strokeDasharray: '3 3', stroke: c.grid }),
              el(XAxis as any, { dataKey: 'month', stroke: c.axis, fontSize: 11 }),
              el(YAxis as any, {
                stroke: c.axis,
                fontSize: 11,
                domain: [(min: number) => Math.floor(min * 0.92), (max: number) => Math.ceil(max * 1.08)],
                tickFormatter: (val: any) => isPrivacy ? '•••' : `$${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`
              }),
              el(Tooltip as any, { contentStyle: { backgroundColor: c.tooltipBg, borderColor: c.tooltipBorder, borderRadius: '0.5rem', color: c.tooltipText }, formatter: (value: any) => [isPrivacy ? '$••••••' : `$${Number(value).toLocaleString()}`, 'Position Value'] }),
              el(Area as any, { type: 'monotone', dataKey: 'principalUSD', stroke: '#3b82f6', fill: '#3b82f6', fillOpacity: 0.25, strokeWidth: 2 })
            )
          )
        )
      ),

      // Graph 2: Yield
      el(
        'div',
        { className: `${c.card} p-5 rounded-xl space-y-4` },
        el(
          'div',
          { className: 'flex items-center justify-between' },
          el('h3', { className: `text-xs font-semibold ${c.textMuted} uppercase tracking-wider` }, '2. Estimated Yield / Revenue Stream (USD)'),
          el('span', { className: 'text-xs text-emerald-500 font-mono' }, 'Bribes & Yields')
        ),
        el(
          'div',
          { className: 'h-64 w-full transition-all' },
          el(
            ResponsiveContainer as any,
            { width: '100%', height: '100%' },
            el(
              AreaChart as any,
              { data: asset.history },
              el(CartesianGrid as any, { strokeDasharray: '3 3', stroke: c.grid }),
              el(XAxis as any, { dataKey: 'month', stroke: c.axis, fontSize: 11 }),
              el(YAxis as any, {
                stroke: c.axis,
                fontSize: 11,
                domain: [(min: number) => Math.floor(min * 0.85), (max: number) => Math.ceil(max * 1.15)],
                tickFormatter: (val: any) => isPrivacy ? '•••' : `$${val}`
              }),
              el(Tooltip as any, { contentStyle: { backgroundColor: c.tooltipBg, borderColor: c.tooltipBorder, borderRadius: '0.5rem', color: c.tooltipText }, formatter: (value: any) => [isPrivacy ? '$••••••' : `$${Number(value).toLocaleString()}`, 'Yield'] }),
              el(Area as any, { type: 'monotone', dataKey: 'revenueUSD', stroke: '#10b981', fill: '#10b981', fillOpacity: 0.25, strokeWidth: 2 })
            )
          )
        )
      )
    );

  // Header Bar with Controls
  const header = el(
    'header',
    { className: `flex flex-col md:flex-row md:items-center justify-between gap-4 border-b ${c.border} pb-6` },
    el(
      'div',
      null,
      el('h1', { className: `text-2xl font-bold tracking-tight ${c.textMain}` }, 'AeroLlama Holdings'),
      el('p', { className: `text-xs ${c.textMuted} mt-1` }, 'Multi-Wallet Infrastructure • 2 Connected Vaults')
    ),
    el(
      'div',
      { className: 'flex flex-wrap items-center gap-3 text-xs' },
      el(
        'a',
        {
          href: '/administrator',
          className: `px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${c.card} ${c.textMuted} hover:${c.textMain}`
        },
        'Administrator'
      ),
      el(
        'div',
        { className: 'relative' },
        el(
          'button',
          {
            onClick: () => setShowPrivacyMenu(!showPrivacyMenu),
            className: `px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              isPrivacy
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : `${c.card} ${c.textMuted} hover:${c.textMain}`
            }`
          },
          isPrivacy ? '🔒 Privacy' : '🔓 Privacy'
        ),
        showPrivacyMenu && el(
          'div',
          { className: `absolute right-0 mt-2 w-56 rounded-lg border ${c.card} ${c.border} p-3 shadow-lg z-50 space-y-2` },
          isPrivacy
            ? el(
                'div',
                { className: 'space-y-2' },
                el('label', { className: `block text-[10px] uppercase tracking-wider ${c.textMuted}` }, 'Enter password to show amounts'),
                el('input', {
                  type: 'password',
                  value: privacyPassword,
                  onChange: (e: any) => { setPrivacyPassword(e.target.value); setPrivacyError(false); },
                  onKeyDown: (e: any) => { if (e.key === 'Enter') handlePrivacyUnlock(); },
                  autoFocus: true,
                  placeholder: 'Password',
                  className: `w-full px-2 py-1.5 rounded-md border text-xs ${c.subCard} ${c.border} ${c.textMain} outline-none focus:border-emerald-500`
                }),
                privacyError && el('p', { className: 'text-[10px] text-red-500' }, 'Incorrect password'),
                el(
                  'button',
                  {
                    onClick: handlePrivacyUnlock,
                    className: 'w-full px-2 py-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-medium hover:bg-emerald-500/20 transition-all'
                  },
                  'Show Amounts'
                )
              )
            : el(
                'button',
                {
                  onClick: handlePrivacyHide,
                  className: 'w-full px-2 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-medium hover:bg-amber-500/20 transition-all'
                },
                'Hide Amounts Again'
              )
        )
      ),
      el(
        'button',
        {
          onClick: () => setTheme(isDark ? 'light' : 'dark'),
          className: `px-3 py-1.5 rounded-lg border ${c.card} ${c.textMuted} hover:${c.textMain} transition-all`
        },
        isDark ? '☀️ Light' : '🌙 Dark'
      ),
      WALLETS.map((w: any, idx: number) =>
        el(
          'div',
          { key: idx, className: `${c.card} px-3 py-1.5 rounded-lg flex items-center gap-2` },
          el('span', { className: `font-mono ${c.textMuted}` }, w.short)
        )
      )
    )
  );

  // Navigation Tabs
  const nav = el(
    'nav',
    { className: `flex gap-2 border-b ${c.border} pb-3 overflow-x-auto` },
    ['overview', 'assets', 'about'].map((tab) =>
      el(
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
        tab === 'overview' ? 'Overview' : tab === 'assets' ? 'Assets' : 'About'
      )
    )
  );

  let content = null;
  if (activeTab === 'overview') {
    content = el(
      'div',
      { className: 'space-y-6' },
      el(
        'div',
        { className: 'grid grid-cols-1 md:grid-cols-3 gap-4' },
        el(
          'div',
          { className: `${c.card} p-5 rounded-xl` },
          el('span', { className: `${c.textMuted} text-xs` }, 'Total Capital USD'),
          el('p', { className: `text-2xl font-bold ${c.textMain} mt-2` }, fmt(data.summary.totalCapitalUSD))
        ),
        el(
          'div',
          { className: `${c.card} p-5 rounded-xl` },
          el('span', { className: `${c.textMuted} text-xs` }, 'Annualized Cash Flow'),
          el('p', { className: `text-2xl font-bold ${c.textMain} mt-2` }, isPrivacy ? '$••••••' : `$${data.summary.annualizedCashFlowUSD.toLocaleString()} / yr`)
        ),
        el(
          'div',
          { className: `${c.card} p-5 rounded-xl` },
          el('span', { className: `${c.textMuted} text-xs` }, 'Blended Portfolio APR'),
          el('p', { className: 'text-2xl font-bold text-emerald-500 mt-2' }, data.summary.blendedAPR)
        )
      ),

      // Net Worth Over Time
      el(
        'div',
        { className: `${c.card} p-5 rounded-xl space-y-4` },
        el(
          'div',
          { className: 'flex items-center justify-between' },
          el('h3', { className: `text-xs font-semibold ${c.textMuted} uppercase tracking-wider` }, 'Net Worth Over Time'),
          el('span', { className: 'text-xs text-blue-500 font-mono' }, 'Since Jan 1, 2026')
        ),
        el(
          'div',
          { className: 'h-64 w-full transition-all' },
          el(
            ResponsiveContainer as any,
            { width: '100%', height: '100%' },
            el(
              AreaChart as any,
              { data: data.summary.netWorthHistory },
              el(CartesianGrid as any, { strokeDasharray: '3 3', stroke: c.grid }),
              el(XAxis as any, { dataKey: 'date', stroke: c.axis, fontSize: 11 }),
              el(YAxis as any, {
                stroke: c.axis,
                fontSize: 11,
                domain: [(min: number) => Math.floor(min * 0.95), (max: number) => Math.ceil(max * 1.05)],
                tickFormatter: (val: any) => isPrivacy ? '•••' : `$${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`
              }),
              el(Tooltip as any, { contentStyle: { backgroundColor: c.tooltipBg, borderColor: c.tooltipBorder, borderRadius: '0.5rem', color: c.tooltipText }, formatter: (value: any) => [isPrivacy ? '$••••••' : `$${Number(value).toLocaleString()}`, 'Net Worth'] }),
              el(Area as any, { type: 'monotone', dataKey: 'totalUSD', stroke: '#3b82f6', fill: '#3b82f6', fillOpacity: 0.25, strokeWidth: 2 })
            )
          )
        )
      ),

      el('h2', { className: `text-sm font-semibold ${c.textMuted} uppercase tracking-wider` }, 'Asset Breakdown'),
      el(
        'div',
        { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
        Object.entries(data.assets).map(([key, asset]: [string, any]) =>
          el(
            'div',
            {
              key: key,
              onClick: () => goToAsset(key),
              className: `${c.card} p-5 rounded-xl hover:border-emerald-500/50 cursor-pointer transition-all space-y-3`
            },
            el(
              'div',
              { className: 'flex items-center justify-between' },
              el(
                'div',
                null,
                el('h3', { className: `font-bold ${c.textMain}` }, `${asset.name} (${asset.symbol})`),
                el('p', { className: `text-xs ${c.textMuted} mt-0.5` }, asset.revenueSource)
              ),
              el('span', { className: 'text-xs font-mono bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded' }, `${asset.apr} APR`)
            ),
            el(
              'div',
              { className: `flex justify-between border-t ${c.border} pt-3 text-xs` },
              el(
                'div',
                null,
                el('span', { className: c.textMuted }, 'Principal Value: '),
                el('span', { className: `font-semibold ${c.textMain}` }, fmt(asset.principalUSD)),
                el('span', { className: `${c.textMuted} ml-1` }, isPrivacy ? '(••••)' : `(${Math.round(asset.quantity).toLocaleString()} ${asset.symbol})`)
              ),
              el('div', null, el('span', { className: c.textMuted }, 'Monthly Yield: '), el('span', { className: 'font-semibold text-emerald-500' }, isPrivacy ? '$••••••' : `$${asset.monthlyCashFlowUSD.toLocaleString()}/mo`))
            )
          )
        )
      )
    );
  } else if (activeTab === 'assets') {
    content = el(
      'div',
      { className: 'space-y-10' },
      Object.entries(data.assets).map(([key, asset]: [string, any]) => renderAssetDetail(key, asset))
    );
  } else if (activeTab === 'about') {
    const links = [
      { label: 'CVX', text: 'www.convexfinance.com', href: 'https://www.convexfinance.com' },
      { label: 'AERO', text: 'www.aerodrome.finance', href: 'https://www.aerodrome.finance' },
      { label: 'RSUP', text: 'www.resupply.fi', href: 'https://www.resupply.fi' },
      { label: 'YB', text: 'yieldbasis.com', href: 'https://yieldbasis.com' }
    ];
    content = el(
      'div',
      { className: 'space-y-6' },
      el(
        'div',
        { className: `${c.card} p-6 rounded-xl space-y-5` },
        el(
          'div',
          { className: 'flex flex-col sm:flex-row items-start sm:items-center gap-5' },
          el('img', {
            src: '/aerollama-nft.jpg',
            alt: 'AeroLlama',
            className: 'w-28 h-28 rounded-xl object-cover flex-shrink-0 border border-slate-200'
          }),
          el(
            'div',
            null,
            el('h2', { className: `text-xl font-bold ${c.textMain}` }, 'About AeroLlama'),
            el(
              'p',
              { className: `text-sm ${c.textMuted} mt-2 leading-relaxed` },
              'AeroLlama was built as an easy way to track my portfolio as two complimentary components: principal asset value and revenue.'
            )
          )
        ),
        el(
          'div',
          { className: `border-t ${c.border} pt-5 space-y-3` },
          el('p', { className: `text-sm ${c.textMuted}` }, 'To learn more about the chosen assets, visit the following websites:'),
          el(
            'ul',
            { className: 'space-y-2 text-sm' },
            links.map((l) =>
              el(
                'li',
                { key: l.label, className: 'flex items-center gap-2' },
                el('span', { className: `font-mono text-xs ${c.textMuted} w-10` }, `${l.label}:`),
                el(
                  'a',
                  {
                    href: l.href,
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    className: 'text-blue-500 hover:underline'
                  },
                  l.text
                )
              )
            )
          )
        )
      )
    );
  }

  return el(
    'div',
    { className: `min-h-screen ${c.bg} p-6 font-sans transition-colors duration-200` },
    el('div', { className: 'max-w-6xl mx-auto space-y-6' }, header, nav, content)
  );
}
