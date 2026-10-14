
import { generateWallet } from '@stacks/wallet-sdk';
import { makeSTXTokenTransfer } from '@stacks/transactions';
import { c32address } from 'c32check';
import { STACKS_TESTNET } from '@stacks/network';

// New mnemonic provided by user
const MNEMONIC = "welcome beach clarify economy empower net clap click sausage suspect pizza dog jacket output bomb humble wait nut erupt discover carbon purity crucial defy";

async function check() {
    try {
        const wallet = await generateWallet({ secretKey: MNEMONIC, password: '' });
        const account = wallet.accounts[0];

        // Create a dummy tx to see the sender address derived by the library
        const tx = await makeSTXTokenTransfer({
            recipient: 'ST1V1SKKEMNCPF6CT7N303852M2ANKKKGY9PTZTJX', // Dummy recipient
            amount: 100n,
            senderKey: account.stxPrivateKey,
            network: STACKS_TESTNET
        });

        console.log(`Mnemonic: ${MNEMONIC.substring(0, 15)}...`);

        // The sender address hash is in auth.spendingCondition.signer (hex string)
        const signerHash = tx.auth.spendingCondition.signer;
        console.log(`Signer Hash: ${signerHash}`);

        // Convert to ST address (Testnet = 26)
        const address = c32address(26, signerHash);
        console.log(`Derived Address: ${address}`);

    } catch (e) {
        console.error("Error:", e);
    }
}

check();
