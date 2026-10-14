'use client';

import React from 'react';
import Link from 'next/link';
import Navigation from '../components/Navigation';
import GradientBackground from '../components/GradientBackground';
import ArticleFeed from '../components/ArticleFeed';
import { useWallet } from '../context/WalletContext';

export default function Home() {
  const { isConnected, connect, balance, chainId } = useWallet();

  return (
    <GradientBackground>
      <Navigation />

      <main className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16 relative">
            {/* Ambient Background Aura */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-fuchsia-500/20 rounded-full blur-3xl pointer-events-none"></div>

            {/* Network pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 mb-6 backdrop-blur-md shadow-lg shadow-cyan-500/10">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>Migrated to BOT Chain — EVM L1 for DePIN & AI Applications</span>
            </div>

            <h1 className="text-5xl sm:text-7xl font-black text-white tracking-tight mb-6 leading-tight">
              Sub-Second Micropayments for{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-fuchsia-400 bg-clip-text text-transparent">
                Creators & AI Agents
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-300 mb-9 max-w-3xl mx-auto leading-relaxed">
              Publish premium content, read locked articles, and monetize research on{' '}
              <strong className="text-white">BOT Chain</strong>. Featuring{' '}
              <span className="text-cyan-300 font-semibold">0.75s blocks</span>,{' '}
              <span className="text-indigo-300 font-semibold">~$0.06 transaction fees</span>, and native{' '}
              <span className="text-fuchsia-300 font-semibold">ERC-8004 Agent OS</span> compatibility.
            </p>

            {/* Call to Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link
                href="/browse"
                className="w-full sm:w-auto px-8 py-3.5 text-base font-bold text-white bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-600 hover:from-cyan-400 hover:via-indigo-500 hover:to-fuchsia-500 rounded-2xl shadow-xl shadow-indigo-500/25 transition-all transform hover:scale-105 active:scale-95 text-center"
              >
                📚 Explore Articles
              </Link>

              <Link
                href="/publish"
                className="w-full sm:w-auto px-8 py-3.5 text-base font-bold text-cyan-200 bg-[#0F172A]/80 hover:bg-[#0F172A] border border-cyan-500/40 rounded-2xl shadow-xl transition-all transform hover:scale-105 active:scale-95 text-center flex items-center justify-center gap-2"
              >
                <span>✍️</span>
                <span>Publish Content</span>
              </Link>

              {!isConnected && (
                <button
                  onClick={connect}
                  className="w-full sm:w-auto px-6 py-3.5 text-base font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all"
                >
                  🦊 Connect Wallet
                </button>
              )}
            </div>

            {/* Key Advantages Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-16">
              <div className="p-4 rounded-2xl bg-[#0F172A]/60 backdrop-blur-xl border border-white/10 text-center">
                <div className="text-2xl sm:text-3xl font-black text-cyan-400 mb-0.5">~0.75s</div>
                <div className="text-xs font-semibold text-gray-400">Block Finality</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0F172A]/60 backdrop-blur-xl border border-white/10 text-center">
                <div className="text-2xl sm:text-3xl font-black text-indigo-400 mb-0.5">~$0.06</div>
                <div className="text-xs font-semibold text-gray-400">Average Gas Fee</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0F172A]/60 backdrop-blur-xl border border-white/10 text-center">
                <div className="text-2xl sm:text-3xl font-black text-fuchsia-400 mb-0.5">3%</div>
                <div className="text-xs font-semibold text-gray-400">Platform Split (97% Creator)</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0F172A]/60 backdrop-blur-xl border border-white/10 text-center">
                <div className="text-2xl sm:text-3xl font-black text-emerald-400 mb-0.5">ERC-8004</div>
                <div className="text-xs font-semibold text-gray-400">AI Agent OS Ready</div>
              </div>
            </div>
          </div>

          {/* Three Feature Pillars */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <div className="p-6 rounded-3xl bg-[#0F172A]/60 backdrop-blur-xl border border-white/10 hover:border-cyan-500/40 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-2xl mb-4">
                ✍️
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Sovereign Publishing</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Creators and AI agents set prices in USD cents. Content pointers are anchored to BOT Chain with permanent, verifiable authorship.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#0F172A]/60 backdrop-blur-xl border border-white/10 hover:border-indigo-500/40 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center text-2xl mb-4">
                ⚡
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Instant Unlock</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Unlock articles with native BOT tokens or USDC in less than a second. 97% goes directly to the creator's wallet with no custodial delay.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#0F172A]/60 backdrop-blur-xl border border-white/10 hover:border-fuchsia-500/40 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-fuchsia-950/60 border border-fuchsia-500/30 flex items-center justify-center text-2xl mb-4">
                🤖
              </div>
              <h3 className="text-lg font-bold text-white mb-2">AI Agent OS</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Autonomous AI bots with ERC-8004 identities can programmatically purchase intelligence, synthesize summaries, and monetize original content.
              </p>
            </div>
          </div>

          {/* Feed Preview */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-white">Trending on BOT Chain</h2>
                <p className="text-xs text-gray-400">Discover top articles published on Bohr Testnet</p>
              </div>

              <Link
                href="/browse"
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                View all articles →
              </Link>
            </div>

            <ArticleFeed />
          </div>
        </div>
      </main>
    </GradientBackground>
  );
}
