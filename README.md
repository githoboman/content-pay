# ⚡ ContentPay — Decentralized Micropayment Content Platform on BOT Chain

> **"Sub-Second Content Monetization for Human Creators & Autonomous AI Agents"**  
> A decentralized micropayment and article publishing platform migrated natively to **BOT Chain** (EVM Layer 1 for DePIN and AI Native Applications).

---

## 🚀 Why BOT Chain?

ContentPay has transitioned from Stacks to **BOT Chain** to leverage:
- **⚡ Ultra-Fast 0.75s Block Finality:** Near-instant transaction confirmations, unlocking articles for readers in less than a second.
- **💰 Ultra-Low Transaction Fees:** Average transactions cost ~$0.06 in native BOT token, making micro-transactions (< $1.00) economically viable.
- **🛠️ Full EVM Compatibility:** Native Solidity smart contracts with MetaMask, Hardhat, Foundry, and Remix support.
- **🤖 Agent OS & ERC-8004 Integration:** Autonomous AI agents with verifiable on-chain identities and Agent Wallets can programmatically read research, publish articles, and collect micropayments.
- **🪙 Multi-Currency Support:** Pay with Native BOT / tBOT or ERC-20 tokens (e.g. USDC).
- **🛡️ 97% Direct Creator Payout:** Non-custodial instant split (97% to author address, 3% platform treasury).

---

## 🔗 Network Parameters

| Parameter | Bohr Testnet | BOT Mainnet |
|:---|:---|:---|
| **Chain ID** | `968` (`0x3c8`) | `677` (`0x2a5`) |
| **RPC Endpoint** | `https://rpc.bohr.life` | `https://rpc.botchain.ai` |
| **Native Token** | `tBOT` (18 decimals) | `BOT` (18 decimals) |
| **Block Explorer** | [scan.bohr.life](https://scan.bohr.life/) | [scan.botchain.ai](https://scan.botchain.ai/) |
| **Faucet** | [faucet.botchain.ai/basic](https://faucet.botchain.ai/basic) | N/A |
| **DEX Swap** | N/A | [dex.botchain.ai/#/swap](https://dex.botchain.ai/#/swap) |
| **Bridge** | [bridge.botchain.ai](https://bridge.botchain.ai/) | [bridge.botchain.ai](https://bridge.botchain.ai/) |

---

## 📍 Live Deployments (Bohr Testnet)

| Contract | Address | Explorer Link |
|:---|:---|:---|
| **ContentRegistry** | `0x27af961becF8599579A93A7ED1199218B27f3f12` | [scan.bohr.life/address/0x27af...](https://scan.bohr.life/address/0x27af961becF8599579A93A7ED1199218B27f3f12) |
| **MockUSDC** | `0xa32a17e2d4E9F7C7d502b07e59C52a603d3036D6` | [scan.bohr.life/address/0xa32a...](https://scan.bohr.life/address/0xa32a17e2d4E9F7C7d502b07e59C52a603d3036D6) |
| **Platform Treasury** | `0x8800e279B7cea4AE8C45594467b5DE524528413C` | [scan.bohr.life/address/0x8800...](https://scan.bohr.life/address/0x8800e279B7cea4AE8C45594467b5DE524528413C) |

---

## 📜 Smart Contracts (`contracts/`)

### 1. `ContentRegistry.sol`
- Core platform registry managing article publishing, pricing, and access permissions.
- **Pricing:** Author specifies prices in USD cents (e.g. 150 = $1.50).
- **Payment Split:** 
  - `purchaseWithBOT(articleId)`: Auto-calculates required BOT tokens based on rate, transfers 97% to the author, 3% to treasury, and refunds any excess `msg.value`.
  - `purchaseWithToken(articleId, token)`: Supports ERC-20 tokens (e.g., USDC, USDT) with token-specific decimal normalization.
- **Access Verification:** `hasPurchased(articleId, reader)` and `getPurchasedArticles(reader)` return unlocked status in O(1) query time.
- **Platform Analytics:** Real-time metrics tracking writer earnings, reader purchase volume, and platform revenue.

### 2. `MockUSDC.sol`
- ERC-20 test contract simulating USDC (6 decimals) with a `mintFaucet()` helper for Bohr Testnet experimentation.

---

## 📂 Repository Structure

```
content-pay/
├── contracts/
│   ├── ContentRegistry.sol       # Core micropayment registry for BOT Chain
│   └── MockUSDC.sol              # 6-decimal test token with faucet helper
├── tests/
│   └── solidity/
│       └── ContentRegistry.test.cjs # 10 comprehensive unit tests
├── scripts/
│   └── deploy-botchain.cjs       # Automated deployment script for Bohr Testnet / Mainnet
├── hardhat.config.cjs            # Hardhat network configuration for Chain IDs 968 & 677
├── frontend/
│   ├── app/
│   │   ├── page.tsx              # Modern cyber-aesthetic landing page
│   │   ├── browse/page.tsx       # Content explorer & category filters
│   │   ├── publish/page.tsx      # Creator studio for registering articles
│   │   ├── article/[id]/page.tsx # Article details, instant unlock & paywall
│   │   ├── my-library/page.tsx   # Reader collection of unlocked articles
│   │   ├── test-publish/page.tsx # Bohr Testnet publishing test bench
│   │   └── test-buy/page.tsx     # Bohr Testnet instant purchase terminal
│   ├── components/
│   │   ├── Navigation.tsx        # Responsive navbar with live tBOT balance & network pill
│   │   ├── ConnectWallet.tsx     # Injected EVM wallet connector & network switcher
│   │   ├── ArticleFeed.tsx       # Live query feed with search and filters
│   │   ├── PublishArticle.tsx    # Article publisher with AI sample generator
│   │   └── GradientBackground.tsx# Deep dark mesh gradients
│   ├── context/
│   │   └── WalletContext.tsx     # EVM Web3 provider and chain listeners
│   └── lib/
│       ├── botchain.ts           # RPC utilities, network definitions, and addresses
│       ├── abi.ts                # Contract ABIs
│       └── config.ts             # Active network configuration
└── README.md
```

---

## 🛠️ Getting Started

### 1. Compile & Test Smart Contracts

```bash
# Run contract compilation
npx hardhat compile --config hardhat.config.cjs

# Run 10 unit tests
npx hardhat test tests/solidity/ContentRegistry.test.cjs --config hardhat.config.cjs
```

### 2. Deploy to Bohr Testnet

1. Claim free `tBOT` from the faucet at [https://faucet.botchain.ai/basic](https://faucet.botchain.ai/basic).
2. Add your deployer private key into `.env.local`:
   ```bash
   DEPLOYER_PRIVATE_KEY=0x...
   ```
3. Run the deployment script:
   ```bash
   npx hardhat run scripts/deploy-botchain.cjs --network botTestnet --config hardhat.config.cjs
   ```

### 3. Run the Frontend Locally

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🦊 MetaMask Configuration

To connect MetaMask manually to Bohr Testnet:

- **Network Name:** Bohr Testnet
- **New RPC URL:** `https://rpc.bohr.life`
- **Chain ID:** `968`
- **Currency Symbol:** `tBOT`
- **Block Explorer URL:** `https://scan.bohr.life`

*(Or simply click **"Connect Wallet"** in ContentPay and accept the prompt to add and switch networks automatically!)*

---

## 📄 License
MIT License. Built for the BOT Chain ecosystem.