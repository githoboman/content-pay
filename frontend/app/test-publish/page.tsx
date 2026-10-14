'use client';

import React, { useState } from 'react';
import { Contract } from 'ethers';
import { useWallet } from '../../context/WalletContext';
import { CONTENT_REGISTRY_ABI } from '../../lib/abi';
import { CONTRACT_ADDRESSES, DEFAULT_CHAIN_ID } from '../../lib/botchain';
import GradientBackground from '../../components/GradientBackground';
import Navigation from '../../components/Navigation';
import Link from 'next/link';

export default function TestPublishPage() {
  const { account, chainId, provider, isConnected, connect, isCorrectNetwork, switchToBohrTestnet } = useWallet();

  const [publishing, setPublishing] = useState(false);
  const [lastTxId, setLastTxId] = useState<string | null>(null);
  const [lastArticleId, setLastArticleId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeChainId = chainId && (chainId === 968 || chainId === 677) ? chainId : DEFAULT_CHAIN_ID;
  const registryAddress = CONTRACT_ADDRESSES[activeChainId]?.contentRegistry;

  const publishTestArticle = async () => {
    if (!isConnected) {
      await connect();
      return;
    }
    if (!isCorrectNetwork) {
      await switchToBohrTestnet();
      return;
    }
    if (!provider) return;

    try {
      setPublishing(true);
      setErrorMsg(null);
      setLastTxId(null);

      const signer = await provider.getSigner();
      const registry = new Contract(registryAddress, CONTENT_REGISTRY_ABI, signer);

      const timestamp = Date.now();
      const title = `Bohr Testnet Article #${Math.floor(timestamp / 1000).toString().slice(-4)}`;
      const uri = `ipfs://bafybeibohrtest${timestamp}`;
      const priceCents = 150; // $1.50
      const category = 'Testing';

      const tx = await registry.publishArticle(title, uri, priceCents, category);
      setLastTxId(tx.hash);

      const receipt = await tx.wait();

      // Get articleCounter
      const currentCounter = await registry.articleCounter();
      setLastArticleId(Number(currentCounter));
    } catch (err: any) {
      console.error('Test publish failed:', err);
      setErrorMsg(err.reason || err.message || 'Publishing failed');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <GradientBackground>
      <Navigation />

      <main className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 mb-3">
              <span>🧪</span>
              <span>Bohr Testnet Lab</span>
            </div>
            <h1 className="text-4xl font-black text-white">Testnet Publishing Lab</h1>
            <p className="text-sm text-gray-400 mt-2">
              Rapidly publish mock articles to Bohr Testnet (Chain ID 968) to verify contract interaction and ~0.75s block confirmations.
            </p>
          </div>

          <div className="p-8 bg-[#0F172A]/70 backdrop-blur-xl border border-white/10 rounded-3xl space-y-6">
            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Network:</span>
                <span className="text-cyan-400 font-semibold">Bohr Testnet (Chain 968)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">ContentRegistry:</span>
                <span className="font-mono text-gray-300">{registryAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Connected Wallet:</span>
                <span className="font-mono text-gray-300">{account || 'Not connected'}</span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300 text-xs">
                {errorMsg}
              </div>
            )}

            {lastTxId && (
              <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs space-y-1.5">
                <div className="font-bold">✅ Article Published Successfully on BOT Chain!</div>
                {lastArticleId && <div>Article ID: <strong className="text-white">#{lastArticleId}</strong></div>}
                <div className="text-gray-400">
                  Transaction Hash:{' '}
                  <a
                    href={`https://scan.bohr.life/tx/${lastTxId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-300 underline font-mono break-all"
                  >
                    {lastTxId}
                  </a>
                </div>
                <div className="pt-2">
                  <Link
                    href={`/article/${lastArticleId || 1}`}
                    className="inline-block px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold"
                  >
                    View Article Page →
                  </Link>
                </div>
              </div>
            )}

            <button
              onClick={publishTestArticle}
              disabled={publishing}
              className="w-full py-4 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-600 hover:from-cyan-400 hover:via-indigo-500 hover:to-fuchsia-500 shadow-xl shadow-cyan-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {publishing ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Broadcasting to Bohr Testnet (~0.75s)...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>1-Click Publish Test Article ($1.50)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </GradientBackground>
  );
}
