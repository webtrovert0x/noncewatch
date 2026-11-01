import React, { useState } from 'react';
import { Search, RefreshCw, User, Copy, Check, Zap, ExternalLink, Database } from 'lucide-react';
import { BOTCHAIN_TESTNET_CONFIG } from '../services/botChainService';

export default function AccountSearchBar({
  targetAddress,
  onAddressChange,
  onInspect,
  loading,
  connectedAddress,
  isConnected,
  lastInspectTxHash,
  registryAddress,
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!targetAddress) return;
    navigator.clipboard.writeText(targetAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
      {/* Search Input Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
            <span>Target Wallet Address on BOT Chain Testnet</span>
          </label>
          <span className="flex items-center space-x-1 text-[11px] font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
            <Zap className="w-3 h-3 text-amber-600 fill-amber-500" />
            <span>Inspection Requires Gas Fee Only</span>
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={targetAddress}
              onChange={(e) => onAddressChange(e.target.value.trim())}
              placeholder="Paste any 0x... wallet or contract address to inspect on BOT Chain"
              className="w-full pl-11 pr-20 py-3 bg-slate-50 border border-slate-300 rounded-xl text-navy-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-navy-900 focus:bg-white transition"
              onKeyDown={(e) => e.key === 'Enter' && onInspect(targetAddress)}
            />
            {targetAddress && (
              <button
                type="button"
                onClick={handleCopy}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-navy-900 transition text-xs font-mono"
                title="Copy address"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
          </div>

          <button
            onClick={() => onInspect(targetAddress)}
            disabled={loading || !targetAddress}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-navy-900 hover:bg-navy-800 disabled:bg-slate-300 text-white font-bold text-sm rounded-xl shadow-md transition active:scale-98"
            title="Records inspection request on-chain (Gas Fee Only)"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                <span>Confirming in Wallet...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>Inspect Nonce (Gas Fee)</span>
              </>
            )}
          </button>
        </div>

        <div className="flex items-center justify-between mt-1.5 text-[11px] text-slate-500">
          <span>
            Every inspection request executes an on-chain transaction to <strong>NonceWatchRegistry.sol</strong> (0 BOT fee, standard gas only).
          </span>
          <span className="font-mono text-slate-400 hidden md:inline">Chain ID: 968</span>
        </div>
      </div>

      {/* Quick Autofill Buttons */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-500">Quick Select:</span>
        {connectedAddress && (
          <button
            type="button"
            onClick={() => {
              onAddressChange(connectedAddress);
              onInspect(connectedAddress);
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 hover:bg-blue-100 text-xs font-semibold transition"
          >
            <User className="w-3.5 h-3.5 text-blue-700" />
            <span>My Connected Wallet ({connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)})</span>
          </button>
        )}
        {registryAddress && (
          <button
            type="button"
            onClick={() => {
              onAddressChange(registryAddress);
              onInspect(registryAddress);
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition"
          >
            <Database className="w-3.5 h-3.5 text-slate-600" />
            <span>Deployed NonceWatch Contract ({registryAddress.slice(0, 6)}...{registryAddress.slice(-4)})</span>
          </button>
        )}
      </div>

      {/* Last Transaction Confirmation Pill */}
      {lastInspectTxHash && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center space-x-2 text-emerald-900 font-medium">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Inspection request recorded on-chain via Gas Fee:</span>
            <span className="font-mono font-bold">{lastInspectTxHash.slice(0, 10)}...{lastInspectTxHash.slice(-8)}</span>
          </div>
          <a
            href={`${BOTCHAIN_TESTNET_CONFIG.blockExplorerUrl}/tx/${lastInspectTxHash}`}
            target="_blank"
            rel="noreferrer"
            className="text-emerald-700 hover:text-emerald-900 underline font-bold flex items-center space-x-1"
          >
            <span>View on BOTScan</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
}
