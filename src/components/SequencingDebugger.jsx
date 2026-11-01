import React, { useState } from 'react';
import { useAccount, useSendTransaction } from 'wagmi';
import { parseEther, parseGwei } from 'viem';
import {
  Wrench,
  Flame,
  Terminal,
  Copy,
  Check,
  Zap,
  Play,
  RotateCcw,
  AlertTriangle,
  Code2,
  Cpu,
  Layers,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { diagnosticService } from '../services/diagnosticService';
import { botChainService, BOTCHAIN_TESTNET_CONFIG } from '../services/botChainService';

export default function SequencingDebugger({
  targetAddress,
  diagnosticResult,
  accountData,
  onRefresh,
}) {
  const { isConnected, address: connectedAddress } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();

  const [activeTab, setActiveTab] = useState('gap-filler');
  const [copiedCode, setCopiedCode] = useState(false);
  const [customNonce, setCustomNonce] = useState(
    diagnosticResult?.missingNonces?.[0] ?? (accountData?.latestNonce ?? 0)
  );
  const [broadcasting, setBroadcasting] = useState(false);
  const [txSuccessHash, setTxSuccessHash] = useState(null);
  const [broadcastError, setBroadcastError] = useState(null);

  // Replacement calculator state
  const [originalGasPrice, setOriginalGasPrice] = useState('1.5');

  // RPC Console state
  const [rpcMethod, setRpcMethod] = useState('eth_getTransactionCount');
  const [rpcParams, setRpcParams] = useState(JSON.stringify([targetAddress, 'pending'], null, 2));
  const [rpcResult, setRpcResult] = useState(null);
  const [rpcRunning, setRpcRunning] = useState(false);

  // Calculate remediation payload
  const remediation = diagnosticService.generateRemediationPayload(
    targetAddress || connectedAddress || '0x0000000000000000000000000000000000000000',
    customNonce,
    accountData?.baseFeePerGas || '1.5'
  );

  // Calculate gas replacement bumps
  const origGas = parseFloat(originalGasPrice) || 1.5;
  const minBumpGas = (origGas * 1.10).toFixed(2); // Strict +10%
  const safeBumpGas = (origGas * 1.15).toFixed(2); // Recommended +15%
  const aggressiveBumpGas = (origGas * 1.30).toFixed(2); // Urgent +30%

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Broadcast 0-BOT gap-filler transaction from connected wallet (Gas fee only!)
  const handleBroadcastGapFiller = async () => {
    if (!isConnected) {
      alert('Please connect your wallet to broadcast the gap-filler transaction on BOT Chain Testnet.');
      return;
    }

    try {
      setBroadcasting(true);
      setBroadcastError(null);
      setTxSuccessHash(null);

      const hash = await sendTransactionAsync({
        to: connectedAddress, // Self-transfer 0 BOT
        value: 0n,
        nonce: Number(customNonce),
        maxPriorityFeePerGas: parseGwei(remediation.maxPriorityFeePerGasGwei),
        maxFeePerGas: parseGwei(remediation.maxFeePerGasGwei),
      });

      setTxSuccessHash(hash);
      onRefresh?.();
    } catch (err) {
      console.error('Gap filler broadcast error:', err);
      setBroadcastError(err.message || 'Failed to submit transaction');
    } finally {
      setBroadcasting(false);
    }
  };

  // Run raw RPC call
  const handleExecuteRpc = async () => {
    try {
      setRpcRunning(true);
      let parsedParams = [];
      try {
        parsedParams = JSON.parse(rpcParams);
      } catch {
        parsedParams = [targetAddress, 'latest'];
      }

      const res = await botChainService.executeRawRpc(rpcMethod, parsedParams);
      setRpcResult(res);
    } catch (err) {
      setRpcResult({ success: false, error: err.message, durationMs: 0 });
    } finally {
      setRpcRunning(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
      
      {/* Header */}
      <div className="border-b border-slate-100 pb-4">
        <div className="flex items-center space-x-2">
          <Wrench className="w-5 h-5 text-navy-900" />
          <h2 className="text-base font-bold text-navy-900">
            Developer Transaction Sequencing Diagnoser & Toolkit
          </h2>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-900">
            EVM Protocol Rules
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Resolve out-of-order nonce deadlocks, generate gap-filler transactions, calculate replacement gas thresholds, and inspect raw BOT Chain JSON-RPC.
        </p>
      </div>

      {/* Toolkit Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('gap-filler')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === 'gap-filler'
              ? 'border-navy-900 text-navy-900 bg-slate-50'
              : 'border-transparent text-slate-500 hover:text-navy-900'
          }`}
        >
          <Wrench className="w-3.5 h-3.5 text-rose-600" />
          <span>Nonce Gap Unsticker (1-Click)</span>
        </button>

        <button
          onClick={() => setActiveTab('replacement')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === 'replacement'
              ? 'border-navy-900 text-navy-900 bg-slate-50'
              : 'border-transparent text-slate-500 hover:text-navy-900'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-amber-600" />
          <span>Speed-Up & Replacement Calculator</span>
        </button>

        <button
          onClick={() => setActiveTab('rpc-console')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === 'rpc-console'
              ? 'border-navy-900 text-navy-900 bg-slate-50'
              : 'border-transparent text-slate-500 hover:text-navy-900'
          }`}
        >
          <Terminal className="w-3.5 h-3.5 text-blue-600" />
          <span>Raw JSON-RPC Inspector</span>
        </button>
      </div>

      {/* TAB 1: Nonce Gap Filler Tool */}
      {activeTab === 'gap-filler' && (
        <div className="space-y-5">
          <div className="p-4 bg-navy-50 border border-navy-200 rounded-xl text-xs space-y-1.5 text-navy-900">
            <span className="font-bold flex items-center space-x-1.5 text-blue-900">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>How EVM Nonce Sequencing Works:</span>
            </span>
            <p className="text-slate-700 leading-relaxed">
              Every Ethereum / BOT Chain transaction from an account must have an exact consecutive nonce: 0, 1, 2, 3...
              If transaction with Nonce <strong>#{customNonce}</strong> was skipped, dropped, or never mined, all higher nonce transactions (e.g. #{Number(customNonce) + 1}, #{Number(customNonce) + 2}) will be <strong>held pending forever</strong> in the mempool.
              Submitting a 0-BOT self-transfer with Nonce #{customNonce} immediately satisfies the sequencing constraint and unblocks your entire queue!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Target Missing Nonce
              </label>
              <input
                type="number"
                value={customNonce}
                onChange={(e) => setCustomNonce(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-navy-900 font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-navy-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Recommended Priority Fee
              </label>
              <input
                type="text"
                disabled
                value={`${remediation.maxPriorityFeePerGasGwei} Gwei`}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-slate-600 font-mono text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Calculated Max Fee
              </label>
              <input
                type="text"
                disabled
                value={`${remediation.maxFeePerGasGwei} Gwei`}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-slate-600 font-mono text-sm font-bold"
              />
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-xs font-bold text-navy-900 block">
                Broadcast Gap-Filler (Gas Fee Only)
              </span>
              <span className="text-[11px] text-slate-500">
                Sends a 0 BOT transfer to self using Nonce #{customNonce}. Incurs only standard network gas.
              </span>
            </div>

            <button
              onClick={handleBroadcastGapFiller}
              disabled={broadcasting}
              className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-navy-900 hover:bg-navy-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition active:scale-98"
            >
              <Play className={`w-3.5 h-3.5 text-blue-400 ${broadcasting ? 'animate-spin' : ''}`} />
              <span>{broadcasting ? 'Submitting to BOT Chain...' : `Broadcast Nonce #${customNonce}`}</span>
            </button>
          </div>

          {/* Broadcast Status feedback */}
          {txSuccessHash && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
              <div>
                <span className="font-bold block">Transaction Broadcasted Successfully!</span>
                <span className="font-mono text-[11px] break-all">{txSuccessHash}</span>
              </div>
              <a
                href={`${BOTCHAIN_TESTNET_CONFIG.blockExplorerUrl}/tx/${txSuccessHash}`}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-700 hover:text-emerald-900 underline text-xs font-bold flex items-center space-x-1"
              >
                <span>View on BOTScan</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {broadcastError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900">
              <span className="font-bold block">Broadcast Error:</span>
              <span className="font-mono text-[11px] break-all">{broadcastError}</span>
            </div>
          )}

          {/* Developer Code Snippets Accordion */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
                <Code2 className="w-4 h-4 text-blue-600" />
                <span>Developer Code & CLI Snippets</span>
              </span>
              <button
                onClick={() => handleCopy(remediation.ethersV6Code)}
                className="flex items-center space-x-1 text-xs font-medium text-blue-700 hover:text-blue-900"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied' : 'Copy Ethers.js Code'}</span>
              </button>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-navy-950 text-slate-200 p-4 font-mono text-xs">
              <div className="text-slate-400 mb-2 text-[10px] uppercase font-bold">Ethers.js v6 Implementation</div>
              <pre className="overflow-x-auto whitespace-pre-wrap">{remediation.ethersV6Code}</pre>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 text-slate-200 p-3 font-mono text-xs">
              <div className="text-slate-400 mb-1 text-[10px] uppercase font-bold">Foundry Cast CLI Command</div>
              <pre className="overflow-x-auto whitespace-pre-wrap">{remediation.castCliCommand}</pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Replacement & Cancellation Calculator */}
      {activeTab === 'replacement' && (
        <div className="space-y-5">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1.5 text-amber-950">
            <span className="font-bold flex items-center space-x-1.5 text-amber-900">
              <Flame className="w-4 h-4 text-amber-600" />
              <span>EVM Replacement Rules (EIP-1559 & Legacy):</span>
            </span>
            <p className="text-slate-700 leading-relaxed">
              When replacing an existing pending transaction (same nonce), the node's mempool requires a <strong>minimum 10% gas price bump</strong>.
              Submitting anything less results in the dreaded <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">replacement transaction underpriced</code> error.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Original Stuck Transaction Gas Price (Gwei)
            </label>
            <input
              type="number"
              step="0.1"
              value={originalGasPrice}
              onChange={(e) => setOriginalGasPrice(e.target.value)}
              className="w-full sm:w-64 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-navy-900 font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-navy-900"
            />
          </div>

          {/* Gas Bump Scenarios */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Minimum Bump (+10%)
              </span>
              <div className="text-2xl font-black font-mono text-navy-900">
                {minBumpGas} <span className="text-xs font-semibold text-slate-500">Gwei</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Strict minimum threshold required by BOT Chain mempool.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                Recommended Bump (+15%)
              </span>
              <div className="text-2xl font-black font-mono text-blue-900">
                {safeBumpGas} <span className="text-xs font-semibold text-slate-500">Gwei</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Safe replacement margin guaranteeing mempool adoption.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                Urgent Speed-Up (+30%)
              </span>
              <div className="text-2xl font-black font-mono text-amber-900">
                {aggressiveBumpGas} <span className="text-xs font-semibold text-slate-500">Gwei</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Fast-track block inclusion during sudden spikes.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 text-xs font-mono">
            <span className="text-slate-400 uppercase text-[10px] font-bold block">
              Cancellation Payload Recipe
            </span>
            <p className="text-slate-300">
              To cancel a stuck transaction: send a transaction with <strong>Value = 0 BOT</strong>, <strong>To = Your Own Address</strong>, with the exact <strong>same Nonce</strong>, and gas price of at least <strong className="text-amber-400">{safeBumpGas} Gwei</strong>.
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: Raw JSON-RPC Inspector */}
      {activeTab === 'rpc-console' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                JSON-RPC Method
              </label>
              <select
                value={rpcMethod}
                onChange={(e) => setRpcMethod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-navy-900 font-mono text-xs font-bold focus:outline-none focus:ring-2 focus:ring-navy-900"
              >
                <option value="eth_getTransactionCount">eth_getTransactionCount</option>
                <option value="eth_getBalance">eth_getBalance</option>
                <option value="eth_blockNumber">eth_blockNumber</option>
                <option value="eth_gasPrice">eth_gasPrice</option>
                <option value="eth_getBlockByNumber">eth_getBlockByNumber</option>
                <option value="txpool_status">txpool_status</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                RPC Endpoint
              </label>
              <input
                type="text"
                disabled
                value={BOTCHAIN_TESTNET_CONFIG.rpcUrl}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-slate-500 font-mono text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Parameters (JSON Array)
            </label>
            <textarea
              rows={2}
              value={rpcParams}
              onChange={(e) => setRpcParams(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-navy-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-navy-900"
            />
          </div>

          <button
            onClick={handleExecuteRpc}
            disabled={rpcRunning}
            className="flex items-center space-x-2 px-5 py-2.5 bg-navy-900 hover:bg-navy-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition active:scale-98"
          >
            <Play className={`w-3.5 h-3.5 text-blue-400 ${rpcRunning ? 'animate-spin' : ''}`} />
            <span>{rpcRunning ? 'Executing RPC...' : 'Execute Raw RPC'}</span>
          </button>

          {rpcResult && (
            <div className="rounded-xl border border-slate-200 bg-slate-900 text-slate-200 p-4 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-[10px] border-b border-slate-800 pb-2">
                <span>Status: {rpcResult.success ? '200 OK' : 'RPC Error'}</span>
                <span>Latency: {rpcResult.durationMs}ms</span>
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap max-h-60">
                {JSON.stringify(rpcResult.result || rpcResult.error, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

