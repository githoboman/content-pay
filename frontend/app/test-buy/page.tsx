'use client';

import React, { useEffect, useState } from 'react';
import { Contract, JsonRpcProvider, formatEther } from 'ethers';
import { useWallet } from '../../context/WalletContext';
import { CONTENT_REGISTRY_ABI, ERC20_ABI } from '../../lib/abi';
import {
  CONTRACT_ADDRESSES,
  DEFAULT_CHAIN_ID,
  formatAddress,
  formatUsd,
  NETWORKS,
} from '../../lib/botchain';
import GradientBackground from '../../components/GradientBackground';
import Navigation from '../../components/Navigation';
import Link from 'next/link';

interface ArticleItem {
  id: number;
  title: string;
  author: string;
  priceUsdCents: number;
  category: string;
  isPurchased: boolean;
}

export default function TestBuyPage() {
  const { account, chainId, provider, isConnected, connect, isCorrectNetwork, switchToBohrTestnet, refreshBalance } =
    useWallet();

  const [loading, setLoading] = useState(true);
  const [latestArticle, setLatestArticle] = useState<ArticleItem | null>(null);
  const [buying, setBuying] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeChainId = chainId && (chainId === 968 || chainId === 677) ? chainId : DEFAULT_CHAIN_ID;
  const registryAddress = CONTRACT_ADDRESSES[activeChainId]?.contentRegistry;

  const fetchLatest = async () => {
    try {
      setLoading(true);
      const rpcUrl = NETWORKS[activeChainId]?.rpcUrl || 'https://rpc.bohr.life';
      const readProvider = provider || new JsonRpcProvider(rpcUrl);
      const registry = new Contract(registryAddress, CONTENT_REGISTRY_ABI, readProvider);

      try {
        const count = Number(await registry.articleCounter());
        if (count > 0) {
          const raw = await registry.articles(count);
          let hasPurchased = false;
          if (account) {
            hasPurchased = await registry.hasPurchased(count, account);
          }
          setLatestArticle({
            id: count,
            title: raw.title,
            author: raw.author,
            priceUsdCents: Number(raw.priceUsdCents),
            category: raw.category || 'General',
            isPurchased: Boolean(hasPurchased || (account && raw.author.toLowerCase() === account.toLowerCase())),
          });
          return;
        }
      } catch (e) {
        console.warn('Could not read latest from contract:', e);
      }

      // Fallback demo article
      setLatestArticle({
        id: 1,
        title: 'Autonomous DePIN Nodes & Agent OS on BOT Chain',
        author: '0x518F3fC641dFC01c48343251f67f0Dd0b349deeb',
        priceUsdCents: 150,
        category: 'DePIN & AI',
        isPurchased: false,
      });
    } catch (err) {
      console.error('Fetch latest error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatest();
  }, [account, activeChainId]);

  const handleInstantBuy = async () => {
    if (!isConnected) {
      await connect();
      return;
    }
    if (!isCorrectNetwork) {
      await switchToBohrTestnet();
      return;
    }
    if (!provider || !latestArticle) return;

    try {
      setBuying(true);
      setErrorMsg(null);
      setTxHash(null);

      const signer = await provider.getSigner();
      const registry = new Contract(registryAddress, CONTENT_REGISTRY_ABI, signer);

      const requiredWei = await registry.calculateBotAmount(latestArticle.priceUsdCents);
      const tx = await registry.purchaseWithBOT(latestArticle.id, { value: requiredWei });
      setTxHash(tx.hash);

      await tx.wait();
      setLatestArticle({ ...latestArticle, isPurchased: true });
      await refreshBalance();
    } catch (err: any) {
      console.error('Test buy failed:', err);
      setErrorMsg(err.reason || err.message || 'Transaction failed');
    } finally {
      setBuying(false);
    }
  };

  return (
    <GradientBackground>
      <Navigation />

      <main className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 mb-3">
              <span>💳</span>
              <span>Testnet Payment Terminal</span>
            </div>
            <h1 className="text-4xl font-black text-white">Testnet Purchase Lab</h1>
            <p className="text-sm text-gray-400 mt-2">
              Execute test purchases on Bohr Testnet. Evaluates required BOT calculation, 3% fee split, and instant content unlocking.
            </p>
          </div>

          <div className="p-8 bg-[#0F172A]/70 backdrop-blur-xl border border-white/10 rounded-3xl space-y-6">
            {loading ? (
              <div className="h-40 rounded-2xl bg-white/5 animate-pulse"></div>
            ) : !latestArticle ? (
              <div className="text-center py-8 text-gray-400 text-sm">No articles available to test buy.</div>
            ) : (
              <div className="p-6 bg-black/40 border border-white/10 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400">Target Article #{latestArticle.id}</span>
                  <span className="text-sm font-black text-white">{formatUsd(latestArticle.priceUsdCents)}</span>
                </div>
                <h3 className="text-lg font-bold text-white">{latestArticle.title}</h3>
                <div className="text-xs text-gray-400">
                  Author: <span className="font-mono text-gray-300">{formatAddress(latestArticle.author)}</span>
                </div>

                <div className="pt-2">
                  {latestArticle.isPurchased ? (
                    <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-bold flex items-center justify-between">
                      <span>✓ Already Unlocked</span>
                      <Link href={`/article/${latestArticle.id}`} className="underline text-white">
                        Read Now →
                      </Link>
                    </div>
                  ) : (
                    <button
                      onClick={handleInstantBuy}
                      disabled={buying}
                      className="w-full py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-lg shadow-cyan-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {buying ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                          </svg>
                          <span>Confirming on Bohr Testnet (~0.75s)...</span>
                        </>
                      ) : (
                        <>
                          <span>⚡</span>
                          <span>Test Buy with tBOT ({formatUsd(latestArticle.priceUsdCents)})</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300 text-xs">
                {errorMsg}
              </div>
            )}

            {txHash && (
              <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs space-y-1">
                <div className="font-bold">✅ Purchase Confirmed on BOT Chain!</div>
                <div className="text-gray-400">
                  Transaction Hash:{' '}
                  <a
                    href={`https://scan.bohr.life/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-300 underline font-mono break-all"
                  >
                    {txHash}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </GradientBackground>
  );
}
