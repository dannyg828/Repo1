'use client';

import React, { useState, useEffect } from 'react';
import { WALLETS } from '@/lib/constants';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'cvx' | 'aero' | 'rsup' | 'yb'>('overview');
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/portfolio')
      .then((res) => res.json())
      .then((json) => setData(json));
  }, []);

  if (!data) {
    return React.createElement(
      'div',
      { className: 'min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6' },
      React.createElement('p', { className: 'text-slate-400 text-sm animate-pulse' }, 'Loading Sovereign Holding Dashboard...')
    );
  }

  const selectedAsset = activeTab !== 'overview' ? data.assets[activeTab] : null;

  // Header Component
  const header = React.createElement(
    'header',
    { className: 'flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6' },
    React.createElement(
      'div',
      null,
      React.createElement('h1', { className: 'text-2xl font-bold tracking-tight text-slate-50' }, 'Sovereign Capital Holding'),
      React.createElement('p', { className: 'text-xs text-slate-400 mt-1' }, 'Multi-Wallet Infrastructure • 2 Connected Vaults')
    ),
    React.createElement(
      'div',
      { className: 'flex flex-wrap gap-2 text-xs' },
      WALLETS.map((w, idx) =>
        React.createElement(
          'div',
          { key: idx, className: 'bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2' },
          React.createElement('span', { className: 'font-mono text-slate-300' }, w.short)
        )
      )
    )
  );

  // Navigation Tabs
  const nav = React.createElement(
    'nav',
    { className: 'flex gap-2 border-b border-slate-800 pb-3 overflow-x-auto' },
    ['overview', 'cvx', 'aero', 'rsup', 'yb'].map((tab) =>
      React.createElement(
        'button',
        {
          key: tab,
          onClick: () => setActiveTab(tab as any),
          className: `px-4 py-2 rounded-md text-xs font-medium uppercase tracking-wider transition-all ${
            activeTab === tab
              ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`
        },
        tab === 'overview' ? 'Consolidated Overview' : tab.toUpperCase()
      )
    )
  );

  // Main Content
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
          { className: 'bg-slate-900 border border-slate-800 p-5 rounded-xl' },
          React.createElement('span', { className: 'text-slate-400 text-xs' }, 'Total Capital USD'),
          React.createElement('p', { className: 'text-2xl font-bold text-slate-50 mt-2' }, `$${data.summary.totalCapitalUSD.toLocaleString()}`)
        ),
        React.createElement(
          'div',
          { className: 'bg-slate-900 border border-slate-800 p-5 rounded-xl' },
          React.createElement('span', { className: 'text-slate-400 text-xs' }, 'Annualized Cash Flow'),
          React.createElement('p', { className: 'text-2xl font-bold text-slate-50 mt-2' }, `$${data.summary.annualizedCashFlowUSD.toLocaleString()} / yr`)
        ),
        React.createElement(
          'div',
          { className: 'bg-slate-900 border border-slate-800 p-5 rounded-xl' },
          React.createElement('span', { className: 'text-slate-400 text-xs' }, 'Blended Portfolio APR'),
          React.createElement('p', { className: 'text-2xl font-bold text-emerald-400 mt-2' }, data.summary.blendedAPR)
        )
      ),
      React.createElement('h2', { className: 'text-sm font-semibold text-slate-300 uppercase tracking-wider' }, 'Asset Breakdown'),
      React.createElement(
        'div',
        { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
        Object.entries(data.assets).map(([key, asset]: [string, any]) =>
          React.createElement(
            'div',
            {
              key: key,
              onClick: () => setActiveTab(key as any),
              className: 'bg-slate-900 border border-slate-800 p-5 rounded-xl hover:border-slate-700 cursor-pointer transition-all space-y-3'
            },
            React.createElement(
              'div',
              { className: 'flex items-center justify-between' },
              React.createElement(
                'div',
                null,
                React.createElement('h3', { className: 'font-bold text-slate-100' }, `${asset.name} (${asset.symbol})`),
                React.createElement('p', { className: 'text-xs text-slate-400 mt-0.5' }, asset.revenueSource)
              ),
              React.createElement('span', { className: 'text-xs font-mono bg-slate-800 text-emerald-400 px-2.5 py-1 rounded' }, `${asset.apr} APR`)
            ),
            React.createElement(
              'div',
              { className: 'flex justify-between border-t border-slate-800 pt-3 text-xs' },
              React.createElement('div', null, React.createElement('span', { className: 'text-slate-400' }, 'Principal Value: '), React.createElement('span', { className: 'font-semibold text-slate-200' }, `$${asset.principalUSD.toLocaleString()}`)),
              React.createElement('div', null, React.createElement('span', { className: 'text-slate-400' }, 'Monthly Yield: '), React.createElement('span', { className: 'font-semibold text-emerald-400' }, `$${asset.monthlyCashFlowUSD}/mo`))
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
        { className: 'bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4' },
        React.createElement(
          'div',
          null,
          React.createElement('h2', { className: 'text-xl font-bold text-slate-50' }, `${selectedAsset.name} (${selectedAsset.symbol})`),
          React.createElement('p', { className: 'text-xs text-slate-400 mt-1' }, `Revenue Mechanism: ${selectedAsset.revenueSource}`)
        ),
        React.createElement(
          'div',
          { className: 'flex gap-4 text-xs' },
          React.createElement('div', { className: 'bg-slate-950 px-3 py-2 rounded-lg border border-slate-800' }, React.createElement('span', { className: 'text-slate-400 block' }, 'Position Value'), React.createElement('span', { className: 'font-bold text-slate-100' }, `$${selectedAsset.principalUSD.toLocaleString()}`)),
          React.createElement('div', { className: 'bg-slate-950 px-3 py-2 rounded-lg border border-slate-800' }, React.createElement('span', { className: 'text-slate-400 block' }, 'Monthly Yield'), React.createElement('span', { className: 'font-bold text-emerald-400' }, `$${selectedAsset.monthlyCashFlowUSD}/mo`)),
          React.createElement('div', { className: 'bg-slate-950 px-3 py-2 rounded-lg border border-slate-800' }, React.createElement('span', { className: 'text-slate-400 block' }, 'Current APR'), React.createElement('span', { className: 'font-bold text-purple-400' }, selectedAsset.apr))
        )
      )
    );
  }

  return React.createElement(
    'div',
    { className: 'min-h-screen bg-slate-950 text-slate-100 p-6 font-sans' },
    React.createElement('div', { className: 'max-w-6xl mx-auto space-y-6' }, header, nav, content)
  );
}
