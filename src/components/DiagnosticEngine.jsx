import React from 'react';
import { AlertTriangle, CheckCircle2, Flame, Layers, ArrowRight, ShieldAlert, Cpu, FileCheck2, Zap } from 'lucide-react';
import { ANOMALY_TYPES } from '../services/diagnosticService';

export default function DiagnosticEngine({
  diagnosticResult,
  accountData,
  onRecordOnChain,
  onFlagAnomaly,
  onOpenDebugger,
  recordingOnChain,
}) {
  if (!diagnosticResult) return null;

  const {
    primaryStatus,
    diagnosisCode,
    summary,
    issues = [],
    recommendations = [],
    isHealthy,
  } = diagnosticResult;

  let bannerClass = 'bg-blue-50 border-blue-200 text-blue-900';
  let badgeClass = 'bg-blue-600 text-white';
  let statusTitle = 'Pending Queue Synchronizing';
  let StatusIcon = Layers;

  if (isHealthy) {
    bannerClass = 'bg-emerald-50 border-emerald-200 text-emerald-950';
    badgeClass = 'bg-emerald-600 text-white';
    statusTitle = 'Optimal Sequencing Health';
    StatusIcon = CheckCircle2;
  } else if (primaryStatus === ANOMALY_TYPES.NONCE_GAP_DETECTED) {
    bannerClass = 'bg-rose-50 border-rose-300 text-rose-950';
    badgeClass = 'bg-rose-600 text-white';
    statusTitle = 'Critical Nonce Gap Detected';
    StatusIcon = AlertTriangle;
  } else if (primaryStatus === ANOMALY_TYPES.REPLACEMENT_CONFLICT) {
    bannerClass = 'bg-amber-50 border-amber-300 text-amber-950';
    badgeClass = 'bg-amber-600 text-white';
    statusTitle = 'Transaction Replacement Collision';
    StatusIcon = Flame;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-navy-900 flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-blue-700" />
              <span>Sequencing Diagnostic & Anomaly Engine</span>
            </h2>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${badgeClass}`}>
              {diagnosisCode}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automated static & mempool analysis on BOT Chain Testnet.
          </p>
        </div>

        {/* On-Chain Record Buttons (Gas Fee Only) */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onFlagAnomaly}
            disabled={recordingOnChain || isHealthy}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 disabled:opacity-50 rounded-xl transition border border-amber-200"
            title="Flag sequencing problem on BOT Chain (Gas Fee Only)"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
            <span>Flag Anomaly</span>
          </button>

          <button
            onClick={onRecordOnChain}
            disabled={recordingOnChain}
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-navy-900 hover:bg-navy-800 disabled:opacity-50 rounded-xl transition shadow-sm"
            title="Record this investigation on NonceWatchRegistry (Gas Fee Only)"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-blue-400" />
            <span>{recordingOnChain ? 'Submitting Tx...' : 'Record on BOT Chain'}</span>
          </button>
        </div>
      </div>

      {/* Main Status Alert Box */}
      <div className={`p-4 rounded-xl border flex items-start space-x-3.5 ${bannerClass}`}>
        <div className="mt-0.5">
          <StatusIcon className="w-5 h-5 flex-shrink-0" />
        </div>
        <div className="space-y-1 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">{statusTitle}</h3>
            <span className="text-[10px] uppercase font-mono tracking-wider font-semibold opacity-75">
              BOT Chain EVM Rule
            </span>
          </div>
          <p className="text-xs leading-relaxed opacity-90 font-medium">
            {summary}
          </p>
        </div>
      </div>

      {/* Issues Breakdown */}
      {issues.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Detected Sequencing Anomalies ({issues.length})
          </h4>
          <div className="grid grid-cols-1 gap-2.5">
            {issues.map((issue, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-navy-900">{issue.title}</span>
                    <span className={`px-2 py-0.2 text-[10px] font-mono font-bold rounded uppercase ${
                      issue.severity === 'critical'
                        ? 'bg-rose-100 text-rose-800'
                        : issue.severity === 'warning'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {issue.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-normal">
                    {issue.message}
                  </p>
                </div>

                <button
                  onClick={onOpenDebugger}
                  className="flex-shrink-0 flex items-center space-x-1 px-3 py-1.5 text-xs font-bold text-navy-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition"
                >
                  <span>Diagnose</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Developer Recommendations & Remediation */}
      {recommendations.length > 0 && (
        <div className="p-4 rounded-xl bg-slate-900 text-slate-100 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-blue-400">
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Developer Action Recommendation</span>
          </div>
          <ul className="text-xs space-y-1.5 text-slate-300 list-disc list-inside">
            {recommendations.map((rec, i) => (
              <li key={i} className="leading-relaxed">
                <span className="text-white font-medium">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Gas Fee Notice Banner */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
        <span className="flex items-center space-x-1.5">
          <Zap className="w-3 h-3 text-amber-600" />
          <span>Every on-chain registration on NonceWatchRegistry requires standard <strong>gas fee only</strong> (no protocol fee).</span>
        </span>
        <span className="font-mono text-slate-400 hidden sm:inline">BOT Testnet (968)</span>
      </div>

    </div>
  );
}

