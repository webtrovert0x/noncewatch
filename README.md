# NonceWatch — Wallet Nonce Inspector & Sequencing Diagnoser

[![Network](https://img.shields.io/badge/Network-BOT%20Chain%20Testnet-0f1c32?style=for-the-badge&logo=ethereum)](https://scan.bohr.life)
[![Chain ID](https://img.shields.io/badge/Chain%20ID-968-1e40af?style=for-the-badge)](https://rpc.bohr.life)
[![Contract](https://img.shields.io/badge/Contract-0x87ce...2ccc-059669?style=for-the-badge)](https://scan.bohr.life/address/0x87ceEFd8842ed4ba969dd6F414bFfA767c542ccc)
[![Policy](https://img.shields.io/badge/Policy-Gas%20Fee%20Only-d97706?style=for-the-badge)](https://scan.bohr.life)

**NonceWatch** is a developer-grade transaction nonce inspector and sequencing diagnostic engine built specifically for **BOT Chain Testnet** (Chain ID: `968`).

Transaction nonce conflicts, skipped nonces (gaps), and underpriced replacements cause stuck, queued, or rejected transactions when users or bots submit multiple transactions quickly. NonceWatch diagnoses transaction sequencing problems in real-time, generates gap-filler unsticking payloads, and permanently records audit investigations on-chain via `NonceWatchRegistry.sol`.

---

## 📄 Whitepaper

The complete architectural specification, mathematical formulation of head-of-line blocking, EVM transaction pool replacement mechanics, and remediation algorithms are documented in [**WHITEPAPER.md**](WHITEPAPER.md).

---

## 🌐 BOT Chain Testnet Specification

| Parameter | Configuration |
| :--- | :--- |
| **Network Name** | BOT Chain Testnet |
| **Chain ID** | `968` (Hex: `0x3c8`) |
| **RPC Endpoint** | `https://rpc.bohr.life` |
| **Native Currency** | `BOT` |
| **Block Explorer** | [https://scan.bohr.life](https://scan.bohr.life) |
| **Registry Contract** | [`0x87ceEFd8842ed4ba969dd6F414bFfA767c542ccc`](https://scan.bohr.life/address/0x87ceEFd8842ed4ba969dd6F414bFfA767c542ccc) |
| **Deployer Account** | [`0x55DA37AbbF8C9141adA4Dd1C2eF7211c0483eC16`](https://scan.bohr.life/address/0x55DA37AbbF8C9141adA4Dd1C2eF7211c0483eC16) |

---

## ⚡ Gas Fee Only Execution Model

In strict accordance with the protocol design:
- **Every function that interacts with `NonceWatchRegistry.sol` incurs network Gas Fee Only.**
- There are **no protocol fees, no surcharge, and no fee deductions** (`msg.value == 0`).
- **All operations require gas fees** — there are no "gas-free" interactions:
  - `requestInspection(targetWallet)`: Records an on-chain inspection request before querying BOT Chain nonces.
  - `recordInvestigation(...)`: Records an account's diagnostic audit snapshot permanently on-chain.
  - `flagSequencingAnomaly(...)`: Flags an out-of-order sequence blockage (such as a missing nonce gap).
  - `updateInvestigationStatus(...)`: Marks an existing investigation as resolved once unblocked.
  - `verifyNonceCheckpoint(...)`: Anchors a verified nonce checkpoint for bots and automated relayers.
  - `broadcastGapFiller(...)`: Broadcasts a 0-value self-transfer at the missing nonce to restore the pipeline.

---

## 🔍 Core Capabilities

### 1. Real-Time Account Nonce Inspection
- Compares confirmed nonces (`eth_getTransactionCount(addr, 'latest')`) against pending nonces (`eth_getTransactionCount(addr, 'pending')`).
- Automatically calculates the transaction queue backlog delta: $\Delta = N_{\text{pending}} - N_{\text{latest}}$.
- Fetches real-time BOT balance, account code type (EOA vs Smart Contract), base fee, and block height directly from BOT Chain Testnet RPC (`https://rpc.bohr.life`).

### 2. Interactive Nonce Sequence Pipeline
- Chronological, color-coded visual stream of nonces:
  - 🟦 **Dark Navy Node:** Confirmed & mined on BOT Chain.
  - 🟥 **Pulsing Red Hazard Node:** Critical Nonce Gap (missing nonce holding up queue).
  - 🟦 **Blue Clock Node:** Pending in mempool backlog.
  - 🟨 **Amber Flame Node:** Transaction replacement collision (multiple txs with identical nonce).

### 3. Developer Sequencing Diagnoser (Featured Toolkit)
- **1-Click Gap Filler:** Automatically constructs and broadcasts a 0-BOT self-transfer with the exact missing nonce and recommended priority fee.
- **Replacement Gas Calculator:** Calculates strict minimum (+10%), recommended (+15%), and urgent (+30%) gas bumps to prevent `replacement transaction underpriced` errors.
- **Multi-Framework Code Generator:** Pre-built scripts for **Ethers.js v6**, **Viem**, and **Foundry Cast CLI**.
- **Raw JSON-RPC Console:** Execute live JSON-RPC commands (`eth_getTransactionCount`, `eth_getBlockByNumber`, `eth_gasPrice`) directly against BOT Chain with latency benchmarks.

### 4. On-Chain Audit Trail (`NonceWatchRegistry.sol`)
- Permanent ledger of recorded nonce checks and sequencing anomalies on BOT Chain Testnet.
- Filter by All Audits, Anomalies, or Inspector Address.
- 1-click on-chain resolution updates with developer notes.

---

## 🎨 User Interface Theme

The interface strictly implements a crisp **White and Navy Blue** palette:
- **Backgrounds:** Clean white (`#ffffff`) and crisp light slate (`#f8fafc`).
- **Accents & Components:** Deep Navy Blue (`#0f1c32`, `#1e40af`, `#172554`).
- **Typography:** Inter (body) & JetBrains Mono (nonces, addresses, hashes).
- Fully responsive across desktop, tablet, and mobile devices.

---

## 📁 Repository Structure

```
nonceWatch/
├── contracts/
│   └── NonceWatchRegistry.sol      # On-chain investigation & anomaly registry
├── scripts/
│   └── deploy.cjs                  # Hardhat deployment script for BOT Chain Testnet
├── test/
│   └── NonceWatchRegistry.test.cjs # Comprehensive unit test suite (7 passing tests)
├── src/
│   ├── components/
│   │   ├── AccountSearchBar.jsx    # Search bar with on-chain gas fee inspection trigger
│   │   ├── ContractConfigModal.jsx # Contract configuration and in-app deployer
│   │   ├── DiagnosticEngine.jsx    # Anomaly classifier and remediation engine
│   │   ├── Navbar.jsx              # Header with BOT Chain status & wallet connect
│   │   ├── NonceOverviewCard.jsx   # Latest, pending, delta, and BOT balance cards
│   │   ├── NonceTimeline.jsx       # Interactive sequence pipeline & node inspector
│   │   ├── OnChainRegistryHistory.jsx # Live audit trail from NonceWatchRegistry.sol
│   │   ├── RecordInvestigationModal.jsx # Modal to commit audit snapshots on-chain
│   │   └── SequencingDebugger.jsx  # Gap filler, replacement calculator & RPC console
│   ├── contracts/
│   │   ├── deployment.json         # Deployed address & metadata
│   │   └── NonceWatchRegistry.json # Compiled ABI & bytecode
│   ├── services/
│   │   ├── botChainService.js      # Live BOT Chain Testnet JSON-RPC service
│   │   └── diagnosticService.js    # Sequence anomaly heuristics & payload builder
│   ├── App.jsx                     # Root application coordinator
│   ├── main.jsx                    # Wagmi, QueryClient & React entrypoint
│   ├── wagmiConfig.js              # Reown AppKit & Wagmi configuration for BOT Chain
│   └── index.css                   # Tailwind styles and navy animations
├── hardhat.config.cjs              # Hardhat configuration (Paris target, BOT Chain 968)
├── vite.config.js                  # Vite configuration loading REOWN_ID securely
├── tailwind.config.js              # Navy blue design tokens
├── package.json                    # Project dependencies and build scripts
├── WHITEPAPER.md                   # Complete protocol whitepaper
├── README.md                       # Comprehensive documentation
├── .env.example                    # Environment variable template
└── .gitignore                      # Git exclusion rules (protects private keys)
```

---

## 🛠️ Environment Configuration (`.env`)

A `.env` file should be located in the root directory:

```env
# BOT Chain Testnet Configuration
BOTCHAIN_TESTNET_RPC=https://rpc.bohr.life
BOTCHAIN_CHAIN_ID=968
BOTCHAIN_EXPLORER=https://scan.bohr.life/

# Add your private key for contract deployment:
PRIVATE_KEY=your_private_key_here

# Add your Reown AppKit Project ID (from https://cloud.reown.com):
REOWN_ID=your_reown_project_id_here

# Deployed NonceWatchRegistry Contract Address on BOT Chain Testnet:
VITE_REGISTRY_ADDRESS=0x87ceEFd8842ed4ba969dd6F414bFfA767c542ccc
```

> **Security Note:** Vite loads `REOWN_ID` securely without exposing it via public `VITE_` prefixes. `.env` is ignored in `.gitignore` and is never committed to version control.

---

## 🚀 Quickstart

### 1. Install Dependencies
```bash
npm install
```

### 2. Compile & Test Smart Contract
```bash
npm run compile
npm test
```
Output:
```
  NonceWatchRegistry Contract
    ✔ should initialize with 0 total investigations
    ✔ should record an inspection request requiring gas fee only (no protocol fee)
    ✔ should record an investigation requiring gas fee only (no protocol fee)
    ✔ should flag a sequencing anomaly (gas fee only)
    ✔ should update investigation status upon resolution
    ✔ should verify and store nonce checkpoints (gas fee only)
    ✔ should fetch batch recent investigations

  7 passing (687ms)
```

### 3. Deploy Contract to BOT Chain Testnet (Optional)
```bash
npx hardhat run scripts/deploy.cjs --network botchainTestnet
```

### 4. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Build for Production
```bash
npm run build
```

---

## 📜 License

MIT License. Built for the BOT Chain ecosystem.
