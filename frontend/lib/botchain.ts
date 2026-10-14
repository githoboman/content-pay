export interface BotChainNetwork {
  chainId: number;
  hexChainId: string;
  name: string;
  rpcUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorer: string;
  faucetUrl?: string;
  dexUrl?: string;
}

export const NETWORKS: Record<number, BotChainNetwork> = {
  968: {
    chainId: 968,
    hexChainId: "0x3c8",
    name: "Bohr Testnet",
    rpcUrl: process.env.NEXT_PUBLIC_BOT_TESTNET_RPC || "https://rpc.bohr.life",
    nativeCurrency: {
      name: "Test BOT",
      symbol: "tBOT",
      decimals: 18,
    },
    blockExplorer: "https://scan.bohr.life",
    faucetUrl: "https://faucet.botchain.ai/basic",
  },
  677: {
    chainId: 677,
    hexChainId: "0x2a5",
    name: "BOT Mainnet",
    rpcUrl: process.env.NEXT_PUBLIC_BOT_MAINNET_RPC || "https://rpc.botchain.ai",
    nativeCurrency: {
      name: "BOT Token",
      symbol: "BOT",
      decimals: 18,
    },
    blockExplorer: "https://scan.botchain.ai",
    dexUrl: "https://dex.botchain.ai/#/swap",
  },
};

export const DEFAULT_CHAIN_ID = 968; // Bohr Testnet default

export const CONTRACT_ADDRESSES: Record<number, { contentRegistry: string; mockUsdc: string }> = {
  968: {
    contentRegistry: process.env.NEXT_PUBLIC_CONTENT_REGISTRY_ADDRESS || "0x27af961becF8599579A93A7ED1199218B27f3f12",
    mockUsdc: process.env.NEXT_PUBLIC_MOCK_USDC_ADDRESS || "0xa32a17e2d4E9F7C7d502b07e59C52a603d3036D6",
  },
  677: {
    contentRegistry: process.env.NEXT_PUBLIC_MAINNET_REGISTRY_ADDRESS || "0x6E4472c4765668c130C39C9b46B1d56965E54784",
    mockUsdc: process.env.NEXT_PUBLIC_MAINNET_USDC_ADDRESS || "",
  },
};

/**
 * Switch wallet to target BOT Chain network or add it if not already configured in MetaMask
 */
export async function switchOrAddNetwork(targetChainId: number = DEFAULT_CHAIN_ID): Promise<boolean> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No EVM wallet detected. Please install MetaMask or a compatible Web3 wallet.");
  }

  const network = NETWORKS[targetChainId];
  if (!network) {
    throw new Error(`Unsupported network chain ID: ${targetChainId}`);
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: network.hexChainId }],
    });
    return true;
  } catch (switchError: any) {
    // Error code 4902 indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: network.hexChainId,
              chainName: network.name,
              rpcUrls: [network.rpcUrl],
              nativeCurrency: network.nativeCurrency,
              blockExplorerUrls: [network.blockExplorer],
            },
          ],
        });
        return true;
      } catch (addError) {
        console.error("Failed to add network to wallet", addError);
        throw addError;
      }
    }
    console.error("Failed to switch network", switchError);
    throw switchError;
  }
}

export function formatAddress(address: string | null | undefined): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
