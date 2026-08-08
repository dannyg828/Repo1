'use client';

import React, { useState, useCallback } from 'react';
import { Contract, formatUnits, type BrowserProvider } from 'ethers';
import { connectWallet } from '@/lib/web3';
import {
  ERC20_ABI,
  TOKENS,
  RESUPPLY_GOV_STAKER,
  RESUPPLY_GOV_STAKER_ABI,
  YB_FEE_DISTRIBUTOR,
  YB_FEE_DISTRIBUTOR_ABI,
  LLAMA_AIRFORCE_UNION_URL,
} from '@/lib/contracts';
import { swapToUSDC } from '@/lib/cowswap';

const el = React.createElement;

type ActionState = { status: 'idle' | 'pending' | 'success' | 'error'; message?: string };

const IDLE: ActionState = { status: 'idle' };

function ActionCard(props: { title: string; description: string; children?: React.ReactNode }) {
  return el(
    'div',
    { className: 'bg-white border border-slate-200 shadow-sm rounded-xl p-5 space-y-3' },
    el(
      'div',
      null,
      el('h2', { className: 'text-sm font-bold' }, props.title),
      el('p', { className: 'text-xs text-slate-500 mt-1' }, props.description)
    ),
    props.children
  );
}

function ActionButton(props: {
  label: string;
  state: ActionState;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  full?: boolean;
}) {
  const variant = props.variant ?? 'primary';
  const full = props.full ?? false;
  const base = variant === 'primary' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 border border-slate-300';

  return el(
    'div',
    { className: full ? 'w-full' : '' },
    el(
      'button',
      {
        onClick: props.onClick,
        disabled: props.disabled || props.state.status === 'pending',
        className: `${base} ${full ? 'w-full' : ''} px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50`
      },
      props.state.status === 'pending' ? 'Waiting for wallet…' : props.label
    ),
    props.state.status === 'success'
      ? el('p', { className: 'text-xs text-emerald-600 mt-1 break-all' }, props.state.message)
      : null,
    props.state.status === 'error'
      ? el('p', { className: 'text-xs text-red-600 mt-1 break-all' }, props.state.message)
      : null
  );
}

export default function AdministratorPage() {
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const [balances, setBalances] = useState<Record<string, bigint>>({});
  const [resupplyClaimable, setResupplyClaimable] = useState<bigint | null>(null);

  const [actions, setActions] = useState<Record<string, ActionState>>({});

  const setAction = (key: string, state: ActionState) =>
    setActions((prev) => ({ ...prev, [key]: state }));

  const refreshBalances = useCallback(async (p: BrowserProvider, addr: string) => {
    const entries = await Promise.all(
      Object.entries(TOKENS).map(async ([symbol, tokenAddress]) => {
        try {
          const token = new Contract(tokenAddress, ERC20_ABI, p);
          const bal: bigint = await token.balanceOf(addr);
          return [symbol, bal] as const;
        } catch {
          return [symbol, BigInt(0)] as const;
        }
      })
    );
    setBalances(Object.fromEntries(entries));
  }, []);

  const refreshResupplyClaimable = useCallback(async (p: BrowserProvider, addr: string) => {
    try {
      const staker = new Contract(RESUPPLY_GOV_STAKER, RESUPPLY_GOV_STAKER_ABI, p);
      const claimable: bigint = await staker.earned(addr, TOKENS.REUSD);
      setResupplyClaimable(claimable);
    } catch {
      setResupplyClaimable(null);
    }
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    setConnectError(null);
    try {
      const { provider: p, address: addr } = await connectWallet();
      setProvider(p);
      setAddress(addr);
      await refreshBalances(p, addr);
      await refreshResupplyClaimable(p, addr);
    } catch (err: any) {
      setConnectError(err?.message ?? 'Failed to connect wallet.');
    } finally {
      setConnecting(false);
    }
  };

  const runAction = async (key: string, fn: () => Promise<string>) => {
    setAction(key, { status: 'pending' });
    try {
      const message = await fn();
      setAction(key, { status: 'success', message });
      if (provider && address) {
        await refreshBalances(provider, address);
        await refreshResupplyClaimable(provider, address);
      }
    } catch (err: any) {
      setAction(key, { status: 'error', message: err?.message ?? 'Transaction failed or was rejected.' });
    }
  };

  // Claims your reUSD staking rewards earned from staked RSUP (GovStaker.getReward()),
  // then swaps whatever reUSD lands in your wallet to USDC.
  const claimAndSwapResupply = () =>
    runAction('resupply-staking', async () => {
      if (!provider || !address) throw new Error('Connect your wallet first.');
      const signer = await provider.getSigner();
      const staker = new Contract(RESUPPLY_GOV_STAKER, RESUPPLY_GOV_STAKER_ABI, signer);

      const claimable: bigint = await staker.earned(address, TOKENS.REUSD);
      if (claimable === BigInt(0)) throw new Error('Nothing claimable right now.');

      const tx = await staker.getReward();
      await tx.wait();

      const result = await swapToUSDC(provider, TOKENS.REUSD, claimable);
      return `Claimed reUSD (tx ${tx.hash}). Swap order: ${result.orderUrl}`;
    });

  // FeeDistributor is multi-token, so instead of assuming a fixed reward token, this
  // reads the Claim(user, token, amount) events emitted by the claim tx itself to find
  // out exactly what was paid out, then swaps each one to USDC.
  const claimAndSwapYieldBasis = () =>
    runAction('yieldbasis', async () => {
      if (!provider || !address) throw new Error('Connect your wallet first.');
      const signer = await provider.getSigner();
      const distributor = new Contract(YB_FEE_DISTRIBUTOR, YB_FEE_DISTRIBUTOR_ABI, signer);

      const tx = await distributor.claim(address, 50, false);
      const receipt = await tx.wait();

      const claimed: { token: string; amount: bigint }[] = [];
      for (const log of receipt?.logs ?? []) {
        if (log.address?.toLowerCase() !== YB_FEE_DISTRIBUTOR.toLowerCase()) continue;
        try {
          const parsed = distributor.interface.parseLog(log);
          if (parsed?.name === 'Claim') {
            claimed.push({ token: parsed.args.token as string, amount: parsed.args.amount as bigint });
          }
        } catch {
          // Not a log our ABI recognizes — ignore.
        }
      }

      if (claimed.length === 0) return `Claimed, nothing to swap. Tx: ${tx.hash}`;

      const swapNotes: string[] = [];
      for (const { token, amount } of claimed) {
        if (amount === BigInt(0)) continue;
        if (token.toLowerCase() === TOKENS.USDC.toLowerCase()) {
          swapNotes.push('already USDC, no swap needed');
          continue;
        }
        const result = await swapToUSDC(provider, token, amount);
        swapNotes.push(result.orderUrl);
      }

      return `Claimed (tx ${tx.hash}). Swaps: ${swapNotes.join(', ') || 'none'}`;
    });

  const swapTokenToUSDC = (key: string, tokenSymbol: keyof typeof TOKENS) =>
    runAction(key, async () => {
      if (!provider) throw new Error('Connect your wallet first.');
      const amount = balances[tokenSymbol] ?? BigInt(0);
      if (amount === BigInt(0)) throw new Error(`No ${tokenSymbol} balance to swap.`);
      const result = await swapToUSDC(provider, TOKENS[tokenSymbol], amount);
      return `Order submitted: ${result.orderUrl}`;
    });

  const fmt = (symbol: keyof typeof TOKENS) => {
    const bal = balances[symbol];
    if (bal === undefined) return '—';
    return Number(formatUnits(bal, symbol === 'USDC' ? 6 : 18)).toLocaleString(undefined, {
      maximumFractionDigits: 4,
    });
  };

  const walletCard = !address
    ? el(
        'div',
        { className: 'flex items-center justify-between gap-4' },
        el(
          'div',
          null,
          el('p', { className: 'text-sm font-medium' }, 'No wallet connected'),
          el(
            'p',
            { className: 'text-xs text-slate-500 mt-1' },
            'Connects to whatever wallet extension is injected (e.g. Rabby paired with your Ledger). No WalletConnect, no private keys ever touch this page.'
          ),
          connectError ? el('p', { className: 'text-xs text-red-600 mt-2' }, connectError) : null
        ),
        el(
          'button',
          {
            onClick: handleConnect,
            disabled: connecting,
            className: 'px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium disabled:opacity-50'
          },
          connecting ? 'Connecting…' : 'Connect Wallet'
        )
      )
    : el(
        'div',
        { className: 'flex items-center justify-between gap-4 text-sm' },
        el(
          'div',
          null,
          el('span', { className: 'text-slate-500' }, 'Connected: '),
          el('span', { className: 'font-mono' }, `${address.slice(0, 6)}…${address.slice(-4)}`)
        ),
        el(
          'div',
          { className: 'flex gap-4 text-xs text-slate-500' },
          el('span', null, `reUSD: ${fmt('REUSD')}`),
          el('span', null, `RSUP: ${fmt('RSUP')}`),
          el('span', null, `scrvUSD: ${fmt('SCRVUSD')}`),
          el('span', null, `USDC: ${fmt('USDC')}`)
        )
      );

  const resupplyClaimableLabel =
    resupplyClaimable === null
      ? null
      : `Claimable now: ${Number(formatUnits(resupplyClaimable, 18)).toLocaleString(undefined, { maximumFractionDigits: 4 })} reUSD`;

  const resupplyCard = el(
    ActionCard,
    {
      title: 'Resupply — RSUP Staking Rewards (reUSD)',
      description: 'Claims your reUSD revenue share from staked RSUP, then swaps it to USDC — all in one step.'
    },
    el(
      'div',
      { className: 'space-y-3' },
      resupplyClaimableLabel ? el('p', { className: 'text-xs text-slate-500' }, resupplyClaimableLabel) : null,
      el(ActionButton, {
        label: 'Claim reUSD & Swap to USDC',
        state: actions['resupply-staking'] ?? IDLE,
        onClick: claimAndSwapResupply,
        disabled: !address,
        full: true
      })
    )
  );

  const yieldBasisCard = el(
    ActionCard,
    {
      title: 'YieldBasis — veYB Revenue',
      description: "Claims your veYB fee-share from YieldBasis's FeeDistributor and swaps whatever token(s) it pays out to USDC — all in one step."
    },
    el(
      'div',
      { className: 'space-y-3' },
      el(ActionButton, {
        label: 'Claim veYB Revenue & Swap to USDC',
        state: actions['yieldbasis'] ?? IDLE,
        onClick: claimAndSwapYieldBasis,
        disabled: !address,
        full: true
      }),
      el(
        'p',
        { className: 'text-xs text-slate-500' },
        "FeeDistributor can pay out more than one token per claim (whatever fees YieldBasis markets accrued that epoch) — this reads the claim transaction's own events to find out exactly what was paid, then swaps each one to USDC individually."
      )
    )
  );

  const unionCard = el(
    ActionCard,
    {
      title: 'vlCVX — Llama Airforce Union (paid out as scrvUSD)',
      description: "Llama Airforce keeps their Union claim proofs on a private backend we can't safely reproduce, so claiming happens on their site — this page picks up right after to swap the scrvUSD you receive."
    },
    el(
      'div',
      { className: 'space-y-3' },
      el(
        'a',
        {
          href: LLAMA_AIRFORCE_UNION_URL,
          target: '_blank',
          rel: 'noopener noreferrer',
          className: 'block text-center px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium'
        },
        'Open Llama Airforce to Claim ↗'
      ),
      el(ActionButton, {
        label: 'Swap scrvUSD → USDC',
        state: actions['swap-scrvusd'] ?? IDLE,
        onClick: () => swapTokenToUSDC('swap-scrvusd', 'SCRVUSD'),
        disabled: !address,
        variant: 'secondary',
        full: true
      })
    )
  );

  return el(
    'div',
    { className: 'min-h-screen bg-slate-50 text-slate-900 p-6 font-sans' },
    el(
      'div',
      { className: 'max-w-3xl mx-auto space-y-6' },
      el(
        'header',
        { className: 'flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6' },
        el(
          'div',
          null,
          el('h1', { className: 'text-2xl font-bold tracking-tight' }, 'Administrator'),
          el(
            'p',
            { className: 'text-xs text-slate-500 mt-1' },
            'Claim protocol revenue and swap to USDC. Every action below is signed by hand on your Ledger — nothing here runs unattended.'
          )
        ),
        el('a', { href: '/', className: 'text-xs text-slate-500 hover:text-slate-900 underline' }, '← Back to Dashboard')
      ),
      el('div', { className: 'bg-white border border-slate-200 shadow-sm rounded-xl p-5' }, walletCard),
      resupplyCard,
      yieldBasisCard,
      unionCard
    )
  );
}
