'use client';

import React from 'react';
import Navigation from '../../components/Navigation';
import GradientBackground from '../../components/GradientBackground';
import ArticleFeed from '../../components/ArticleFeed';

export default function BrowsePage() {
  return (
    <GradientBackground>
      <Navigation />

      <main className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                <span>On-Chain Marketplace</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                Explore Content
              </h1>
              <p className="text-sm text-gray-400 mt-2 max-w-xl">
                Browse decentralized articles published to BOT Chain. One-click unlock with sub-second finality (~0.75s).
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-300">
                <span className="text-cyan-400 font-bold">97%</span> to Creator
              </div>
              <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-300">
                <span className="text-indigo-400 font-bold">3%</span> Treasury
              </div>
            </div>
          </div>

          <ArticleFeed />
        </div>
      </main>
    </GradientBackground>
  );
}
