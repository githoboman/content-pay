const { expect } = require("chai");
const hre = require("hardhat");

describe("ContentRegistry on BOT Chain", function () {
  let ContentRegistry, registry;
  let MockUSDC, usdc;
  let owner, treasury, author, reader, other;

  beforeEach(async function () {
    [owner, treasury, author, reader, other] = await hre.ethers.getSigners();

    // Deploy ContentRegistry
    ContentRegistry = await hre.ethers.getContractFactory("ContentRegistry");
    registry = await ContentRegistry.deploy(treasury.address);
    await registry.waitForDeployment();

    // Deploy MockUSDC
    MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();

    // Register MockUSDC in ContentRegistry
    await registry.setSupportedToken(await usdc.getAddress(), true, 6);

    // Fund reader with MockUSDC
    await usdc.mintFaucet(reader.address, 1000 * 10**6); // 1,000 USDC
  });

  describe("Publishing Articles", function () {
    it("should allow an author to publish an article", async function () {
      const tx = await registry.connect(author).publishArticle(
        "Autonomous Agents in Web3",
        "ipfs://bafytest123",
        150, // $1.50
        "AI Native"
      );
      await tx.wait();

      expect(await registry.articleCounter()).to.equal(1);
      const article = await registry.getArticle(1);
      expect(article.title).to.equal("Autonomous Agents in Web3");
      expect(article.author).to.equal(author.address);
      expect(article.priceUsdCents).to.equal(150);
      expect(article.category).to.equal("AI Native");
      expect(article.active).to.equal(true);

      const stats = await registry.writerStats(author.address);
      expect(stats.totalArticles).to.equal(1);
    });

    it("should allow author to update price and active status", async function () {
      await registry.connect(author).publishArticle("Title", "uri", 100, "Tech");
      await registry.connect(author).updatePrice(1, 250);
      let article = await registry.getArticle(1);
      expect(article.priceUsdCents).to.equal(250);

      await registry.connect(author).setActive(1, false);
      article = await registry.getArticle(1);
      expect(article.active).to.equal(false);
    });

    it("should reject non-author from updating price", async function () {
      await registry.connect(author).publishArticle("Title", "uri", 100, "Tech");
      await expect(
        registry.connect(other).updatePrice(1, 200)
      ).to.be.revertedWith("Only author authorized");
    });
  });

  describe("Purchasing with Native BOT Token", function () {
    beforeEach(async function () {
      // Publish an article for $2.00 (200 cents)
      // botUsdPriceCents is default 100 ($1.00 per BOT)
      // So 200 cents requires 2 BOT = 2 * 10^18 wei
      await registry.connect(author).publishArticle(
        "DePIN Networks on BOT Chain",
        "ipfs://depin789",
        200,
        "DePIN"
      );
    });

    it("should calculate correct required BOT amount", async function () {
      const required = await registry.calculateBotAmount(200);
      expect(required).to.equal(hre.ethers.parseEther("2.0"));
    });

    it("should execute purchase with BOT and split 3% platform fee", async function () {
      const requiredBot = hre.ethers.parseEther("2.0");
      const expectedFee = (requiredBot * 300n) / 10000n; // 0.06 BOT
      const expectedAuthor = requiredBot - expectedFee;  // 1.94 BOT

      const initialAuthorBal = await hre.ethers.provider.getBalance(author.address);
      const initialTreasuryBal = await hre.ethers.provider.getBalance(treasury.address);

      // Reader buys with exact amount
      const tx = await registry.connect(reader).purchaseWithBOT(1, { value: requiredBot });
      await tx.wait();

      const finalAuthorBal = await hre.ethers.provider.getBalance(author.address);
      const finalTreasuryBal = await hre.ethers.provider.getBalance(treasury.address);

      expect(finalAuthorBal - initialAuthorBal).to.equal(expectedAuthor);
      expect(finalTreasuryBal - initialTreasuryBal).to.equal(expectedFee);

      // Verify purchase record
      expect(await registry.hasPurchased(1, reader.address)).to.equal(true);
      const purchasedArticles = await registry.getPurchasedArticles(reader.address);
      expect(purchasedArticles.length).to.equal(1);
      expect(purchasedArticles[0]).to.equal(1);
    });

    it("should refund excess BOT sent", async function () {
      const requiredBot = hre.ethers.parseEther("2.0");
      const overpaid = hre.ethers.parseEther("3.0");

      const balanceBefore = await hre.ethers.provider.getBalance(reader.address);
      const tx = await registry.connect(reader).purchaseWithBOT(1, { value: overpaid });
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      const balanceAfter = await hre.ethers.provider.getBalance(reader.address);

      // Reader balance should only have decreased by requiredBot (2 BOT) + gas
      expect(balanceBefore - balanceAfter - gasUsed).to.equal(requiredBot);
    });

    it("should prevent duplicate purchase", async function () {
      const requiredBot = hre.ethers.parseEther("2.0");
      await registry.connect(reader).purchaseWithBOT(1, { value: requiredBot });

      await expect(
        registry.connect(reader).purchaseWithBOT(1, { value: requiredBot })
      ).to.be.revertedWith("Already purchased");
    });
  });

  describe("Purchasing with ERC-20 Token (MockUSDC)", function () {
    beforeEach(async function () {
      // 150 cents = $1.50 = 1,500,000 units (6 decimals)
      await registry.connect(author).publishArticle(
        "Tokenized Micropayments",
        "ipfs://usdc123",
        150,
        "Payments"
      );
    });

    it("should transfer USDC and split 3% platform fee", async function () {
      const usdcAddress = await usdc.getAddress();
      const tokenAmount = 150n * 10000n; // 1.50 USDC = 1,500,000 units
      const expectedFee = (tokenAmount * 300n) / 10000n; // 45,000 units ($0.045)
      const expectedWriter = tokenAmount - expectedFee; // 1,455,000 units ($1.455)

      // Reader approves registry
      await usdc.connect(reader).approve(await registry.getAddress(), tokenAmount);

      await registry.connect(reader).purchaseWithToken(1, usdcAddress);

      expect(await usdc.balanceOf(treasury.address)).to.equal(expectedFee);
      expect(await usdc.balanceOf(author.address)).to.equal(expectedWriter);
      expect(await registry.hasPurchased(1, reader.address)).to.equal(true);
    });
  });

  describe("Views and Stats", function () {
    it("author automatically has access", async function () {
      await registry.connect(author).publishArticle("Author Piece", "uri", 100, "Art");
      expect(await registry.hasPurchased(1, author.address)).to.equal(true);
    });

    it("returns correct platform stats", async function () {
      await registry.connect(author).publishArticle("Article 1", "uri1", 100, "Tech");
      await registry.connect(author).publishArticle("Article 2", "uri2", 200, "Crypto");

      const required1 = await registry.calculateBotAmount(100);
      await registry.connect(reader).purchaseWithBOT(1, { value: required1 });

      const [totalArticles, totalPurchases, totalRev] = await registry.getPlatformStats();
      expect(totalArticles).to.equal(2);
      expect(totalPurchases).to.equal(1);
      expect(totalRev).to.equal((100n * 300n) / 10000n); // 3 cents
    });
  });
});
