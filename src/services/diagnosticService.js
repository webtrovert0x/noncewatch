/**
 * Nonce & Transaction Sequencing Diagnostic Engine
 * Analyzes nonces, sequence gaps, replacement collisions, and gas underpricing.
 */

export const ANOMALY_TYPES = {
  HEALTHY: 0,
  PENDING_BACKLOG: 1,
  NONCE_GAP_DETECTED: 2,
  REPLACEMENT_CONFLICT: 3,
  STUCK_TRANSACTION: 4,
};

export class DiagnosticService {
  /**
   * Evaluates the account nonce state and returns comprehensive diagnostics
   */
  diagnoseAccount(accountData) {
    const { latestNonce, pendingNonce, txSequence = [], scenarioIssues } = accountData;
    const delta = Math.max(0, pendingNonce - latestNonce);

    const issues = [];
    let primaryStatus = ANOMALY_TYPES.HEALTHY;
    let diagnosisCode = 'HEALTHY';
    let summary = 'Account transaction sequencing is healthy and synchronized.';

    // Check if predefined scenario issues exist
    if (scenarioIssues && scenarioIssues.length > 0) {
      const issue = scenarioIssues[0];
      if (issue.code === 'NONCE_GAP_DETECTED') {
        primaryStatus = ANOMALY_TYPES.NONCE_GAP_DETECTED;
        diagnosisCode = `GAP_N${issue.missingNonce}`;
        summary = `Critical Nonce Gap: Nonce #${issue.missingNonce} is missing, blocking further execution.`;
      } else if (issue.code === 'UNDERPRICED_REPLACEMENT') {
        primaryStatus = ANOMALY_TYPES.REPLACEMENT_CONFLICT;
        diagnosisCode = `REPL_UNDERPRICED_N${issue.conflictingNonce}`;
        summary = `Replacement Collision at Nonce #${issue.conflictingNonce}: Gas bump below standard 10-12% threshold.`;
      } else if (issue.code === 'PENDING_BACKLOG_QUEUE') {
        primaryStatus = ANOMALY_TYPES.PENDING_BACKLOG;
        diagnosisCode = `BACKLOG_${delta}TX`;
        summary = `Pending Backlog: ${delta} transactions queued consecutively in mempool.`;
      }

      return {
        primaryStatus,
        diagnosisCode,
        summary,
        delta,
        issues: scenarioIssues,
        isHealthy: primaryStatus === ANOMALY_TYPES.HEALTHY,
        missingNonces: issue.missingNonce ? [issue.missingNonce] : [],
        recommendations: scenarioIssues.map(i => i.recommendation).filter(Boolean),
      };
    }

    // Dynamic heuristic analysis for live accounts
    const gaps = [];
    const replacements = [];

    // Check txSequence for explicit gaps or conflicts
    for (let i = 0; i < txSequence.length; i++) {
      const item = txSequence[i];
      if (item.status === 'gap') {
        gaps.push(item.nonce);
      }
      if (item.status === 'replacement_conflict') {
        replacements.push(item.nonce);
      }
    }

    if (gaps.length > 0) {
      primaryStatus = ANOMALY_TYPES.NONCE_GAP_DETECTED;
      diagnosisCode = `GAP_DETECTED_N${gaps.join(',')}`;
      summary = `Critical Nonce Gap detected at Nonce #${gaps.join(', #')}. Missing nonces prevent subsequent transactions from being mined.`;
      issues.push({
        code: 'NONCE_GAP_DETECTED',
        severity: 'critical',
        missingNonce: gaps[0],
        title: `Missing Nonce #${gaps[0]}`,
        message: `Transactions with nonces higher than ${gaps[0]} are stuck in mempool until nonce ${gaps[0]} is confirmed.`,
        recommendation: `Submit a 0-BOT transaction to yourself with Nonce ${gaps[0]} and higher priority fee to clear the queue.`
      });
    } else if (replacements.length > 0) {
      primaryStatus = ANOMALY_TYPES.REPLACEMENT_CONFLICT;
      diagnosisCode = `REPLACEMENT_CONFLICT_N${replacements[0]}`;
      summary = `Transaction replacement detected at Nonce #${replacements[0]}.`;
      issues.push({
        code: 'REPLACEMENT_CONFLICT',
        severity: 'warning',
        conflictingNonce: replacements[0],
        title: `Replacement at Nonce #${replacements[0]}`,
        message: `Multiple candidate transactions submitted with the same nonce.`,
        recommendation: `Ensure gas price is bumped by >= 12% over the previous transaction to guarantee replacement.`
      });
    } else if (delta > 0) {
      primaryStatus = ANOMALY_TYPES.PENDING_BACKLOG;
      diagnosisCode = `BACKLOG_${delta}_TX`;
      summary = `Pending Backlog: ${delta} transaction(s) currently awaiting block inclusion.`;
      issues.push({
        code: 'PENDING_BACKLOG',
        severity: 'info',
        title: `${delta} Transaction(s) Pending`,
        message: `Confirmed nonce is ${latestNonce}, while pending nonce is ${pendingNonce}.`,
        recommendation: `If any transaction is stuck for a long period, speed up transaction nonce #${latestNonce}.`
      });
    }

    return {
      primaryStatus,
      diagnosisCode,
      summary,
      delta,
      issues,
      isHealthy: primaryStatus === ANOMALY_TYPES.HEALTHY,
      missingNonces: gaps,
      recommendations: issues.map(i => i.recommendation).filter(Boolean),
    };
  }

  /**
   * Generates recovery code snippets and payload for developer tooling
   */
  generateRemediationPayload(targetAddress, nonce, baseFeeGwei = '1.5') {
    const recommendedPriorityGwei = 2.0;
    const recommendedMaxFeeGwei = (parseFloat(baseFeeGwei) * 1.5 + recommendedPriorityGwei).toFixed(2);

    return {
      targetAddress,
      nonce,
      type: 2, // EIP-1559
      value: '0',
      maxPriorityFeePerGasGwei: recommendedPriorityGwei.toString(),
      maxFeePerGasGwei: recommendedMaxFeeGwei.toString(),
      gasLimit: 21000,
      
      // Code snippets for developers
      ethersV6Code: `// Ethers.js v6 Nonce Gap Unsticker
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('https://rpc.bohr.life');
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

async function unstickSequence() {
  const tx = await signer.sendTransaction({
    to: '${targetAddress}', // Send 0 BOT to self
    value: 0,
    nonce: ${nonce}, // Exact missing/stuck nonce
    maxPriorityFeePerGas: ethers.parseUnits('${recommendedPriorityGwei}', 'gwei'),
    maxFeePerGas: ethers.parseUnits('${recommendedMaxFeeGwei}', 'gwei'),
  });

  console.log('Unsticking tx broadcasted:', tx.hash);
  await tx.wait();
  console.log('Sequence unblocked!');
}
unstickSequence();`,

      viemCode: `// Viem Nonce Gap Filler
import { createWalletClient, http, parseEther, parseGwei } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { botchainTestnet } from './wagmiConfig';

const account = privateKeyToAccount(process.env.PRIVATE_KEY);
const client = createWalletClient({
  account,
  chain: botchainTestnet,
  transport: http('https://rpc.bohr.life')
});

const hash = await client.sendTransaction({
  to: '${targetAddress}',
  value: 0n,
  nonce: ${nonce},
  maxPriorityFeePerGas: parseGwei('${recommendedPriorityGwei}'),
  maxFeePerGas: parseGwei('${recommendedMaxFeeGwei}'),
});
console.log('Unsticking tx hash:', hash);`,

      castCliCommand: `cast send --rpc-url https://rpc.bohr.life \\
  --private-key $PRIVATE_KEY \\
  --nonce ${nonce} \\
  --value 0 \\
  --priority-gas-price ${recommendedPriorityGwei}gwei \\
  --gas-price ${recommendedMaxFeeGwei}gwei \\
  ${targetAddress}`
    };
  }
}

export const diagnosticService = new DiagnosticService();

