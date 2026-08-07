'use client';

import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts';
import { Wallet, DollarSign, TrendingUp, ShieldCheck, Layers } from 'lucide-react';
import { WALLETS } from '@/lib/constants';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'cvx' | 'aero' | 'rsup' | 'yb'>('overview');
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/portfolio')
      .then((res) => res.json())
      .then((json) => setData(json));
  }, []);

  if (!data) return Loading Sovereign Holding Dashboard...;

  const selectedAsset = activeTab !== 'overview' ? data.assets[activeTab] : null;

  return (
    
      
        
        {/* Header Bar */}
        
          
            
              
              Sovereign Capital Holding
            
            
              Multi-Wallet Infrastructure • 2 Connected Vaults
            
          

          
            {WALLETS.map((w, idx) => (
              
                
                {w.short}
              
            ))}
          
        

        {/* Navigation Tabs */}
        
          {['overview', 'cvx', 'aero', 'rsup', 'yb'].map((tab) => (
             setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-md text-xs font-medium uppercase tracking-wider transition-all ${
                activeTab === tab
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {tab === 'overview' ? 'Consolidated Overview' : tab.toUpperCase()}
            
          ))}
        

        {/* Overview Tab Content */}
        {activeTab === 'overview' && (
          
            
              
                
                  Total Capital USD
                  
                
                
                  ${data.summary.totalCapitalUSD.toLocaleString()}
                
              

              
                
                  Annualized Cash Flow
                  
                
                
                  ${data.summary.annualizedCashFlowUSD.toLocaleString()} / yr
                
              

              
                
                  Blended Portfolio APR
                  
                
                
                  {data.summary.blendedAPR}
                
              
            

            {/* Assets Grid */}
            Asset Breakdown
            
              {Object.entries(data.assets).map(([key, asset]: [string, any]) => (
                 setActiveTab(key as any)}
                  className="bg-slate-900 border border-slate-800 p-5 rounded-xl hover:border-slate-700 cursor-pointer transition-all space-y-3"
                >
                  
                    
                      {asset.name} ({asset.symbol})
                      {asset.revenueSource}
                    
                    
                      {asset.apr} APR
                    
                  
                  
                    
                      Principal Value: 
                      ${asset.principalUSD.toLocaleString()}
                    
                    
                      Monthly Yield: 
                      ${asset.monthlyCashFlowUSD}/mo
                    
                  
                
              ))}
            
          
        )}

        {/* Dedicated Asset Page (Dual Chart View) */}
        {selectedAsset && (
          
            
              
                {selectedAsset.name} ({selectedAsset.symbol})
                Revenue Mechanism: {selectedAsset.revenueSource}
              
              
                
                  Position Value
                  ${selectedAsset.principalUSD.toLocaleString()}
                
                
                  Monthly Yield
                  ${selectedAsset.monthlyCashFlowUSD}/mo
                
                
                  Current APR
                  {selectedAsset.apr}
                
              
            

            {/* Chart 1: Principal Value */}
            
              
                1. Principal Value History (USD Capital)
              
              
                
                  
                    
                    
                    
                    
                    
                  
                
              
            

            {/* Chart 2: Revenue Cash Flow */}
            
              
                2. Monthly Cash Flow & Revenue Yield (USD)
              
              
                
                  
                    
                    
                    
                    
                    
                  
                
              
            
          
        )}

      
    
  );
}
