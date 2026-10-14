const { makeContractDeploy, broadcastTransaction, AnchorMode } = require('@stacks/transactions');
const { StacksTestnet } = require('@stacks/network');
const fs = require('fs');

// Your deployer private key (from mnemonic in Testnet.toml)
// WARNING: Never commit this to git!
const privateKey = 'YOUR_PRIVATE_KEY_HERE'; // Get this from your wallet

const network = new StacksTestnet();

async function deployContract(contractName, contractFile) {
    const codeBody = fs.readFileSync(contractFile, 'utf8');

    const txOptions = {
        contractName,
        codeBody,
        senderKey: privateKey,
        network,
        anchorMode: AnchorMode.Any,
        fee: 500000n, // 0.5 STX fee
    };

    const transaction = await makeContractDeploy(txOptions);
    const broadcastResponse = await broadcastTransaction(transaction, network);

    console.log(`✅ ${contractName} deployed!`);
    console.log(`TX ID: ${broadcastResponse.txid}`);
    console.log(`https://explorer.hiro.so/txid/${broadcastResponse.txid}?chain=testnet`);
}

async function main() {
    console.log('Deploying USDCx token...\n');
    await deployContract('mock-usdc-v1', './contracts/mock-usdc.clar');

    console.log('\nDeploying sBTC token...\n');
    await deployContract('mock-sbtc-v1', './contracts/mock-sbtc.clar');
}

main().catch(console.error);
