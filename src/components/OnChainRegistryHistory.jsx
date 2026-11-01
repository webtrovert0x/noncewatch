import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { Database, Filter, ExternalLink, CheckCircle2, AlertTriangle, Clock, RefreshCw, User, ShieldCheck, Zap } from 'lucide-react';
import { ethers } from 'ethers';
import NonceWatchRegistryAbi from '../contracts/NonceWatchRegistry.json';
import { BOTCHAIN_TESTNET_CONFIG } from '../services/botChainService';

export default function OnChainRegistryHistory({
  registryAddress,
  onSelectAddress,
  refreshTrigger,
}) {
  const { address: connectedUser } = useAccount();
  const [filterType, setFilterType] = useState('all'); // 'all', 'mine', 'anomalies'
  const [investigations, setInvestigations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resolvingId, setResolvingId] = useState(null);

  // Fetch real investigations from deployed contract via BOT Chain Testnet RPC
  const fetchInvestigations = async () => {
    if (!registryAddress || !ethers.isAddress(registryAddress)) {
      setInvestigations([]);
      return;
    }

    try {
      setLoading(true);
      const provider = new ethers.JsonRpcProvider(BOTCHAIN_TESTNET_CONFIG.rpcUrl);
      const contract = new ethers.Contract(registryAddress, NonceWatchRegistryAbi.abi, provider);

      const totalBn = await contract.totalInvestigations();
      const total = Number(totalBn);

      if (total === 0) {
        setInvestigations([]);
        return;
      }

      // Fetch the last 20 real investigations directly from contract storage
      const count = Math.min(20, total);
      const rawList = await contract.getRecentInvestigations(count, 0);

      const formatted = rawList.map((item) => ({
        id: Number(item.id),
        targetWallet: item.targetWallet,
        inspector: item.inspector,
        latestNonce: Number(item.latestNonce),
        pendingNonce: Number(item.pendingNonce),
        statusFlag: Number(item.statusFlag),
        diagnosisCode: item.diagnosisCode,
        developerNote: item.developerNote,
        timestamp: Number(item.timestamp),
        blockNumber: Number(item.blockNumber),
        resolved: item.resolved,
      }));

      setInvestigations(formatted);
    } catch (err) {
      console.warn('Notice fetching investigations from contract:', err.message);
      setInvestigations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestigations();
  }, [registryAddress, refreshTrigger]);

  const { writeContractAsync } = useWriteContract();

  // Mark investigation as resolved on-chain (Gas Fee Only!)
  const handleResolve = async (id) => {
    if (!registryAddress) return;
    try {
      setResolvingId(id);
      await writeContractAsync({
        address: registryAddress,
        abi: NonceWatchRegistryAbi.abi,
        functionName: 'updateInvestigationStatus',
        args: [BigInt(id), true, 'Resolved via NonceWatch Diagnostic Action'],
      });
      fetchInvestigations();
    } catch (err) {
      console.error('Resolution error:', err);
      alert(err.message || 'Error updating status');
    } finally {
      setResolvingId(null);
    }
  };

  // Filter investigations
  const filteredList = investigations.filter((inv) => {
    if (filterType === 'mine') {
      return connectedUser && inv.inspector.toLowerCase() === connectedUser.toLowerCase();
    }
    if (filterType === 'anomalies') {
      return inv.statusFlag !== 0; // Not HEALTHY
    }
    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-navy-900" />
            <h2 className="text-base font-bold text-navy-900">
              On-Chain Nonce Investigation Audit Trail
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-navy-900 text-white">
              NonceWatchRegistry.sol
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Permanent ledger of recorded nonce checks and sequencing anomalies on BOT Chain Testnet.
          </p>
        </div>

        {/* Filter and Refresh Buttons */}
        <div className="flex items-center space-x-2">
          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg transition ${
                filterType === 'all' ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-500 hover:text-navy-900'
              }`}
            >
              All ({investigations.length})
            </button>
            <button
              onClick={() => setFilterType('anomalies')}
              className={`px-3 py-1 rounded-lg transition ${
                filterType === 'anomalies' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-500 hover:text-navy-900'
              }`}
            >
              Anomalies
            </button>
            {connectedUser && (
              <button
                onClick={() => setFilterType('mine')}
                className={`px-3 py-1 rounded-lg transition ${
                  filterType === 'mine' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-navy-900'
                }`}
              >
                My Records
              </button>
            )}
          </div>

          <button
            onClick={fetchInvestigations}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-navy-900 rounded-lg hover:bg-slate-100 transition"
            title="Refresh on-chain history"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Contract Status Banner */}
      {registryAddress && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between">
          <span className="font-mono">
            Connected Registry: {registryAddress}
          </span>
          <a
            href={`${BOTCHAIN_TESTNET_CONFIG.blockExplorerUrl}/address/${registryAddress}`}
            target="_blank"
            rel="noreferrer"
            className="text-blue-700 hover:underline flex items-center space-x-1 font-bold"
          >
            <span>View Contract on BOTScan</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Investigation List */}
      {filteredList.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs space-y-1">
          <Database className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="font-bold text-slate-600">No On-Chain Investigations Recorded Yet</p>
          <p>Click "Inspect Nonce (Gas Fee)" above to record the first inspection on NonceWatchRegistry.sol.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredList.map((item) => {
            let statusBadge = (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                HEALTHY
              </span>
            );

            if (item.statusFlag === 1) {
              statusBadge = (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800">
                  BACKLOG QUEUE
                </span>
              );
            } else if (item.statusFlag === 2) {
              statusBadge = (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 text-rose-800">
                  NONCE GAP
                </span>
              );
            } else if (item.statusFlag === 3) {
              statusBadge = (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800">
                  COLLISION
                </span>
              );
            }

            const timeString = new Date(item.timestamp * 1000).toLocaleString();

            return (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition space-y-2.5 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs text-navy-900">
                      Audit #{item.id}
                    </span>
                    {statusBadge}
                    <span className="text-[11px] font-mono text-slate-500 font-bold bg-slate-100 px-2 py-0.2 rounded">
                      {item.diagnosisCode}
                    </span>
                    {item.resolved && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Resolved</span>
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono">
                    {timeString} • Block #{item.blockNumber}
                  </span>
                </div>

                {/* Target & Inspector Lookups */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 bg-slate-50 rounded-lg flex items-center justify-between">
                    <span className="text-slate-400 text-[10px] uppercase">Target Wallet:</span>
                    <button
                      onClick={() => onSelectAddress(item.targetWallet)}
                      className="font-bold text-blue-700 hover:text-blue-900 hover:underline truncate ml-2"
                      title="Inspect this account"
                    >
                      {item.targetWallet}
                    </button>
                  </div>

                  <div className="p-2 bg-slate-50 rounded-lg flex items-center justify-between">
                    <span className="text-slate-400 text-[10px] uppercase">Inspector:</span>
                    <a
                      href={`${BOTCHAIN_TESTNET_CONFIG.blockExplorerUrl}/address/${item.inspector}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-700 hover:text-navy-900 flex items-center space-x-1 truncate ml-2"
                    >
                      <span className="truncate">{item.inspector}</span>
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  </div>
                </div>

                {/* Nonce Counts */}
                <div className="flex items-center space-x-4 text-xs font-mono pt-1 text-slate-700">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase mr-1">Confirmed:</span>
                    <span className="font-bold text-navy-900">{item.latestNonce}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase mr-1">Pending:</span>
                    <span className="font-bold text-blue-800">{item.pendingNonce}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase mr-1">Queue Delta:</span>
                    <span className="font-bold text-amber-700">{Math.max(0, item.pendingNonce - item.latestNonce)}</span>
                  </div>
                </div>

                {/* Developer Note & Action */}
                <div className="p-2.5 rounded-lg bg-slate-50 text-xs text-slate-700 font-mono flex items-center justify-between">
                  <span className="truncate pr-2">Note: {item.developerNote}</span>
                  {registryAddress && !item.resolved && (
                    <button
                      onClick={() => handleResolve(item.id)}
                      disabled={resolvingId === item.id}
                      className="flex-shrink-0 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded transition"
                      title="Mark as resolved on-chain (Gas Fee Only)"
                    >
                      {resolvingId === item.id ? 'Updating...' : 'Mark Resolved'}
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Gas Fee Only Note */}
      <div className="text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
        <span className="flex items-center space-x-1">
          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span>Interactions with NonceWatchRegistry execute by <strong>Gas Fee Only</strong> (Zero protocol fees).</span>
        </span>
        <span className="font-mono text-slate-400">BOT Chain Testnet (968)</span>
      </div>

    </div>
  );
}
