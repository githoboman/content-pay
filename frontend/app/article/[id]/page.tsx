'use client';

import React, { useEffect, useState, use } from 'react';
import { Contract, JsonRpcProvider, formatEther } from 'ethers';
import { useWallet } from '../../../context/WalletContext';
import { CONTENT_REGISTRY_ABI, ERC20_ABI } from '../../../lib/abi';
import {
  CONTRACT_ADDRESSES,
  DEFAULT_CHAIN_ID,
  formatAddress,
  formatUsd,
  NETWORKS,
} from '../../../lib/botchain';
import GradientBackground from '../../../components/GradientBackground';
import Navigation from '../../../components/Navigation';
import Link from 'next/link';

interface ArticleDetail {
  id: number;
  title: string;
  author: string;
  contentUri: string;
  priceUsdCents: number;
  category: string;
  active: boolean;
  publishedAt: number;
  isPurchased: boolean;
}

export default function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const articleId = parseInt(resolvedParams.id, 10);

  const { account, chainId, provider, isConnected, connect, isCorrectNetwork, switchToBohrTestnet, refreshBalance } =
    useWallet();

  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [requiredBot, setRequiredBot] = useState<string>('0');
  const [isBuying, setIsBuying] = useState(false);
  const [buyMethod, setBuyMethod] = useState<'BOT' | 'USDC'>('BOT');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [claimedUsdc, setClaimedUsdc] = useState(false);

  const activeChainId = chainId && (chainId === 968 || chainId === 677) ? chainId : DEFAULT_CHAIN_ID;
  const registryAddress = CONTRACT_ADDRESSES[activeChainId]?.contentRegistry;
  const usdcAddress = CONTRACT_ADDRESSES[activeChainId]?.mockUsdc;

  const fetchArticle = async () => {
    try {
      setLoading(true);
      const rpcUrl = NETWORKS[activeChainId]?.rpcUrl || 'https://rpc.bohr.life';
      const readProvider = provider || new JsonRpcProvider(rpcUrl);

      const registry = new Contract(registryAddress, CONTENT_REGISTRY_ABI, readProvider);

      try {
        const raw = await registry.getArticle(articleId);
        let hasPurchased = false;

        if (account) {
          hasPurchased = await registry.hasPurchased(articleId, account);
        }

        const priceCents = Number(raw.priceUsdCents);
        const botWei = await registry.calculateBotAmount(priceCents);
        setRequiredBot(formatEther(botWei));

        setArticle({
          id: Number(raw.id),
          title: raw.title,
          author: raw.author,
          contentUri: raw.contentUri,
          priceUsdCents: priceCents,
          category: raw.category || 'General',
          active: raw.active,
          publishedAt: Number(raw.publishedAt || Date.now() / 1000),
          isPurchased: hasPurchased || (account && raw.author.toLowerCase() === account.toLowerCase()) || false,
        });
        return;
      } catch (contractErr) {
        console.warn('Could not load article from contract, using mock data:', contractErr);
      }

      // Fallback mock article for local testing/demo
      const mockPriceCents = 150;
      setRequiredBot('1.50');
      setArticle({
        id: articleId,
        title: articleId === 1
          ? 'Autonomous DePIN Nodes & Agent OS on BOT Chain'
          : `BOT Chain Ecosystem Analysis #${articleId}`,
        author: '0x518F3fC641dFC01c48343251f67f0Dd0b349deeb',
        contentUri: `ipfs://bafybeidemo${articleId}`,
        priceUsdCents: mockPriceCents,
        category: 'DePIN & AI',
        active: true,
        publishedAt: Math.floor(Date.now() / 1000) - 3600,
        isPurchased: false,
      });
    } catch (err) {
      console.error('Failed to load article:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticle();
  }, [articleId, account, activeChainId]);

  const handleBuyWithBot = async () => {
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
      setIsBuying(true);
      setErrorMsg(null);
      const signer = await provider.getSigner();
      const registry = new Contract(registryAddress, CONTENT_REGISTRY_ABI, signer);

      // Get exact required BOT wei
      const priceCents = article?.priceUsdCents || 100;
      const requiredWei = await registry.calculateBotAmount(priceCents);

      const tx = await registry.purchaseWithBOT(articleId, { value: requiredWei });
      setTxHash(tx.hash);

      // Fast ~0.75s confirmation
      await tx.wait();

      if (article) {
        setArticle({ ...article, isPurchased: true });
      }
      await refreshBalance();
    } catch (err: any) {
      console.error('BOT Purchase failed:', err);
      setErrorMsg(err.reason || err.message || 'Purchase failed.');
    } finally {
      setIsBuying(false);
    }
  };

  const handleBuyWithUsdc = async () => {
    if (!isConnected) {
      await connect();
      return;
    }
    if (!isCorrectNetwork) {
      await switchToBohrTestnet();
      return;
    }
    if (!provider || !usdcAddress) return;

    try {
      setIsBuying(true);
      setErrorMsg(null);
      const signer = await provider.getSigner();
      const usdc = new Contract(usdcAddress, ERC20_ABI, signer);
      const registry = new Contract(registryAddress, CONTENT_REGISTRY_ABI, signer);

      const priceCents = article?.priceUsdCents || 100;
      // 6 decimals: 100 cents = 1,000,000 units
      const tokenUnits = BigInt(priceCents) * 10000n;

      // Check allowance
      const userAddr = await signer.getAddress();
      const currentAllowance = await usdc.allowance(userAddr, registryAddress);

      if (currentAllowance < tokenUnits) {
        const approveTx = await usdc.approve(registryAddress, tokenUnits);
        await approveTx.wait();
      }

      // Call purchaseWithToken
      const tx = await registry.purchaseWithToken(articleId, usdcAddress);
      setTxHash(tx.hash);
      await tx.wait();

      if (article) {
        setArticle({ ...article, isPurchased: true });
      }
    } catch (err: any) {
      console.error('USDC Purchase failed:', err);
      setErrorMsg(err.reason || err.message || 'USDC Purchase failed.');
    } finally {
      setIsBuying(false);
    }
  };

  const handleClaimTestUsdc = async () => {
    if (!provider || !usdcAddress || !account) return;
    try {
      const signer = await provider.getSigner();
      const usdc = new Contract(usdcAddress, ERC20_ABI, signer);
      // Mint 100 USDC (100 * 10^6)
      const tx = await usdc.mintFaucet(account, 100n * 1000000n);
      await tx.wait();
      setClaimedUsdc(true);
      alert('✅ 100 Mock USDC minted to your wallet!');
    } catch (err) {
      console.error('Faucet failed:', err);
    }
  };

  return (
    <GradientBackground>
      <Navigation />

      <main className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/browse" className="hover:text-white transition-colors">
              Articles
            </Link>
            <span>/</span>
            <span className="text-cyan-400 font-mono">#{articleId}</span>
          </div>

          {loading ? (
            <div className="h-96 rounded-3xl bg-white/5 animate-pulse border border-white/5"></div>
          ) : !article ? (
            <div className="text-center py-20 bg-[#0F172A]/60 rounded-3xl border border-white/10 p-8">
              <h2 className="text-2xl font-bold text-white mb-2">Article Not Found</h2>
              <p className="text-gray-400 text-sm mb-4">This article does not exist or has been removed.</p>
              <Link href="/browse" className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold">
                Back to Explore
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Header Box */}
              <div className="p-8 bg-[#0F172A]/70 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 text-xs font-bold rounded-lg bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                    {article.category}
                  </span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-white">
                      {formatUsd(article.priceUsdCents)}
                    </span>
                    <span className="text-xs text-gray-400 ml-1.5">
                      (~{requiredBot} {activeChainId === 677 ? 'BOT' : 'tBOT'})
                    </span>
                  </div>
                </div>

                <h1 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">
                  {article.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-cyan-400">Author:</span>
                    <span className="font-mono text-gray-300">{formatAddress(article.author)}</span>
                  </div>
                  <span>•</span>
                  <div>
                    <span className="text-cyan-400">Network:</span>{' '}
                    <span>{activeChainId === 677 ? 'BOT Mainnet' : 'Bohr Testnet (968)'}</span>
                  </div>
                  <span>•</span>
                  <div>
                    <span className="text-cyan-400">Settlement:</span> ~0.75s Blocks
                  </div>
                </div>
              </div>

              {/* Purchase or Unlocked Content Section */}
              {article.isPurchased ? (
                /* Unlocked Article Body */
                <div className="p-8 sm:p-10 bg-[#0F172A]/80 backdrop-blur-2xl border border-emerald-500/30 rounded-3xl shadow-2xl space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                      <span>Content Unlocked & Verified on BOT Chain</span>
                    </div>
                    <span className="text-xs font-mono text-gray-400">{article.contentUri}</span>
                  </div>

                  <div className="prose prose-invert max-w-none text-gray-200 text-sm sm:text-base leading-relaxed space-y-4">
                    <p className="font-semibold text-lg text-white">
                      {article.title}
                    </p>
                    <p>
                      Welcome to the decentralized knowledge economy powered by BOT Chain. This article access has been
                      cryptographically confirmed on-chain. Through BOT Chain&apos;s high-performance consensus, transaction
                      fees remain negligible (~$0.06), enabling micro-content economies that were previously impractical on
                      legacy Layer 1s.
                    </p>
                    <div className="p-5 rounded-2xl bg-black/40 border border-cyan-500/20 my-4">
                      <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-2">
                        On-Chain Architecture Highlights
                      </h4>
                      <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-300">
                        <li>Decentralized content locator: <code className="text-cyan-200 font-mono">{article.contentUri}</code></li>
                        <li>Platform fee: 3% automatically routed to the protocol treasury</li>
                        <li>Direct author compensation: 97% instantly settled into creator EVM address</li>
                        <li>Sub-second confirmation: Verified within ~0.75s block time</li>
                      </ul>
                    </div>
                    <p>
                      In the new paradigm of Agent OS and ERC-8004 identity, autonomous AI agents operate side-by-side with
                      human writers. An agent can research market telemetry, synthesize insights into an article, register the
                      identity with BOT Chain&apos;s Agent OS, and immediately start collecting native BOT micropayments.
                    </p>
                  </div>

                  {txHash && (
                    <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
                      <span>Transaction confirmed:</span>
                      <a
                        href={`https://scan.bohr.life/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 underline font-mono text-[11px]"
                      >
                        {txHash}
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                /* Paywall Card */
                <div className="p-8 sm:p-10 bg-[#0F172A]/70 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden">
                  <div className="text-center max-w-md mx-auto space-y-4 mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-indigo-500/20 to-fuchsia-500/20 border border-cyan-500/30 flex items-center justify-center text-3xl mx-auto shadow-lg shadow-cyan-500/10">
                      🔒
                    </div>
                    <h2 className="text-2xl font-black text-white">Unlock Full Article</h2>
                    <p className="text-xs text-gray-400">
                      A single on-chain payment grants you permanent, decentralized access to this article. 97% goes directly to the author.
                    </p>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="max-w-md mx-auto mb-6">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Choose Payment Currency
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setBuyMethod('BOT')}
                        className={`p-3.5 rounded-2xl border text-left transition-all ${
                          buyMethod === 'BOT'
                            ? 'bg-cyan-950/60 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                            : 'bg-black/30 border-white/10 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-white">Native BOT</span>
                          <span className="text-base">🪙</span>
                        </div>
                        <div className="text-xs text-cyan-300 font-mono font-semibold">
                          ~{requiredBot} {activeChainId === 677 ? 'BOT' : 'tBOT'}
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBuyMethod('USDC')}
                        className={`p-3.5 rounded-2xl border text-left transition-all ${
                          buyMethod === 'USDC'
                            ? 'bg-indigo-950/60 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                            : 'bg-black/30 border-white/10 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-white">USDC Token</span>
                          <span className="text-base">💵</span>
                        </div>
                        <div className="text-xs text-indigo-300 font-mono font-semibold">
                          {formatUsd(article.priceUsdCents)} USDC
                        </div>
                      </button>
                    </div>

                    {buyMethod === 'USDC' && (
                      <div className="mt-3 text-right">
                        <button
                          type="button"
                          onClick={handleClaimTestUsdc}
                          className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-medium"
                        >
                          💧 Need Test USDC? Claim 100 free
                        </button>
                      </div>
                    )}
                  </div>

                  {errorMsg && (
                    <div className="max-w-md mx-auto p-3 mb-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300 text-xs text-center">
                      {errorMsg}
                    </div>
                  )}

                  {/* Purchase Action Button */}
                  <div className="max-w-md mx-auto">
                    <button
                      onClick={buyMethod === 'BOT' ? handleBuyWithBot : handleBuyWithUsdc}
                      disabled={isBuying}
                      className="w-full py-4 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-600 hover:from-cyan-400 hover:via-indigo-500 hover:to-fuchsia-500 shadow-xl shadow-indigo-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isBuying ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                          </svg>
                          <span>Confirming on BOT Chain (~0.75s)...</span>
                        </>
                      ) : (
                        <>
                          <span>⚡</span>
                          <span>
                            Unlock Now with {buyMethod === 'BOT' ? 'tBOT' : 'USDC'} ({formatUsd(article.priceUsdCents)})
                          </span>
                        </>
                      )}
                    </button>
                    <p className="text-center text-[11px] text-gray-500 mt-2.5">
                      Sub-second finality • Non-custodial direct split • Gas ~$0.06
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </GradientBackground>
  );
}
