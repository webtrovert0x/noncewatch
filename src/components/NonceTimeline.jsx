import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, Clock, ArrowRight, Layers, Flame, ExternalLink, Wrench } from 'lucide-react';
import { BOTCHAIN_TESTNET_CONFIG } from '../services/botChainService';

export default function NonceTimeline({ txSequence = [], onTriggerFixGap }) {
  const [selectedTx, setSelectedTx] = useState(null);

  if (!txSequence || txSequence.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
        <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-navy-900">No Transaction Pipeline Recorded</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          This account has not broadcasted transactions yet or is freshly created on BOT Chain Testnet.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-navy-900 flex items-center space-x-2">
            <Layers className="w-4 h-4 text-blue-700" />
            <span>Interactive Nonce Pipeline & Sequencing Stream</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time chronological timeline of confirmed, pending, missing (gap), and colliding nonces.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center space-x-1.5 text-navy-900 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-navy-900"></span>
            <span>Confirmed</span>
          </div>
          <div className="flex items-center space-x-1.5 text-blue-700 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <span>Pending</span>
          </div>
          <div className="flex items-center space-x-1.5 text-rose-600 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
            <span>Nonce Gap</span>
          </div>
          <div className="flex items-center space-x-1.5 text-amber-600 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>Collision</span>
          </div>
        </div>
      </div>

      {/* Visual Pipeline Track */}
      <div className="relative py-4 overflow-x-auto">
        <div className="flex items-center space-x-3 min-w-max pb-2">
          {txSequence.map((tx, idx) => {
            const isLast = idx === txSequence.length - 1;
            const isSelected = selectedTx?.nonce === tx.nonce;

            let nodeClass = 'border-navy-900 bg-white text-navy-900';
            let badgeBg = 'bg-navy-900 text-white';
            let statusLabel = 'Confirmed';
            let icon = <CheckCircle2 className="w-4 h-4 text-white" />;

            if (tx.status === 'gap') {
              nodeClass = 'border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-400 ring-offset-2 animate-pulse';
              badgeBg = 'bg-rose-600 text-white';
              statusLabel = 'CRITICAL GAP';
              icon = <AlertTriangle className="w-4 h-4 text-white" />;
            } else if (tx.status === 'pending') {
              nodeClass = 'border-blue-500 bg-blue-50 text-blue-900';
              badgeBg = 'bg-blue-600 text-white';
              statusLabel = 'Pending';
              icon = <Clock className="w-4 h-4 text-white" />;
            } else if (tx.status === 'replacement_conflict') {
              nodeClass = 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-300';
              badgeBg = 'bg-amber-600 text-white';
              statusLabel = 'Collision';
              icon = <Flame className="w-4 h-4 text-white" />;
            }

            return (
              <React.Fragment key={tx.nonce}>
                <div
                  onClick={() => setSelectedTx(tx)}
                  className={`cursor-pointer group flex flex-col items-center p-3.5 rounded-xl border-2 transition transform hover:-translate-y-1 shadow-sm w-44 ${nodeClass} ${
                    isSelected ? 'ring-2 ring-navy-900 ring-offset-2' : ''
                  }`}
                >
                  {/* Nonce Header Badge */}
                  <div className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold flex items-center space-x-1 ${badgeBg}`}>
                    {icon}
                    <span>Nonce #{tx.nonce}</span>
                  </div>

                  {/* Status & Label */}
                  <div className="mt-2 text-center w-full">
                    <span className="block text-xs font-extrabold uppercase tracking-wider">
                      {statusLabel}
                    </span>
                    <span className="block text-[11px] text-slate-500 truncate mt-0.5">
                      {tx.type}
                    </span>
                  </div>

                  {/* Gas & Hash Details */}
                  <div className="mt-2 pt-2 border-t border-slate-200/60 w-full text-[10px] font-mono flex items-center justify-between text-slate-500">
                    <span>{tx.gasPriceGwei ? `${tx.gasPriceGwei} Gwei` : '—'}</span>
                    <span className="truncate ml-1">{tx.hash ? tx.hash.slice(0, 8) + '...' : 'Missing'}</span>
                  </div>

                  {/* Action button if gap */}
                  {tx.status === 'gap' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTriggerFixGap(tx.nonce);
                      }}
                      className="mt-2.5 w-full py-1 text-[11px] font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg flex items-center justify-center space-x-1 shadow-sm"
                    >
                      <Wrench className="w-3 h-3" />
                      <span>Fill Gap #{tx.nonce}</span>
                    </button>
                  )}
                </div>

                {!isLast && (
                  <div className="flex items-center text-slate-300">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Selected Nonce Inspector Panel */}
      {selectedTx && (
        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 transition">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-sm text-navy-900">
                  Transaction Details: Nonce #{selectedTx.nonce}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-navy-900 text-white">
                  {selectedTx.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {selectedTx.status === 'gap'
                  ? 'This nonce is missing in the execution chain. EVM nodes will reject or indefinitely stall later transactions.'
                  : selectedTx.status === 'replacement_conflict'
                  ? 'Two transactions were submitted with this exact nonce. Check gas prices to determine which one wins.'
                  : `Type: ${selectedTx.type} • Status: ${selectedTx.status}`}
              </p>
            </div>
            <button
              onClick={() => setSelectedTx(null)}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕ Close
            </button>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase">Transaction Hash</span>
              <span className="font-bold text-navy-900 break-all">
                {selectedTx.hash || 'None (Unsubmitted Transaction Gap)'}
              </span>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase">Gas Price</span>
              <span className="font-bold text-navy-900">
                {selectedTx.gasPriceGwei ? `${selectedTx.gasPriceGwei} Gwei` : 'N/A'}
              </span>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase">Recipient / Target</span>
              <span className="font-bold text-navy-900 truncate block">
                {selectedTx.recipient || 'N/A'}
              </span>
            </div>
          </div>

          {selectedTx.competingTx && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs">
              <span className="font-bold text-amber-900 block">Competing Transaction Detected:</span>
              <div className="font-mono mt-1 text-slate-700">
                Hash: {selectedTx.competingTx.hash} | Gas: {selectedTx.competingTx.gasPriceGwei} Gwei ({selectedTx.competingTx.type})
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

