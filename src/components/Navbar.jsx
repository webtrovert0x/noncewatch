import React from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { ShieldCheck, Activity, Database, AlertCircle, ExternalLink, Zap } from 'lucide-react';
import { BOTCHAIN_TESTNET_CONFIG } from '../services/botChainService';

export default function Navbar({ registryAddress, onOpenContractModal }) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const isCorrectChain = chainId === BOTCHAIN_TESTNET_CONFIG.chainId;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-navy-900 flex items-center justify-center text-white shadow-md shadow-navy-900/20">
              <Activity className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-navy-900">
                  Nonce<span className="text-blue-700">Watch</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-800 border border-blue-200 rounded-full">
                  BOT Chain Testnet
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Wallet Nonce Inspector & Sequencing Diagnoser
              </p>
            </div>
          </div>

          {/* Network Badges & Policy */}
          <div className="hidden md:flex items-center space-x-3">
            
            {/* Strict Gas Fee Only Indicator */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium">
              <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
              <span>Gas Fee Only</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-slate-200 text-slate-800 rounded font-mono">0 BOT Fee</span>
            </div>

            {/* BOT Chain Testnet Status */}
            <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-navy-50 border border-navy-200 text-navy-900 text-xs font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Testnet 968</span>
              <a
                href={BOTCHAIN_TESTNET_CONFIG.blockExplorerUrl}
                target="_blank"
                rel="noreferrer"
                className="text-slate-400 hover:text-navy-900 ml-1"
                title="View BOT Chain Explorer"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Contract Registry Status Button */}
            <button
              onClick={onOpenContractModal}
              className={`flex items-center space-x-1.5 px-3 py-1 text-xs font-medium rounded-lg border transition ${
                registryAddress
                  ? 'bg-blue-50 border-blue-200 text-blue-900 hover:bg-blue-100'
                  : 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-blue-600" />
              <span>
                {registryAddress
                  ? `Registry: ${registryAddress.slice(0, 6)}...${registryAddress.slice(-4)}`
                  : 'Set Registry Contract'}
              </span>
            </button>
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-3">
            {isConnected && !isCorrectChain && (
              <button
                onClick={() => switchChain?.({ chainId: BOTCHAIN_TESTNET_CONFIG.chainId })}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm animate-pulse"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Switch to BOT Testnet</span>
              </button>
            )}

            {/* Reown AppKit Web Component Button */}
            <appkit-button balance="show" size="sm" />
          </div>

        </div>
      </div>
    </header>
  );
}

