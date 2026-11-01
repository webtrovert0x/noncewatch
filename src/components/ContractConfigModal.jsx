import React, { useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { ethers } from 'ethers';
import { Database, Plus, Check, ExternalLink, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import NonceWatchRegistryAbi from '../contracts/NonceWatchRegistry.json';
import { BOTCHAIN_TESTNET_CONFIG } from '../services/botChainService';

export default function ContractConfigModal({
  isOpen,
  onClose,
  currentAddress,
  onSaveAddress,
}) {
  const [addressInput, setAddressInput] = useState(currentAddress || '');
  const [deploying, setDeploying] = useState(false);
  const [deployError, setDeployError] = useState(null);
  const [deploySuccess, setDeploySuccess] = useState(null);

  const { isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  if (!isOpen) return null;

  const handleSave = () => {
    if (addressInput && !ethers.isAddress(addressInput)) {
      alert('Please enter a valid EVM contract address.');
      return;
    }
    onSaveAddress(addressInput.trim());
    onClose();
  };

  // Deploy NonceWatchRegistry.sol directly from connected wallet (Gas fee only!)
  const handleDeployContractInApp = async () => {
    if (!walletClient || !isConnected) {
      alert('Please connect your wallet on BOT Chain Testnet to deploy the contract.');
      return;
    }

    try {
      setDeploying(true);
      setDeployError(null);
      setDeploySuccess(null);

      // Deploy using Viem wallet client
      const hash = await walletClient.deployContract({
        abi: NonceWatchRegistryAbi.abi,
        bytecode: NonceWatchRegistryAbi.bytecode,
      });

      setDeploySuccess({ hash });

      // Poll for receipt
      const provider = new ethers.JsonRpcProvider(BOTCHAIN_TESTNET_CONFIG.rpcUrl);
      const receipt = await provider.waitForTransaction(hash);

      if (receipt && receipt.contractAddress) {
        setAddressInput(receipt.contractAddress);
        onSaveAddress(receipt.contractAddress);
        setDeploySuccess({ hash, contractAddress: receipt.contractAddress });
      }
    } catch (err) {
      console.error('In-app deployment error:', err);
      setDeployError(err.message || 'Deployment failed');
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-navy-900" />
            <h3 className="text-base font-bold text-navy-900">
              NonceWatchRegistry Contract
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Gas Fee Only Policy Notice */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-950 flex items-start space-x-2.5">
          <Zap className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block">Gas Fee Only Policy:</span>
            <p className="text-slate-700 leading-relaxed">
              Every operation on NonceWatchRegistry (deploying, recording investigations, flagging sequencing anomalies) requires <strong>Gas Fee Only</strong>. There are no protocol taxes or ether fees.
            </p>
          </div>
        </div>

        {/* Existing Contract Address Input */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Deployed Contract Address on BOT Chain Testnet
          </label>
          <input
            type="text"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value.trim())}
            placeholder="0x... (e.g. from hardhat deploy or in-app deploy)"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-900"
          />
        </div>

        {/* Deploy Directly Button */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-navy-900 block">
                Option B: Deploy from Connected Wallet
              </span>
              <span className="text-[11px] text-slate-500">
                Deploys fresh NonceWatchRegistry.sol to BOT Chain Testnet (Gas fee only).
              </span>
            </div>
            <button
              onClick={handleDeployContractInApp}
              disabled={deploying || !isConnected}
              className="flex items-center space-x-1.5 px-3 py-2 bg-navy-900 hover:bg-navy-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition active:scale-98"
            >
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              <span>{deploying ? 'Deploying...' : 'Deploy Now'}</span>
            </button>
          </div>

          {deploySuccess && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 space-y-1">
              <span className="font-bold block">Deployed Successfully!</span>
              {deploySuccess.contractAddress && (
                <div className="font-mono text-[11px] break-all">
                  Address: {deploySuccess.contractAddress}
                </div>
              )}
              <a
                href={`${BOTCHAIN_TESTNET_CONFIG.blockExplorerUrl}/tx/${deploySuccess.hash}`}
                target="_blank"
                rel="noreferrer"
                className="underline flex items-center space-x-1 text-[11px] text-emerald-700 hover:text-emerald-900"
              >
                <span>View Deployment Tx on BOTScan</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {deployError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900">
              <span className="font-bold block">Deployment Error:</span>
              <span className="font-mono text-[11px] break-all">{deployError}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center space-x-1.5 px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-sm transition"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Configuration</span>
          </button>
        </div>

      </div>
    </div>
  );
}

