const { ethers } = require("ethers");
require("dotenv").config({ path: ".env.local" });

async function main() {
  const rpcUrl = process.env.BOT_TESTNET_RPC || "https://rpc.bohr.life";
  const address = process.env.DEPLOYER_ADDRESS || "0x8800e279B7cea4AE8C45594467b5DE524528413C";

  console.log("Checking Bohr Testnet (Chain ID 968) balance for:");
  console.log("Address: ", address);
  console.log("RPC:     ", rpcUrl);

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const balance = await provider.getBalance(address);
  console.log("Balance: ", ethers.formatEther(balance), "tBOT");
}

main().catch(console.error);
