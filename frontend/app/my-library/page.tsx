'use client';

import React, { useEffect, useState } from 'react';
import { Contract, JsonRpcProvider } from 'ethers';
import { useWallet } from '../../context/WalletContext';
import { CONTENT_REGISTRY_ABI } from '../../lib/abi';
import {
  CONTRACT_ADDRESSES,
  DEFAULT_CHAIN_ID,
  formatAddress,
  formatUsd,
  NETWORKS,
} from '../../lib/botchain';
import Navigation from '../../components/Navigation';
import GradientBackground from '../../components/GradientBackground';
import Link from 'next/link';

interface PurchasedArticle {
  id: number;
  title: string;
  author: string;
  priceUsdCents: number;
  category: string;
  contentUri: string;
}

export default function MyLibraryPage() {
  const { account, chainId, provider, isConnected, connect } = useWallet();
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<PurchasedArticle[]>([]);

  const activeChainId = chainId && (chainId === 968 || chainId === 677) ? chainId : DEFAULT_CHAIN_ID;
  const registryAddress = CONTRACT_ADDRESSES[activeChainId]?.contentRegistry;

  const fetchPurchasedArticles = async () => {
    if (!account) {
      setLoading(false);
      setArticles([]);
      return;
    }

    try {
      setLoading(true);
      const rpcUrl = NETWORKS[activeChainId]?.rpcUrl || 'https://rpc.bohr.life';
      const readProvider = provider || new JsonRpcProvider(rpcUrl);
      const registry = new Contract(registryAddress, CONTENT_REGISTRY_ABI, readProvider);

      try {
        const ids: bigint[] = await registry.getPurchasedArticles(account);
        const list: PurchasedArticle[] = [];

        for (const idBig of ids) {
          const id = Number(idBig);
          const raw = await registry.articles(id);
          list.push({
            id,
            title: raw.title,
            author: raw.author,
            priceUsdCents: Number(raw.priceUsdCents),
            category: raw.category || 'General',
            contentUri: raw.contentUri,
          });
        }
        setArticles(list);
        return;
      } catch (e) {
        console.warn('Could not load purchased list from contract:', e);
      }

      setArticles([]);
    } catch (err) {
      console.error('Error loading library:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchasedArticles();
  }, [account, activeChainId]);

  return (
    <GradientBackground>
      <Navigation />

      <main className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                <span>Permanent Sovereign Access</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                My Library
              </h1>
              <p className="text-sm text-gray-400 mt-2">
                All articles and AI research unlocked by your BOT Chain EVM account.
              </p>
            </div>

            {account && (
              <div className="px-4 py-2 bg-[#0F172A]/70 border border-white/10 rounded-2xl text-xs font-mono text-gray-300">
                Wallet: <span className="text-cyan-400">{formatAddress(account)}</span>
              </div>
            )}
          </div>

          {!isConnected ? (
            <div className="text-center py-20 bg-[#0F172A]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-md mx-auto space-y-4">
              <div className="text-4xl">🦊</div>
              <h3 className="text-xl font-bold text-white">Connect Your Wallet</h3>
              <p className="text-xs text-gray-400">
                Connect your EVM wallet to view the articles you have unlocked on BOT Chain.
              </p>
              <button
                onClick={connect}
                className="px-6 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-lg shadow-cyan-500/20"
              >
                Connect Wallet
              </button>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-44 rounded-3xl bg-white/5 animate-pulse border border-white/5"></div>
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-20 bg-[#0F172A]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-lg mx-auto space-y-4">
              <div className="text-4xl">📖</div>
              <h3 className="text-xl font-bold text-white">Your Library is Empty</h3>
              <p className="text-xs text-gray-400">
                You haven&apos;t purchased any articles yet on Bohr Testnet. Explore trending content and unlock an article in ~0.75 seconds!
              </p>
              <Link
                href="/browse"
                className="inline-block px-6 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-lg shadow-cyan-500/20"
              >
                Browse Articles
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {articles.map((item) => (
                <div
                  key={item.id}
                  className="p-6 bg-[#0F172A]/70 backdrop-blur-xl border border-emerald-500/30 hover:border-emerald-500/50 rounded-3xl transition-all shadow-xl flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                        ✓ Unlocked
                      </span>
                      <span className="text-xs text-gray-400 font-mono">#{item.id}</span>
                    </div>

                    <Link href={`/article/${item.id}`}>
                      <h3 className="text-lg font-bold text-white hover:text-cyan-300 transition-colors line-clamp-2 mb-2">
                        {item.title}
                      </h3>
                    </Link>

                    <div className="text-xs text-gray-400 mb-4">
                      Author: <span className="font-mono text-gray-300">{formatAddress(item.author)}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs text-cyan-400 font-semibold">{item.category}</span>
                    <Link
                      href={`/article/${item.id}`}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white transition-colors"
                    >
                      Read Content →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </GradientBackground>
  );
}
