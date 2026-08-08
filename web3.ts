'use client';

import { BrowserProvider } from 'ethers';

// Ethereum Mainnet only — every contract this app talks to (Resupply, YieldBasis,
// the Union scrvUSD distributor, CoW Protocol) lives on mainnet.
export const MAINNET_CHAIN_ID_HEX = '0x1';
export const MAINNET_CHAIN_ID = 1;

/**
 * Connects to whatever injected wallet the browser exposes (Rabby, MetaMask, etc.)
 * via the standard EIP-1193 `window.ethereum` provider. This deliberately does NOT
 * use WalletConnect — per your setup, Rabby (paired with your Ledger over USB) is
 * injected directly, so there's no need for a relay/QR-code connection.
 *
 * Every transaction and signature still has to be approved by hand on your Ledger —
 * this function only requests account access, it never signs anything itself.
 */
export async function connectWallet(): Promise<{ provider: BrowserProvider; address: string }> {
  const eth = (window as any).ethereum;
  if (!eth) {
    throw new Error(
      'No injected wallet found. Install/enable the Rabby (or MetaMask) browser extension and connect it to your Ledger first.'
    );
  }

  const accounts: string[] = await eth.request({ method: 'eth_requestAccounts' });
  if (!accounts || accounts.length === 0) {
    throw new Error('Wallet connection was rejected or no account was returned.');
  }

  const chainId: string = await eth.request({ method: 'eth_chainId' });
  if (chainId?.toLowerCase() !== MAINNET_CHAIN_ID_HEX) {
    try {
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: MAINNET_CHAIN_ID_HEX }],
      });
    } catch (err) {
      throw new Error('Please switch your wallet to Ethereum Mainnet and try again.');
    }
  }

  const provider = new BrowserProvider(eth);
  return { provider, address: accounts[0] };
}
