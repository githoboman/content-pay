'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ConnectWallet from './ConnectWallet';
import { useWallet } from '../context/WalletContext';

export default function Navigation() {
  const pathname = usePathname();
  const { chainId, isConnected } = useWallet();

  const isActive = (path: string) => pathname === path;

  const navLinks = [
    { href: '/', label: 'Home', icon: '⚡' },
    { href: '/browse', label: 'Explore', icon: '📚' },
    { href: '/publish', label: 'Publish', icon: '✍️' },
    { href: '/my-library', label: 'My Library', icon: '📖' },
    { href: '/test-publish', label: 'Testnet Lab', icon: '🧪' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0B0F19]/80 backdrop-blur-xl border-b border-indigo-500/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-fuchsia-500 p-[1.5px] shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-[#0B0F19] rounded-[10px] flex items-center justify-center">
                  <span className="text-xl">🤖</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-300 via-indigo-200 to-fuchsia-300 bg-clip-text text-transparent">
                  ContentPay
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400">
                  BOT Chain L1
                </span>
              </div>
            </Link>

            {/* Network indicator pill */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-950/40 text-cyan-300 border border-cyan-500/30">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>{chainId === 677 ? 'BOT Mainnet (677)' : 'Bohr Testnet (968)'}</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive(link.href)
                    ? 'bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="mr-1.5">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Actions & Wallet */}
          <div className="flex items-center gap-2.5">
            {/* Quick Faucet Link */}
            <a
              href="https://faucet.botchain.ai/basic"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-cyan-300 bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/30 transition-colors"
            >
              <span>💧 Faucet</span>
            </a>

            {/* Block Explorer Link */}
            <a
              href="https://scan.bohr.life"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            >
              <span>🔍 Explorer</span>
            </a>

            <ConnectWallet />
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-3 pt-1 flex items-center space-x-1 overflow-x-auto">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                isActive(link.href)
                  ? 'bg-indigo-600/40 text-cyan-200 border border-cyan-500/40'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="mr-1">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
