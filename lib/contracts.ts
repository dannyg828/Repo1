// Every address on this page was verified against a primary source before being
// hardcoded — either official protocol docs, a verified/open-source contract, or
// (for the Union) your own past on-chain transactions. Sources are noted inline.
// All contracts here live on Ethereum Mainnet.

export const CHAIN_ID = 1;

// ---------------------------------------------------------------------------
// Tokens
// ---------------------------------------------------------------------------
export const TOKENS = {
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  // Source: https://docs.resupply.finance/faq/contract-addresses
  REUSD: '0x57aB1E0003F623289CD798B1824Be09a793e4Bec',
  RSUP: '0x419905009e4656fdC02418C7Df35B1E61Ed5F726',
  // Curve Savings crvUSD — confirmed from your own wallet's transaction history
  // (the token Llama Airforce's Union pays your vlCVX bribe share out as).
  SCRVUSD: '0x0655977FEb2f289A4aB78af67BAB0d17aAb84367',
};

export const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

// ---------------------------------------------------------------------------
// Resupply — reUSD / RSUP reward claims
// Source: https://docs.resupply.finance/faq/contract-addresses
//         https://github.com/resupplyfi/resupply/blob/main/deployment/contracts.json
// ABI confirmed from the verified contract source on Etherscan/Blockscout
// (src/protocol/RewardHandler.sol → claimRewards(address), claimInsuranceRewards()).
// ---------------------------------------------------------------------------
export const RESUPPLY_REWARD_HANDLER = '0x74747408065d6A85DFf07D23F22C921Ce7D0b4B1';

export const RESUPPLY_REWARD_HANDLER_ABI = [
  'function claimRewards(address _pair) external',
  'function claimInsuranceRewards() external',
];

// Known lending-pair addresses (from deployment/contracts.json). If you've supplied
// to one of Resupply's markets, pick the matching pair here before claiming — if
// you're only staking in the Insurance Pool, use the "Insurance Pool" button instead
// and ignore this list.
export const RESUPPLY_PAIRS: { label: string; address: string }[] = [
  { label: 'Curve Lend — sfrxUSD / crvUSD', address: '0xC5184cccf85b81EDdc661330acB3E41bd89F34A1' },
  { label: 'Curve Lend — sDOLA / crvUSD', address: '0x27AB448a75d548ECfF73f8b4F36fCc9496768797' },
  { label: 'Curve Lend — sUSDe / crvUSD', address: '0x39Ea8e7f44E9303A7441b1E1a4F5731F1028505C' },
  { label: 'Curve Lend — USDe / crvUSD', address: '0x3b037329Ff77B5863e6a3c844AD2a7506ABe5706' },
  { label: 'Curve Lend — WBTC / crvUSD', address: '0x2d8ecd48b58e53972dBC54d8d0414002B41Abc9D' },
  { label: 'Curve Lend — WETH / crvUSD', address: '0xCF1deb0570c2f7dEe8C07A7e5FA2bd4b2B96520D' },
  { label: 'Curve Lend — wstETH / crvUSD', address: '0x4A7c64932d1ef0b4a2d430ea10184e3B87095E33' },
  { label: 'Fraxlend — sfrxETH / frxUSD', address: '0x3F2b20b8E8Ce30bb52239d3dFADf826eCFE6A5f7' },
  { label: 'Fraxlend — sUSDe / frxUSD', address: '0x212589B06EBBA4d89d9deFcc8DDc58D80E141EA0' },
  { label: 'Fraxlend — WBTC / frxUSD', address: '0xb5575Fe3d3b7877415A166001F67C2Df94D4e6c1' },
  { label: 'Fraxlend — scrvUSD / frxUSD', address: '0x24CCBd9130ec24945916095eC54e9acC7382c864' },
];

// ---------------------------------------------------------------------------
// YieldBasis — veYB revenue claims
// Source: https://docs.yieldbasis.com/user/reference/contract-addresses
//         https://docs.yieldbasis.com/dev/dao/fee-distributor
// ---------------------------------------------------------------------------
export const YB_FEE_DISTRIBUTOR = '0xD11b416573EbC59b6B2387DA0D2c0D1b3b1F7A90';

export const YB_FEE_DISTRIBUTOR_ABI = [
  'function claim(address receiver, uint256 epoch_count, bool use_vest) external',
  'function preview_claim(address receiver, uint256 epoch_count, bool use_vest) view returns (uint256)',
];

// ---------------------------------------------------------------------------
// Llama Airforce Union — vlCVX bribe revenue (your allocation is paid out as scrvUSD)
// Source: transaction 0x181712178295ca8a2624b518bbc1df1241e6aac8644167b4c0343db4c5577143
// on your wallet — verified contract "sCrvUsdDistributor". Confirmed a second time
// against the live app's own client bundle (llama.airforce/union/member).
//
// IMPORTANT: this claim() call needs an (index, amount, merkleProof) tuple that only
// Llama Airforce's backend can generate for the current round, and we couldn't find a
// public API for it (their Union frontend source is intentionally private). Rather than
// guess, this page links out to https://llama.airforce/union/member for the actual claim
// click, and picks up natively from there to swap whatever scrvUSD lands in your wallet.
// ---------------------------------------------------------------------------
export const UNION_SCRVUSD_DISTRIBUTOR = '0x17AC69DD3FB8f22b4f52DBDb8A3A0eB059367efc';

export const UNION_SCRVUSD_DISTRIBUTOR_ABI = [
  'function claim(uint256 index, address account, uint256 amount, bytes32[] merkleProof) external',
];

export const LLAMA_AIRFORCE_UNION_URL = 'https://llama.airforce/union/member';
