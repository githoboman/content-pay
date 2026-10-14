const { ethers } = require("ethers");

const wallet = ethers.Wallet.createRandom();

console.log("=== NEW BOT CHAIN DEPLOYER WALLET ===");
console.log("Address:     ", wallet.address);
console.log("Private Key: ", wallet.privateKey);
console.log("Mnemonic:    ", wallet.mnemonic.phrase);
console.log("=====================================");
