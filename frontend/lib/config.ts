import { NETWORKS, DEFAULT_CHAIN_ID, CONTRACT_ADDRESSES } from './botchain';

export const CURRENT_CHAIN_ID = DEFAULT_CHAIN_ID;
export const CURRENT_NETWORK = NETWORKS[CURRENT_CHAIN_ID];

export const CONFIG = {
  chainId: CURRENT_CHAIN_ID,
  networkName: CURRENT_NETWORK.name,
  rpcUrl: CURRENT_NETWORK.rpcUrl,
  blockExplorer: CURRENT_NETWORK.blockExplorer,
  faucetUrl: CURRENT_NETWORK.faucetUrl,
  contentRegistryAddress: CONTRACT_ADDRESSES[CURRENT_CHAIN_ID].contentRegistry,
  mockUsdcAddress: CONTRACT_ADDRESSES[CURRENT_CHAIN_ID].mockUsdc,
};

export default CONFIG;
