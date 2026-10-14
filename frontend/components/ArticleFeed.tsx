'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Contract, JsonRpcProvider } from 'ethers';
import { useWallet } from '../context/WalletContext';
import { CONTENT_REGISTRY_ABI } from '../lib/abi';
import { CONTRACT_ADDRESSES, DEFAULT_CHAIN_ID, formatAddress, formatUsd, NETWORKS } from '../lib/botchain';

export interface ArticleItem {
  id: number;
  title: string;
  author: string;
  contentUri: string;
  priceUsdCents: number;
  category: string;
  active: boolean;
  publishedAt: number;
  isPurchased?: boolean;
}

const DEMO_ARTICLES: ArticleItem[] = [
  {
    id: 1,
    title: 'Autonomous DePIN Nodes & Agent OS on BOT Chain',
    author: '0x518F3fC641dFC01c48343251f67f0Dd0b349deeb',
    contentUri: 'ipfs://bafybeidepinagentos2026',
    priceUsdCents: 150,
    category: 'DePIN & AI',
    active: true,
    publishedAt: Math.floor(Date.now() / 1000) - 3600,
  },
  {
    id: 2,
    title: 'ERC-8004 Verifiable Agent Identity Architecture',
    author: '0xaea9960Ea4C0da854eFbaCcDa178A94720f474f3',
    contentUri: 'ipfs://bafybeigagentidentitydeepdive',
    priceUsdCents: 200,
    category: 'AI Native',
    active: true,
    publishedAt: Math.floor(Date.now() / 1000) - 7200,
  },
  {
    id: 3,
    title: 'Sub-Second Block Finality: Benchmarking BOT Chain vs Ethereum L2s',
    author: '0xC57Bd1276cabba9B5CE650a2cA937D659CbE7646',
    contentUri: 'ipfs://bafybeil1benchmarksfastsettlement',
    priceUsdCents: 99,
    category: 'Research',
    active: true,
    publishedAt: Math.floor(Date.now() / 1000) - 14400,
  },
  {
    id: 4,
    title: 'Micropayments in Machine-to-Machine Agent Economies',
    author: '0x31367402698F3b05777fB004c5A2081feC81FF0e',
    contentUri: 'ipfs://bafybeim2magenteconomymicropayments',
    priceUsdCents: 250,
    category: 'DeFi',
    active: true,
    publishedAt: Math.floor(Date.now() / 1000) - 86400,
  },
];

export default function ArticleFeed() {
  const { account, chainId, provider } = useWallet();
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const activeChainId = chainId && (chainId === 968 || chainId === 677) ? chainId : DEFAULT_CHAIN_ID;
  const registryAddress = CONTRACT_ADDRESSES[activeChainId]?.contentRegistry;

  const fetchArticles = async () => {
    try {
      setLoading(true);
      // Use wallet provider if available, or fall back to public RPC provider
      const rpcUrl = NETWORKS[activeChainId]?.rpcUrl || 'https://rpc.bohr.life';
      const readProvider = provider || new JsonRpcProvider(rpcUrl);

      const registry = new Contract(registryAddress, CONTENT_REGISTRY_ABI, readProvider);

      try {
        const total = await registry.articleCounter();
        const count = Number(total);

        if (count > 0) {
          const list: ArticleItem[] = [];
          for (let i = 1; i <= count; i++) {
            const raw = await registry.articles(i);
            let hasPurchased = false;
            if (account) {
              try {
                hasPurchased = await registry.hasPurchased(i, account);
              } catch (e) {
                // Ignore individual purchase check failure
              }
            }

            list.push({
              id: Number(raw.id || i),
              title: raw.title,
              author: raw.author,
              contentUri: raw.contentUri,
              priceUsdCents: Number(raw.priceUsdCents),
              category: raw.category || 'General',
              active: raw.active,
              publishedAt: Number(raw.publishedAt || Date.now() / 1000),
              isPurchased: Boolean(hasPurchased || (account && raw.author.toLowerCase() === account.toLowerCase())),
            });
          }
          setArticles(list);
          return;
        }
      } catch (contractErr) {
        console.warn('Could not read from deployed contract, using demo articles:', contractErr);
      }

      // Check purchase state on DEMO_ARTICLES
      const demoWithPurchases = DEMO_ARTICLES.map((a) => ({
        ...a,
        isPurchased: account ? a.author.toLowerCase() === account.toLowerCase() : false,
      }));
      setArticles(demoWithPurchases);
    } catch (err) {
      console.error('Error fetching articles:', err);
      setArticles(DEMO_ARTICLES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [account, activeChainId]);

  const categories = useMemo(() => {
    const set = new Set(['All']);
    articles.forEach((a) => set.add(a.category));
    return Array.from(set);
  }, [articles]);

  const filteredArticles = useMemo(() => {
    return articles.filter((a) => {
      const matchesSearch =
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.author.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategory === 'All' || a.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [articles, searchQuery, selectedCategory]);

  return (
    <div className="w-full">
      {/* Controls: Search and Categories */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-8">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <span className="absolute left-3.5 top-3 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search articles or authors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#0F172A]/70 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 backdrop-blur-xl"
          />
        </div>

        {/* Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/20'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 rounded-3xl bg-white/5 animate-pulse border border-white/5"
            ></div>
          ))}
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="text-center py-16 bg-[#0F172A]/50 rounded-3xl border border-white/5 p-8">
          <div className="text-4xl mb-3">📝</div>
          <h3 className="text-lg font-bold text-white mb-1">No articles found</h3>
          <p className="text-gray-400 text-xs mb-4">
            Be the first to publish an article on BOT Chain!
          </p>
          <Link
            href="/publish"
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white rounded-xl text-xs font-bold"
          >
            Publish Article
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => {
            const botCost = (article.priceUsdCents / 100).toFixed(2);
            return (
              <div
                key={article.id}
                className="group relative flex flex-col justify-between p-6 bg-[#0F172A]/70 backdrop-blur-xl border border-white/10 hover:border-cyan-500/40 rounded-3xl transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10 hover:-translate-y-1 overflow-hidden"
              >
                {/* Subtle top gradient accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 opacity-60 group-hover:opacity-100 transition-opacity"></div>

                <div>
                  {/* Category and Price Pill */}
                  <div className="flex items-center justify-between mb-3.5">
                    <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                      {article.category}
                    </span>
                    <div className="text-right">
                      <span className="text-base font-black text-white">
                        {formatUsd(article.priceUsdCents)}
                      </span>
                      <span className="text-[10px] text-gray-400 ml-1">
                        (~{botCost} {activeChainId === 677 ? 'BOT' : 'tBOT'})
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <Link href={`/article/${article.id}`}>
                    <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2 mb-2">
                      {article.title}
                    </h3>
                  </Link>

                  {/* Author & ID */}
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                    <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-[10px] text-white font-bold">
                      ✍️
                    </span>
                    <span className="font-mono text-[11px]">{formatAddress(article.author)}</span>
                    <span className="text-gray-600">•</span>
                    <span className="text-[10px] text-gray-500">#{article.id}</span>
                  </div>
                </div>

                {/* Bottom CTA / Status */}
                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  {article.isPurchased ? (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/50 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                      <span>✓</span>
                      <span>Unlocked</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-gray-400 flex items-center gap-1">
                      <span>⚡</span>
                      <span>Instant 0.75s unlock</span>
                    </div>
                  )}

                  <Link
                    href={`/article/${article.id}`}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      article.isPurchased
                        ? 'bg-white/10 hover:bg-white/15 text-white'
                        : 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-md shadow-cyan-500/20'
                    }`}
                  >
                    {article.isPurchased ? 'Read Now 📖' : 'View & Buy 💳'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
