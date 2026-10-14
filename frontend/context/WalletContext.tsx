'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { BrowserProvider, formatEther } from 'ethers';
import { NETWORKS, DEFAULT_CHAIN_ID, switchOrAddNetwork, BotChainNetwork } from '../lib/botchain';

interface WalletContextType {
  account: string | null;
  chainId: number | null;
  balance: string;
  isConnecting: boolean;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  currentNetwork: BotChainNetwork | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchToBohrTestnet: () => Promise<void>;
  switchToBotMainnet: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  provider: BrowserProvider | null;
}

const WalletContext = createContext<WalletContextType>({
  account: null,
  chainId: null,
  balance: '0',
  isConnecting: false,
  isConnected: false,
  isCorrectNetwork: false,
  currentNetwork: null,
  connect: async () => {},
  disconnect: () => {},
  switchToBohrTestnet: async () => {},
  switchToBotMainnet: async () => {},
  refreshBalance: async () => {},
  provider: null,
});

export const useWallet = () => useContext(WalletContext);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);

  const fetchBalance = useCallback(async (userAddress: string, activeProvider: BrowserProvider) => {
    try {
      const bal = await activeProvider.getBalance(userAddress);
      const formatted = parseFloat(formatEther(bal)).toFixed(4);
      setBalance(formatted);
    } catch (e) {
      console.error('Failed to fetch BOT balance:', e);
    }
  }, []);

  const refreshBalance = useCallback(async () => {
    if (account && provider) {
      await fetchBalance(account, provider);
    }
  }, [account, provider, fetchBalance]);

  // Handle chain changed
  const handleChainChanged = useCallback((hexChainId: string) => {
    const numericChainId = parseInt(hexChainId, 16);
    setChainId(numericChainId);
    if (typeof window !== 'undefined' && window.ethereum) {
      const newProvider = new BrowserProvider(window.ethereum);
      setProvider(newProvider);
      if (account) {
        fetchBalance(account, newProvider);
      }
    }
  }, [account, fetchBalance]);

  // Handle accounts changed
  const handleAccountsChanged = useCallback((accounts: string[]) => {
    if (accounts.length === 0) {
      setAccount(null);
      setBalance('0');
    } else {
      setAccount(accounts[0]);
      if (provider) {
        fetchBalance(accounts[0], provider);
      }
    }
  }, [provider, fetchBalance]);

  // Initialize on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const browserProvider = new BrowserProvider(window.ethereum);
      setProvider(browserProvider);

      window.ethereum
        .request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts && accounts.length > 0) {
            setAccount(accounts[0]);
            browserProvider.getNetwork().then((net) => {
              const numericId = Number(net.chainId);
              setChainId(numericId);
              fetchBalance(accounts[0], browserProvider);
            });
          }
        })
        .catch(console.error);

      window.ethereum
        .request({ method: 'eth_chainId' })
        .then((hexChain: string) => {
          setChainId(parseInt(hexChain, 16));
        })
        .catch(console.error);

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum?.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [handleAccountsChanged, handleChainChanged, fetchBalance]);

  const connect = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      alert('No Web3 wallet found. Please install MetaMask or an EVM-compatible wallet to use ContentPay on BOT Chain.');
      return;
    }

    try {
      setIsConnecting(true);
      const browserProvider = new BrowserProvider(window.ethereum);
      setProvider(browserProvider);

      const accounts: string[] = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        const net = await browserProvider.getNetwork();
        const numericId = Number(net.chainId);
        setChainId(numericId);
        await fetchBalance(accounts[0], browserProvider);

        // If not on Bohr Testnet or BOT Mainnet, prompt switch
        if (numericId !== 968 && numericId !== 677) {
          try {
            await switchOrAddNetwork(DEFAULT_CHAIN_ID);
          } catch (switchErr) {
            console.warn('Network switch canceled or failed:', switchErr);
          }
        }
      }
    } catch (err: any) {
      console.error('Wallet connection failed:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAccount(null);
    setBalance('0');
  };

  const switchToBohrTestnet = async () => {
    await switchOrAddNetwork(968);
  };

  const switchToBotMainnet = async () => {
    await switchOrAddNetwork(677);
  };

  const isConnected = !!account;
  const isCorrectNetwork = chainId === 968 || chainId === 677;
  const currentNetwork = chainId ? NETWORKS[chainId] || null : null;

  return (
    <WalletContext.Provider
      value={{
        account,
        chainId,
        balance,
        isConnecting,
        isConnected,
        isCorrectNetwork,
        currentNetwork,
        connect,
        disconnect,
        switchToBohrTestnet,
        switchToBotMainnet,
        refreshBalance,
        provider,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}
