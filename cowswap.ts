'use client';

import { Contract, type BrowserProvider } from 'ethers';
import { CowSdk, SupportedChainId } from '@cowprotocol/cow-sdk';
import { EthersV6Adapter } from '@cowprotocol/sdk-ethers-v6-adapter';
import { ERC20_ABI, TOKENS } from './contracts';

// CoW Protocol's on-chain contracts (mainnet). Sourced from CoW's own docs and
// cross-checked against the GPv2Settlement address seen in your own past
// CoW trade (0xa6c656dec815b0d441501de73e56914582076337d2f87e6e8740a44fa7f906cd).
export const GPV2_VAULT_RELAYER = '0xC92E8bdf79f0507f65a392b0ab4667716BFE0110';
export const GPV2_SETTLEMENT = '0x9008D19f58AAbD9eD0D60971565AA8510560ab41';

/**
 * Approves the CoW Protocol Vault Relayer to pull EXACTLY `amountWei` of `tokenAddress`
 * — not unlimited approval — and only if the current allowance is insufficient.
 * Requires a signature/confirmation on your Ledger.
 */
export async function ensureApproval(
  provider: BrowserProvider,
  tokenAddress: string,
  amountWei: bigint
): Promise<void> {
  const signer = await provider.getSigner();
  const owner = await signer.getAddress();
  const token = new Contract(tokenAddress, ERC20_ABI, signer);

  const current: bigint = await token.allowance(owner, GPV2_VAULT_RELAYER);
  if (current >= amountWei) return;

  const tx = await token.approve(GPV2_VAULT_RELAYER, amountWei);
  await tx.wait();
}

export interface SwapResult {
  orderId: string;
  orderUrl: string;
}

/**
 * Sells `sellAmountWei` of `sellTokenAddress` for USDC via CoW Swap.
 *
 * This is a gasless limit/market order: you sign an off-chain EIP-712 message (on your
 * Ledger) and CoW's solvers batch-execute it on-chain later — you do not submit an
 * on-chain transaction for the swap itself, only for the token approval (if needed).
 */
export async function swapToUSDC(provider: BrowserProvider, sellTokenAddress: string, sellAmountWei: bigint): Promise<SwapResult> {
  const signer = await provider.getSigner();
  const owner = await signer.getAddress();

  await ensureApproval(provider, sellTokenAddress, sellAmountWei);

  const adapter = new EthersV6Adapter({ provider, signer });
  const sdk = new CowSdk({ chainId: SupportedChainId.MAINNET, adapter });

  const quoteRequest = {
    sellToken: sellTokenAddress,
    buyToken: TOKENS.USDC,
    from: owner,
    receiver: owner,
    sellAmountBeforeFee: sellAmountWei.toString(),
    kind: 'sell' as const,
  };

  const { quote } = await sdk.orderBook.getQuote(quoteRequest);

  // The quote already has a validTo/appData/etc; signing it as-is is what CoW's own
  // docs recommend for a straightforward "sell X for USDC" order.
  const signingResult = await sdk.orderSigning.signOrder(quote as any, SupportedChainId.MAINNET, signer);

  const orderId = await sdk.orderBook.sendOrder({
    ...quote,
    ...signingResult,
    from: owner,
  } as any);

  return {
    orderId,
    orderUrl: `https://explorer.cow.fi/orders/${orderId}`,
  };
}
