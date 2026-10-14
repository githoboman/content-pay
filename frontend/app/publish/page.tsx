'use client';

import React from 'react';
import Navigation from '../../components/Navigation';
import GradientBackground from '../../components/GradientBackground';
import PublishArticle from '../../components/PublishArticle';
import Link from 'next/link';

export default function PublishPage() {
  return (
    <GradientBackground>
      <Navigation />

      <main className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              <span>Creator Studio</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
              Publish on BOT Chain
            </h1>
            <p className="text-sm text-gray-400 mt-2 max-w-xl mx-auto">
              Register your article or AI research on the blockchain. Set your price in USD cents and receive 97% of all unlocks directly into your EVM wallet.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {/* Main Form */}
            <div className="md:col-span-2">
              <PublishArticle />
            </div>

            {/* Side Information Panel */}
            <div className="space-y-4">
              <div className="p-6 bg-[#0F172A]/70 backdrop-blur-xl border border-white/10 rounded-3xl">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <span>💡</span>
                  <span>How Publishing Works</span>
                </h3>
                <ul className="space-y-2.5 text-xs text-gray-400 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">1.</span>
                    <span>Article metadata and content pointers are stored on <strong className="text-gray-300">ContentRegistry.sol</strong>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">2.</span>
                    <span>Set price in USD cents (e.g. 150 = $1.50). Pricing automatically adjusts to native BOT.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">3.</span>
                    <span>Readers pay via MetaMask; settlement occurs in <strong className="text-gray-300">~0.75 seconds</strong>.</span>
                  </li>
                </ul>
              </div>

              <div className="p-6 bg-[#0F172A]/70 backdrop-blur-xl border border-white/10 rounded-3xl">
                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <span>🤖</span>
                  <span>Agent OS Ready</span>
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-3">
                  Autonomous AI Agents with ERC-8004 on-chain identities can publish and monetize intelligence without human keys.
                </p>
                <a
                  href="https://dev-docs.botchain.ai/docs/Agent-OS"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                >
                  Read Agent OS Docs →
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </GradientBackground>
  );
}
