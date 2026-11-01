import React, { useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { FileCheck2, ShieldAlert, Zap, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';
import NonceWatchRegistryAbi from '../contracts/NonceWatchRegistry.json';
import { BOTCHAIN_TESTNET_CONFIG } from '../services/botChainService';

export default function RecordInvestigationModal({
  isOpen,
  onClose,
  registryAddress,
  accountData,
  diagnosticResult,
  mode = 'record', // 'record' or 'flag'
  onSuccess,
}) {
  const { isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [developerNote, setDeveloperNote] = useState(
    diagnosticResult?.summary || 'Nonce sequence verified on BOT Chain Testnet.'
  );
  const [submitting, setSubmitting] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen) return null;

  const handleExecute = async () => {
    if (!registryAddress) {
      alert('Please set or deploy the NonceWatchRegistry contract first.');
      return;
    }

    if (!isConnected) {
      alert('Please connect your wallet on BOT Chain Testnet.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);
      setTxHash(null);

      let hash;

      if (mode === 'flag') {
        const missingNonce = diagnosticResult?.missingNonces?.[0] || 0;
        hash = await writeContractAsync({
          address: registryAddress,
          abi: NonceWatchRegistryAbi.abi,
          functionName: 'flagSequencingAnomaly',
          args: [
            accountData.address,
            BigInt(missingNonce),
            diagnosticResult.primaryStatus,
            developerNote,
          ],
        });
      } else {
        hash = await writeContractAsync({
          address: registryAddress,
          abi: NonceWatchRegistryAbi.abi,
          functionName: 'recordInvestigation',
          args: [
            accountData.address,
            BigInt(accountData.latestNonce),
            BigInt(accountData.pendingNonce),
            diagnosticResult.primaryStatus,
            diagnosticResult.diagnosisCode,
            developerNote,
          ],
        });
      }

      setTxHash(hash);
      onSuccess?.();
    } catch (err) {
      console.error('Record on-chain error:', err);
      setErrorMsg(err.message || 'Transaction submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            {mode === 'flag' ? (
              <ShieldAlert className="w-5 h-5 text-amber-600" />
            ) : (
              <FileCheck2 className="w-5 h-5 text-blue-700" />
            )}
            <h3 className="text-base font-bold text-navy-900">
              {mode === 'flag' ? 'Flag Sequencing Anomaly on BOT Chain' : 'Record Investigation on BOT Chain'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-sm">
            ✕
          </button>
        </div>

        {/* Gas Fee Only Banner */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-start space-x-2.5">
          <Zap className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-navy-900 block">Strict Gas Fee Only Interaction</span>
            <p className="text-slate-600 leading-relaxed">
              This on-chain record modifies contract state on BOT Chain Testnet. It requires <strong>gas fee only</strong> (0 BOT protocol fee).
            </p>
          </div>
        </div>

        {/* Snapshot Summary */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-400 uppercase">Target Wallet:</span>
            <span className="font-bold text-navy-900 truncate ml-2">{accountData?.address}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 uppercase">Latest Nonce:</span>
            <span className="font-bold text-navy-900">{accountData?.latestNonce}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 uppercase">Pending Nonce:</span>
            <span className="font-bold text-blue-800">{accountData?.pendingNonce}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 uppercase">Diagnosis Code:</span>
            <span className="font-bold text-navy-900">{diagnosticResult?.diagnosisCode}</span>
          </div>
        </div>

        {/* Editable Developer Note */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Developer / Audit Note
          </label>
          <textarea
            rows={3}
            value={developerNote}
            onChange={(e) => setDeveloperNote(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-navy-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-navy-900"
            placeholder="Add context or incident reference..."
          />
        </div>

        {/* Transaction Feedback */}
        {txHash && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
            <div className="flex items-center space-x-1.5 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Record Written On-Chain Successfully!</span>
            </div>
            <div className="font-mono text-[11px] break-all">{txHash}</div>
            <a
              href={`${BOTCHAIN_TESTNET_CONFIG.blockExplorerUrl}/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-700 hover:text-emerald-900 underline text-xs font-bold flex items-center space-x-1"
            >
              <span>View on BOTScan Testnet</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1">
            <div className="flex items-center space-x-1.5 font-bold">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>Transaction Failed:</span>
            </div>
            <div className="font-mono text-[11px] break-all">{errorMsg}</div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
          >
            {txHash ? 'Close' : 'Cancel'}
          </button>
          {!txHash && (
            <button
              onClick={handleExecute}
              disabled={submitting}
              className="flex items-center space-x-1.5 px-5 py-2.5 bg-navy-900 hover:bg-navy-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition active:scale-98"
            >
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              <span>{submitting ? 'Broadcasting Tx...' : 'Submit to BOT Chain (Gas Only)'}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

