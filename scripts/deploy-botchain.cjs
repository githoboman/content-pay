const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("----------------------------------------------------");
  console.log("Deploying ContentPay contracts to BOT Chain network:");
  console.log("Network Name:     ", hre.network.name);
  console.log("Deployer Address: ", deployer.address);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Deployer Balance: ", hre.ethers.formatEther(balance), "BOT");
  console.log("----------------------------------------------------");

  // 1. Deploy ContentRegistry (using deployer address as initial platform treasury)
  console.log("Deploying ContentRegistry...");
  const ContentRegistry = await hre.ethers.getContractFactory("ContentRegistry");
  const registry = await ContentRegistry.deploy(deployer.address);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("✅ ContentRegistry deployed at:", registryAddress);

  // 2. Deploy MockUSDC (useful on testnet/local)
  console.log("Deploying MockUSDC...");
  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("✅ MockUSDC deployed at:", usdcAddress);

  // 3. Register MockUSDC in ContentRegistry
  console.log("Configuring MockUSDC support in ContentRegistry...");
  const setTokenTx = await registry.setSupportedToken(usdcAddress, true, 6);
  await setTokenTx.wait();
  console.log("✅ MockUSDC enabled as payment token (6 decimals)");

  // 4. Publish initial demo articles
  console.log("Publishing genesis demo articles...");
  const tx1 = await registry.publishArticle(
    "Welcome to ContentPay on BOT Chain",
    "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
    100, // $1.00 USD
    "DePIN & AI"
  );
  await tx1.wait();

  const tx2 = await registry.publishArticle(
    "ERC-8004 Agent OS: The Rise of Autonomous On-Chain Agents",
    "ipfs://bafybeih4j35fq4o6v3k5s6a2s5k7c8l9m0n1o2p3q4r5s6t7u8v9w0x1y2",
    250, // $2.50 USD
    "AI Native"
  );
  await tx2.wait();
  console.log("✅ Genesis demo articles published on-chain!");

  // 5. Output summary
  console.log("----------------------------------------------------");
  console.log("🎉 BOT CHAIN DEPLOYMENT SUMMARY:");
  console.log("Network:          ", hre.network.name);
  console.log("ContentRegistry:  ", registryAddress);
  console.log("MockUSDC:         ", usdcAddress);
  console.log("PlatformTreasury: ", deployer.address);
  console.log("----------------------------------------------------");

  // Save deployment info to frontend config helper
  const deploymentData = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    contentRegistry: registryAddress,
    mockUsdc: usdcAddress,
    treasury: deployer.address,
    deployedAt: new Date().toISOString()
  };

  const outputPath = path.join(__dirname, "..", "frontend", "lib", "deployed-contracts.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentData, null, 2));
  console.log("Saved deployment metadata to:", outputPath);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
