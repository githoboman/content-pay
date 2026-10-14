'use client';

import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { formatAddress } from '../lib/botchain';

export default function ConnectWallet() {
  const {
    account,
    balance,
    isConnecting,
    isConnected,
    isCorrectNetwork,
    currentNetwork,
    connect,
    disconnect,
    switchToBohrTestnet,
    switchToBotMainnet,
    chainId,
  } = useWallet();

  const [showNetworkMenu, setShowNetworkMenu] = useState(false);

  if (!isConnected) {
    return (
      <button
        onClick={connect}
        disabled={isConnecting}
        className="relative group px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-600 hover:from-cyan-400 hover:via-indigo-500 hover:to-fuchsia-500 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-cyan-500/35 active:scale-95 disabled:opacity-50"
      >
        <span className="flex items-center gap-2">
          {isConnecting ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <span>🦊</span>
              <span>Connect Wallet</span>
            </>
          )}
        </span>
      </button>
    );
  }

  // Connected but on wrong chain (not 968 or 677)
  if (!isCorrectNetwork) {
    return (
      <button
        onClick={switchToBohrTestnet}
        className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-amber-200 bg-amber-950/60 border border-amber-500/50 hover:bg-amber-900/60 transition-all flex items-center gap-1.5 animate-pulse"
      >
        <span>⚠️</span>
        <span>Switch to Bohr Testnet</span>
      </button>
    );
  }

  // Connected on valid BOT Chain network
  return (
    <div className="relative flex items-center gap-2">
      {/* Network dropdown trigger */}
      <button
        onClick={() => setShowNetworkMenu(!showNetworkMenu)}
        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition-colors"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
        <span>{chainId === 677 ? 'Mainnet' : 'Bohr (968)'}</span>
        <span className="text-[10px] text-gray-500">▼</span>
      </button>

      {/* Network Switcher Menu */}
      {showNetworkMenu && (
        <div className="absolute top-12 right-0 w-52 p-2 bg-[#0F172A] border border-white/10 rounded-xl shadow-2xl z-50 backdrop-blur-2xl">
          <div className="text-[11px] font-semibold text-gray-400 px-2 py-1 uppercase tracking-wider">
            Select Network
          </div>
          <button
            onClick={() => {
              switchToBohrTestnet();
              setShowNetworkMenu(false);
            }}
            className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
              chainId === 968 ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-500/30' : 'text-gray-300 hover:bg-white/5'
            }`}
          >
            <span>Bohr Testnet</span>
            <span className="text-[10px] text-gray-400">968</span>
          </button>
          <button
            onClick={() => {
              switchToBotMainnet();
              setShowNetworkMenu(false);
            }}
            className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition-colors mt-1 ${
              chainId === 677 ? 'bg-indigo-950/70 text-indigo-300 border border-indigo-500/30' : 'text-gray-300 hover:bg-white/5'
            }`}
          >
            <span>BOT Mainnet</span>
            <span className="text-[10px] text-gray-400">677</span>
          </button>
        </div>
      )}

      {/* Balance Pill */}
      <div className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-950/40 text-indigo-200 border border-indigo-500/30">
        <span>{balance}</span>
        <span className="text-cyan-400">{chainId === 677 ? 'BOT' : 'tBOT'}</span>
      </div>

      {/* Account Address Pill */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-medium text-white bg-white/5 border border-white/10">
        <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
        <span>{formatAddress(account)}</span>
      </div>

      {/* Disconnect button */}
      <button
        onClick={disconnect}
        title="Disconnect Wallet"
        className="p-1.5 text-gray-400 hover:text-red-400 bg-white/5 hover:bg-red-950/40 border border-white/10 hover:border-red-500/30 rounded-xl transition-colors text-xs"
      >
        ✕
      </button>
    </div>
  );
}
