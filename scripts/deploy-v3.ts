
import {
    makeContractDeploy,
    broadcastTransaction,
    AnchorMode,
    PostConditionMode
} from '@stacks/transactions';
import { STACKS_TESTNET } from '@stacks/network';
import { generateWallet } from '@stacks/wallet-sdk';
import * as fs from 'fs';

const MNEMONIC = "welcome beach clarify economy empower net clap click sausage suspect pizza dog jacket output bomb humble wait nut erupt discover carbon purity crucial defy";
// The funded wallet address
const ADDRESS = "ST9NSDHK5969YF6WJ2MRCVVAVTDENWBNTFJRVZ3E";
const NETWORK = STACKS_TESTNET;

// Contracts to deploy (in order)
const CONTRACTS = [
    // Traits (deploy first)
    { name: 'sip-010-trait-ft-standard', file: 'contracts/sip-010-trait-ft-standard.clar' },
    { name: 'pyth-oracle-trait', file: 'contracts/pyth-oracle-trait.clar' },

    // Mocks (depend on traits)
    { name: 'mock-usdc-v3', file: 'contracts/mock-usdc.clar' },
    { name: 'mock-sbtc-v3', file: 'contracts/mock-sbtc.clar' },
    { name: 'mock-pyth-oracle-v1', file: 'contracts/mock-pyth-oracle.clar' },

    // Registry (depends on everything)
    { name: 'content-registry-v3', file: 'contracts/content-registry.clar' }
];

async function main() {
    console.log("🚀 Starting V3 Deployment to Testnet...");
    console.log(`Deployer Address: ${ADDRESS}\n`);

    // 1. Get Wallet
    const wallet = await generateWallet({ secretKey: MNEMONIC, password: '' });
    const account = wallet.accounts[0];
    const senderKey = account.stxPrivateKey;

    // 2. Deploy Loop
    for (const c of CONTRACTS) {
        console.log(`---------------------------------`);
        console.log(`Deploying: ${c.name}...`);

        // Check if file exists
        if (!fs.existsSync(c.file)) {
            console.error(`❌ File not found: ${c.file}`);
            continue;
        }

        const codeBody = fs.readFileSync(c.file, 'utf8');

        // Omit 'nonce' so library fetches it automatically
        const txOptions = {
            contractName: c.name,
            codeBody: codeBody,
            senderKey: senderKey,
            network: NETWORK,
            anchorMode: AnchorMode.Any,
            postConditionMode: PostConditionMode.Allow,
            fee: 500000n, // 0.5 STX
        };

        try {
            const transaction = await makeContractDeploy(txOptions);

            // broadcastTransaction expects an options object in v7
            const broadcastResponse = await broadcastTransaction({
                transaction,
                network: NETWORK
            });

            // Cast to any to handle type check
            const response = broadcastResponse as any;

            if (response.error) {
                console.error(`❌ Error: ${response.reason || response.error}`);

                // If contract already exists, that's OK for traits
                if (response.error === 'ContractAlreadyExists') {
                    console.log(`⚠️  Contract already exists, continuing...`);
                }
            } else {
                console.log(`✅ Broadcasted! TX: ${response.txid}`);
                console.log(`   https://explorer.hiro.so/txid/${response.txid}?chain=testnet`);
            }

            // Delay to allow blockchain to process
            console.log(`   Waiting 3s for blockchain confirmation...`);
            await new Promise(r => setTimeout(r, 3000));

        } catch (e) {
            console.error(`❌ Exception: ${e}`);
        }
    }

    console.log("\n=================================");
    console.log("🎉 Deployment Complete!");
    console.log("=================================");
    console.log("\nNext Steps:");
    console.log("1. Wait ~5 minutes for all transactions to confirm");
    console.log("2. Check the explorer links above");
    console.log("3. Run the frontend and test the application");
}

main();
