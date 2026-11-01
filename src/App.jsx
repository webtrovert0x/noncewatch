import React, { useState, useEffect, useCallback } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import Navbar from './components/Navbar';
import AccountSearchBar from './components/AccountSearchBar';
import NonceOverviewCard from './components/NonceOverviewCard';
import NonceTimeline from './components/NonceTimeline';
import DiagnosticEngine from './components/DiagnosticEngine';
import SequencingDebugger from './components/SequencingDebugger';
import OnChainRegistryHistory from './components/OnChainRegistryHistory';
import ContractConfigModal from './components/ContractConfigModal';
import RecordInvestigationModal from './components/RecordInvestigationModal';

import { botChainService, BOTCHAIN_TESTNET_CONFIG } from './services/botChainService';
import { diagnosticService } from './services/diagnosticService';
import NonceWatchRegistryAbi from './contracts/NonceWatchRegistry.json';

export default function App() {
  const { address: connectedAddress, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();

  // Dynamic address state (starts empty or automatically loads user's connected wallet)
  const [targetAddress, setTargetAddress] = useState('');
  const [accountData, setAccountData] = useState(null);
  const [diagnosticResult, setDiagnosticResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastInspectTxHash, setLastInspectTxHash] = useState(null);

  // Contract registry address state (reads from deployment.json, localStorage or env)
  const [registryAddress, setRegistryAddress] = useState(
    process.env.VITE_REGISTRY_ADDRESS || localStorage.getItem('noncewatch_registry') || '0x87ceEFd8842ed4ba969dd6F414bFfA767c542ccc'
  );

  // Modals state
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [recordModalConfig, setRecordModalConfig] = useState({ isOpen: false, mode: 'record' });
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);

  // Scroll to toolkit ref
  const toolkitRef = React.useRef(null);

  // When wallet connects, automatically set the target address to user's real connected account
  useEffect(() => {
    if (connectedAddress && !targetAddress) {
      setTargetAddress(connectedAddress);
      // Query real on-chain nonces for the connected address
      botChainService.inspectAccountNonces(connectedAddress).then((data) => {
        setAccountData(data);
        setDiagnosticResult(diagnosticService.diagnoseAccount(data));
      }).catch(console.warn);
    }
  }, [connectedAddress]);

  // Core Inspection function: Executes on-chain requestInspection on NonceWatchRegistry (GAS FEE ONLY)
  const inspectAccount = useCallback(async (addressToInspect) => {
    if (!addressToInspect) return;

    // Check if wallet is connected to perform on-chain transaction
    if (!isConnected) {
      alert('Wallet connection required! Every nonce inspection must be recorded on-chain via NonceWatchRegistry.sol and requires standard gas fee only.');
      // Load preview live data from BOT Chain so user can see initial state
      const previewData = await botChainService.inspectAccountNonces(addressToInspect);
      setAccountData(previewData);
      setDiagnosticResult(diagnosticService.diagnoseAccount(previewData));
      return;
    }

    try {
      setLoading(true);

      // 1. Submit on-chain transaction: requestInspection(targetWallet)
      // Requires network gas fee only (0 BOT value)
      if (registryAddress) {
        try {
          const hash = await writeContractAsync({
            address: registryAddress,
            abi: NonceWatchRegistryAbi.abi,
            functionName: 'requestInspection',
            args: [addressToInspect],
          });
          setLastInspectTxHash(hash);
        } catch (txErr) {
          console.warn('User rejected or error in gas fee transaction:', txErr);
          throw txErr;
        }
      }

      // 2. Retrieve live nonce information from BOT Chain Testnet RPC
      const data = await botChainService.inspectAccountNonces(addressToInspect);
      setAccountData(data);

      const diagnostics = diagnosticService.diagnoseAccount(data);
      setDiagnosticResult(diagnostics);

      // Trigger history reload to show the newly recorded audit
      setHistoryRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error('Inspection failed:', err);
      if (err.name !== 'UserRejectedRequestError') {
        alert(`Inspection transaction error: ${err.shortMessage || err.message || err}`);
      }
    } finally {
      setLoading(false);
    }
  }, [isConnected, registryAddress, writeContractAsync]);

  const handleSaveContractAddress = (newAddr) => {
    setRegistryAddress(newAddr);
    localStorage.setItem('noncewatch_registry', newAddr);
    setHistoryRefreshTrigger((prev) => prev + 1);
  };

  const handleTriggerFixGap = (nonce) => {
    toolkitRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleOpenDebugger = () => {
    toolkitRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleRecordSuccess = () => {
    setHistoryRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] flex flex-col font-sans">
      
      {/* Top Navbar */}
      <Navbar
        registryAddress={registryAddress}
        onOpenContractModal={() => setIsContractModalOpen(true)}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* App Hero / Title Banner */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-navy-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-900/80 border border-blue-700 text-blue-200 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
              <span>BOT Chain Testnet Nonce Inspector</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Live Wallet Nonce Inspector & Sequencing Diagnoser
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Every inspection request is recorded on-chain to <strong>NonceWatchRegistry.sol</strong> using standard network <strong>Gas Fee Only</strong>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {connectedAddress && (
              <button
                onClick={() => {
                  setTargetAddress(connectedAddress);
                  inspectAccount(connectedAddress);
                }}
                className="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition active:scale-98"
              >
                Inspect My Connected Wallet (Gas Fee)
              </button>
            )}
            {registryAddress && (
              <button
                onClick={() => {
                  setTargetAddress(registryAddress);
                  inspectAccount(registryAddress);
                }}
                className="px-4 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-700 text-slate-200 font-bold text-xs border border-slate-700 transition active:scale-98"
              >
                Inspect Deployed Registry (Gas Fee)
              </button>
            )}
          </div>
        </div>

        {/* 1. Account Search Bar */}
        <AccountSearchBar
          targetAddress={targetAddress}
          onAddressChange={setTargetAddress}
          onInspect={inspectAccount}
          loading={loading}
          connectedAddress={connectedAddress}
          isConnected={isConnected}
          lastInspectTxHash={lastInspectTxHash}
          registryAddress={registryAddress}
        />

        {/* 2. Nonce Overview Cards */}
        {accountData && (
          <NonceOverviewCard
            accountData={accountData}
            diagnosticResult={diagnosticResult}
          />
        )}

        {/* 3. Nonce Timeline Stream */}
        {accountData && (
          <NonceTimeline
            txSequence={accountData.txSequence}
            onTriggerFixGap={handleTriggerFixGap}
          />
        )}

        {/* 4. Diagnostic & Anomaly Engine */}
        {diagnosticResult && accountData && (
          <DiagnosticEngine
            diagnosticResult={diagnosticResult}
            accountData={accountData}
            onRecordOnChain={() => setRecordModalConfig({ isOpen: true, mode: 'record' })}
            onFlagAnomaly={() => setRecordModalConfig({ isOpen: true, mode: 'flag' })}
            onOpenDebugger={handleOpenDebugger}
            recordingOnChain={false}
          />
        )}

        {/* 5. Developer Diagnostic & Sequencing Toolkit (Interesting Feature) */}
        <div ref={toolkitRef}>
          <SequencingDebugger
            targetAddress={targetAddress}
            diagnosticResult={diagnosticResult}
            accountData={accountData}
            onRefresh={() => inspectAccount(targetAddress)}
          />
        </div>

        {/* 6. On-Chain NonceWatchRegistry Audit Trail */}
        <OnChainRegistryHistory
          registryAddress={registryAddress}
          onSelectAddress={(addr) => {
            setTargetAddress(addr);
            inspectAccount(addr);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          refreshTrigger={historyRefreshTrigger}
        />

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-navy-900">NonceWatch</span>
            <span>—</span>
            <span>BOT Chain Testnet (Chain ID: 968)</span>
          </div>
          <div className="flex items-center space-x-6 text-[11px] font-mono">
            <span>Contract: {registryAddress ? `${registryAddress.slice(0, 8)}...${registryAddress.slice(-6)}` : 'Not Set'}</span>
            <span>Policy: Gas Fee Only</span>
            <a
              href="https://scan.bohr.life/"
              target="_blank"
              rel="noreferrer"
              className="text-blue-700 hover:underline"
            >
              BOTScan Explorer
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ContractConfigModal
        isOpen={isContractModalOpen}
        onClose={() => setIsContractModalOpen(false)}
        currentAddress={registryAddress}
        onSaveAddress={handleSaveContractAddress}
      />

      <RecordInvestigationModal
        isOpen={recordModalConfig.isOpen}
        onClose={() => setRecordModalConfig({ isOpen: false, mode: 'record' })}
        registryAddress={registryAddress}
        accountData={accountData}
        diagnosticResult={diagnosticResult}
        mode={recordModalConfig.mode}
        onSuccess={handleRecordSuccess}
      />

    </div>
  );
}
