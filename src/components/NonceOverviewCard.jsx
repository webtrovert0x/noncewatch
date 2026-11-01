import React from 'react';
import { Layers, Clock, Coins, CheckCircle2, AlertOctagon, HelpCircle, ArrowRight, Shield } from 'lucide-react';
import { BOTCHAIN_TESTNET_CONFIG } from '../services/botChainService';

export default function NonceOverviewCard({ accountData, diagnosticResult }) {
  if (!accountData) return null;

  const {
    address,
    latestNonce,
    pendingNonce,
    balance,
    isContract,
    currentBlock,
    baseFeePerGas,
    isLiveRpc,
  } = accountData;

  const delta = Math.max(0, pendingNonce - latestNonce);
  const isHealthy = delta === 0 && (!diagnosticResult || diagnosticResult.missingNonces.length === 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      
      {/* Top Banner with Address & BOT Chain Status */}
      <div className="px-6 py-4 bg-navy-900 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-navy-800 text-blue-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase tracking-wider text-slate-300 font-semibold">Inspected Target</span>
              <span className="px-2 py-0.2 text-[10px] bg-blue-900 text-blue-200 border border-blue-700 rounded-full font-medium">
                {isContract ? 'Smart Contract' : 'EOA Account'}
              </span>
            </div>
            <div className="font-mono text-sm sm:text-base font-bold text-white tracking-wide">
              {address}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-xs font-mono text-slate-300">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">BOT Chain Block</span>
            <span className="font-bold text-white">{currentBlock ? `#${currentBlock}` : 'Synced'}</span>
          </div>
          <div className="border-l border-slate-700 pl-4">
            <span className="text-slate-400 block text-[10px] uppercase">Base Fee</span>
            <span className="font-bold text-blue-300">{baseFeePerGas} Gwei</span>
          </div>
          <div className="border-l border-slate-700 pl-4">
            <span className="text-slate-400 block text-[10px] uppercase">RPC Source</span>
            <span className={`font-bold ${isLiveRpc ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isLiveRpc ? 'Live RPC (968)' : 'Diagnostic Lab'}
            </span>
          </div>
        </div>
      </div>

      {/* Main 4 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 p-6 gap-4 md:gap-0">
        
        {/* Confirmed Nonce */}
        <div className="md:px-4 first:pl-0 space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Confirmed Nonce</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">eth_latest</span>
          </div>
          <div className="text-3xl font-black text-navy-900 font-mono">
            {latestNonce}
          </div>
          <p className="text-[11px] text-slate-500">
            Total transactions mined and confirmed on BOT Chain Testnet.
          </p>
        </div>

        {/* Pending Nonce */}
        <div className="md:px-4 space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span className="flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Pending Nonce</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">eth_pending</span>
          </div>
          <div className="text-3xl font-black text-blue-800 font-mono">
            {pendingNonce}
          </div>
          <p className="text-[11px] text-slate-500">
            Expected next nonce including unconfirmed mempool transactions.
          </p>
        </div>

        {/* Pending Delta / Backlog */}
        <div className="md:px-4 space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span className="flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-navy-700" />
              <span>Pending Backlog</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">Delta</span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className={`text-3xl font-black font-mono ${delta > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {delta}
            </span>
            <span className="text-xs font-semibold text-slate-500">tx queued</span>
          </div>
          <p className="text-[11px] text-slate-500">
            {delta === 0
              ? 'No pending transactions in mempool backlog.'
              : `${delta} transaction(s) queued awaiting block mining.`}
          </p>
        </div>

        {/* Native BOT Token Balance */}
        <div className="md:px-4 last:pr-0 space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span className="flex items-center space-x-1.5">
              <Coins className="w-4 h-4 text-amber-600" />
              <span>BOT Balance</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">BOT Testnet</span>
          </div>
          <div className="text-3xl font-black text-navy-900 font-mono truncate">
            {balance} <span className="text-sm font-semibold text-slate-500">BOT</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Gas currency available for submitting transactions.
          </p>
        </div>

      </div>

      {/* Sync Health Ribbon */}
      <div className={`px-6 py-2.5 border-t text-xs font-semibold flex items-center justify-between ${
        isHealthy
          ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
          : 'bg-amber-50 border-amber-100 text-amber-900'
      }`}>
        <div className="flex items-center space-x-2">
          {isHealthy ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Nonce Sequencing State: Synchronized (No Pending Backlog or Gaps)</span>
            </>
          ) : (
            <>
              <AlertOctagon className="w-4 h-4 text-amber-600" />
              <span>Nonce Sequencing State: Action Required (Delta = {delta} tx, inspect pipeline below)</span>
            </>
          )}
        </div>
        <div className="text-[11px] font-mono opacity-80 hidden sm:block">
          Network: BOT Chain (ID: 968)
        </div>
      </div>

    </div>
  );
}

