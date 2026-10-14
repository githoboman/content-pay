'use client';

import React, { useState } from 'react';
import { Contract } from 'ethers';
import { useWallet } from '../context/WalletContext';
import { CONTENT_REGISTRY_ABI } from '../lib/abi';
import { CONTRACT_ADDRESSES, DEFAULT_CHAIN_ID } from '../lib/botchain';

export default function PublishArticle({ onArticlePublished }: { onArticlePublished?: () => void }) {
  const { account, chainId, provider, isConnected, connect, switchToBohrTestnet, isCorrectNetwork } = useWallet();

  const [title, setTitle] = useState('');
  const [contentUri, setContentUri] = useState('');
  const [priceUsd, setPriceUsd] = useState('1.50');
  const [category, setCategory] = useState('AI Native');
  const [isPublishing, setIsPublishing] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeChainId = chainId && (chainId === 968 || chainId === 677) ? chainId : DEFAULT_CHAIN_ID;
  const registryAddress = CONTRACT_ADDRESSES[activeChainId]?.contentRegistry;

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setTxHash(null);

    if (!isConnected) {
      await connect();
      return;
    }

    if (!isCorrectNetwork) {
      await switchToBohrTestnet();
      return;
    }

    if (!provider) {
      setErrorMsg('EVM Provider not available. Please refresh or reconnect wallet.');
      return;
    }

    try {
      setIsPublishing(true);
      const signer = await provider.getSigner();
      const registryContract = new Contract(registryAddress, CONTENT_REGISTRY_ABI, signer);

      const priceCents = Math.round(parseFloat(priceUsd) * 100);
      const uri = contentUri.trim() || `ipfs://bafybeicontent${Date.now()}`;

      // Call publishArticle on ContentRegistry
      const tx = await registryContract.publishArticle(
        title.trim(),
        uri,
        priceCents,
        category
      );

      setTxHash(tx.hash);

      // Wait for 1 confirmation on BOT Chain (~0.75s block time)
      await tx.wait();

      // Reset form
      setTitle('');
      setContentUri('');
      setPriceUsd('1.50');
      if (onArticlePublished) onArticlePublished();
    } catch (err: any) {
      console.error('Publishing failed:', err);
      setErrorMsg(err.reason || err.message || 'Transaction failed. Check console for details.');
    } finally {
      setIsPublishing(false);
    }
  };

  const fillAiTemplate = () => {
    const templates = [
      {
        title: 'DePIN Networks and Autonomous Agent Economies on BOT Chain',
        uri: 'ipfs://bafybeig7depinbotchaineconomy2026',
        price: '2.00',
        cat: 'DePIN & AI',
      },
      {
        title: 'ERC-8004 Agent OS: Self-Sovereign Identity for AI Bots',
        uri: 'ipfs://bafybeihagentoserc8004identitymodel',
        price: '1.25',
        cat: 'AI Native',
      },
      {
        title: 'Sub-Second DeFi & Micropayments at $0.06 Gas Costs',
        uri: 'ipfs://bafybeimicropaymentsfastblocks2026',
        price: '0.99',
        cat: 'DeFi',
      },
    ];
    const picked = templates[Math.floor(Math.random() * templates.length)];
    setTitle(picked.title);
    setContentUri(picked.uri);
    setPriceUsd(picked.price);
    setCategory(picked.cat);
  };

  return (
    <div className="w-full max-w-xl mx-auto p-7 bg-[#0F172A]/70 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden">
      {/* Decorative gradient glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-cyan-500/20 to-fuchsia-500/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-indigo-200 to-fuchsia-300">
            Publish to BOT Chain
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Decentralized content registry with instant 0.75s settlement
          </p>
        </div>

        <button
          type="button"
          onClick={fillAiTemplate}
          className="px-2.5 py-1 text-xs font-semibold text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/30 rounded-lg transition-all flex items-center gap-1 shadow-sm"
          title="Autofill a sample AI/DePIN article"
        >
          <span>✨</span>
          <span>Sample Idea</span>
        </button>
      </div>

      <form onSubmit={handlePublish} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
            Article Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Decentralized Storage on BOT Chain Blob API"
            required
            className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-white placeholder-gray-500 text-sm outline-none transition-all"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              Price (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-gray-400 text-sm">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={priceUsd}
                onChange={(e) => setPriceUsd(e.target.value)}
                required
                className="w-full pl-8 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-white text-sm outline-none transition-all"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Settles in tBOT or USDC</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-white text-sm outline-none transition-all"
            >
              <option value="AI Native">AI Native</option>
              <option value="DePIN & AI">DePIN & AI</option>
              <option value="DeFi">DeFi</option>
              <option value="Technology">Technology</option>
              <option value="Research">Research</option>
              <option value="General">General</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
            Content URI / Hash (Optional)
          </label>
          <input
            type="text"
            value={contentUri}
            onChange={(e) => setContentUri(e.target.value)}
            placeholder="ipfs://bafy... or leave blank for auto-generated pointer"
            className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-white placeholder-gray-500 text-sm outline-none transition-all"
          />
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300 text-xs">
            {errorMsg}
          </div>
        )}

        {txHash && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex flex-col gap-1">
            <span className="font-semibold">✅ Published on BOT Chain!</span>
            <a
              href={`https://scan.bohr.life/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-cyan-300 hover:text-cyan-200 break-all text-[11px]"
            >
              View on Explorer: {txHash}
            </a>
          </div>
        )}

        <button
          type="submit"
          disabled={isPublishing}
          className="w-full mt-2 py-3 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-600 hover:from-cyan-400 hover:via-indigo-500 hover:to-fuchsia-500 shadow-lg shadow-indigo-500/25 transition-all transform active:scale-98 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
        >
          {isPublishing ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>Publishing on-chain (~0.75s)...</span>
            </>
          ) : (
            <>
              <span>✍️</span>
              <span>Publish Article</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
