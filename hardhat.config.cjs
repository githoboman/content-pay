require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: ".env.local" });

const BOHR_TESTNET_RPC = process.env.BOT_TESTNET_RPC || "https://rpc.bohr.life";
const BOT_MAINNET_RPC = process.env.BOT_MAINNET_RPC || "https://rpc.botchain.ai";
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {},
    botTestnet: {
      url: BOHR_TESTNET_RPC,
      chainId: 968,
      accounts: [PRIVATE_KEY],
    },
    botMainnet: {
      url: BOT_MAINNET_RPC,
      chainId: 677,
      accounts: [PRIVATE_KEY],
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./tests/solidity",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
