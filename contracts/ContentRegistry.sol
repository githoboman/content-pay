// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @dev Interface for standard ERC20 token interactions
 */
interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function decimals() external view returns (uint8);
}

/**
 * @title ContentRegistry
 * @dev Decentralized Micropayment Content Platform native to BOT Chain.
 *      Enables writers and AI agents to publish content and readers to unlock articles
 *      instantly using native BOT / tBOT or ERC-20 tokens (e.g. USDC).
 *      Features ~0.75-second block time settlements, ultra-low fees, and ERC-8004 Agent OS integration.
 */
contract ContentRegistry {
    // --- State Variables ---
    address public owner;
    address public platformTreasury;
    uint256 public platformFeeBps = 300; // 3% fee (300 / 10000)
    
    // Price of 1 BOT in USD Cents (18 decimals BOT, 100 cents = $1.00 USD)
    // Default: 1 BOT = $1.00 USD (100 cents). Can be updated by owner or via oracle.
    uint256 public botUsdPriceCents = 100;

    uint256 public articleCounter;
    uint256 public totalPlatformPurchases;
    uint256 public totalPlatformRevenueUsdCents;

    struct Article {
        uint256 id;
        address author;
        string title;
        string contentUri;      // IPFS hash, Blob pointer, or metadata URI
        uint256 priceUsdCents;   // Price in USD cents (e.g. 100 = $1.00)
        string category;
        bool active;
        uint256 publishedAt;     // Timestamp
        uint256 publishedBlock;  // Block number
    }

    struct PurchaseInfo {
        bool purchased;
        uint256 paidAmount;
        address token;          // address(0) for native BOT
        uint256 purchasedAt;
    }

    struct WriterStats {
        uint256 totalArticles;
        uint256 totalEarningsUsdCents;
        uint256 totalPurchases;
    }

    struct ReaderStats {
        uint256 totalPurchases;
        uint256 totalSpentUsdCents;
    }

    // Article ID -> Article
    mapping(uint256 => Article) public articles;
    // Article ID -> Reader Address -> PurchaseInfo
    mapping(uint256 => mapping(address => PurchaseInfo)) public purchases;
    // Reader Address -> Array of purchased article IDs
    mapping(address => uint256[]) private readerPurchasedArticleIds;
    // Author Address -> Array of published article IDs
    mapping(address => uint256[]) private authorArticleIds;

    // Address -> WriterStats
    mapping(address => WriterStats) public writerStats;
    // Address -> ReaderStats
    mapping(address => ReaderStats) public readerStats;

    // Supported ERC20 tokens -> isSupported
    mapping(address => bool) public supportedTokens;
    mapping(address => uint8) public tokenDecimals;

    // Optional ERC-8004 AI Agent Registry Address on BOT Chain
    address public erc8004Registry;

    // --- Events ---
    event ArticlePublished(
        uint256 indexed articleId,
        address indexed author,
        string title,
        string contentUri,
        uint256 priceUsdCents,
        string category,
        uint256 timestamp
    );

    event ArticlePriceUpdated(uint256 indexed articleId, uint256 oldPrice, uint256 newPrice);
    event ArticleStatusChanged(uint256 indexed articleId, bool active);

    event ArticlePurchased(
        uint256 indexed articleId,
        address indexed reader,
        address indexed author,
        address token,
        uint256 amountPaid,
        uint256 usdPriceCents,
        uint256 platformFee,
        uint256 writerEarnings,
        uint256 timestamp
    );

    event BotUsdPriceUpdated(uint256 oldRate, uint256 newRate);
    event PlatformTreasuryUpdated(address oldTreasury, address newTreasury);
    event PlatformFeeUpdated(uint256 oldFeeBps, uint256 newFeeBps);
    event TokenSupportUpdated(address indexed token, bool supported, uint8 decimals);
    event ERC8004RegistryUpdated(address oldRegistry, address newRegistry);

    // --- Modifiers ---
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner authorized");
        _;
    }

    modifier onlyAuthor(uint256 articleId) {
        require(articles[articleId].id != 0, "Article does not exist");
        require(articles[articleId].author == msg.sender, "Only author authorized");
        _;
    }

    constructor(address _platformTreasury) {
        require(_platformTreasury != address(0), "Invalid treasury address");
        owner = msg.sender;
        platformTreasury = _platformTreasury;
    }

    // --- Publishing Logic ---

    /**
     * @notice Publish a new article or AI generated research piece
     * @param title Title of the content
     * @param contentUri IPFS hash, decentralized Blob pointer, or content locator
     * @param priceUsdCents Price in USD cents (e.g. 150 = $1.50)
     * @param category Topic category (Tech, Crypto, AI, DePIN, etc.)
     */
    function publishArticle(
        string memory title,
        string memory contentUri,
        uint256 priceUsdCents,
        string memory category
    ) external returns (uint256) {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(contentUri).length > 0, "Content URI cannot be empty");
        require(priceUsdCents > 0, "Price must be greater than 0");

        articleCounter++;
        uint256 newId = articleCounter;

        articles[newId] = Article({
            id: newId,
            author: msg.sender,
            title: title,
            contentUri: contentUri,
            priceUsdCents: priceUsdCents,
            category: category,
            active: true,
            publishedAt: block.timestamp,
            publishedBlock: block.number
        });

        authorArticleIds[msg.sender].push(newId);
        writerStats[msg.sender].totalArticles++;

        emit ArticlePublished(
            newId,
            msg.sender,
            title,
            contentUri,
            priceUsdCents,
            category,
            block.timestamp
        );

        return newId;
    }

    /**
     * @notice Update article price
     */
    function updatePrice(uint256 articleId, uint256 newPriceUsdCents) external onlyAuthor(articleId) {
        require(newPriceUsdCents > 0, "Price must be greater than 0");
        uint256 oldPrice = articles[articleId].priceUsdCents;
        articles[articleId].priceUsdCents = newPriceUsdCents;
        emit ArticlePriceUpdated(articleId, oldPrice, newPriceUsdCents);
    }

    /**
     * @notice Set article active status (unpublish or republish)
     */
    function setActive(uint256 articleId, bool active) external onlyAuthor(articleId) {
        articles[articleId].active = active;
        emit ArticleStatusChanged(articleId, active);
    }

    // --- Purchase Logic ---

    /**
     * @notice Calculate the amount of native BOT (in wei, 18 decimals) required for a given USD cent price
     * Formula: (priceUsdCents * 1e18) / botUsdPriceCents
     */
    function calculateBotAmount(uint256 priceUsdCents) public view returns (uint256) {
        require(botUsdPriceCents > 0, "BOT price not configured");
        return (priceUsdCents * 1e18) / botUsdPriceCents;
    }

    /**
     * @notice Purchase article access using native BOT / tBOT token
     * @param articleId The ID of the article to unlock
     */
    function purchaseWithBOT(uint256 articleId) external payable {
        Article memory article = articles[articleId];
        require(article.id != 0, "Article does not exist");
        require(article.active, "Article is inactive");
        require(!purchases[articleId][msg.sender].purchased, "Already purchased");

        uint256 requiredBot = calculateBotAmount(article.priceUsdCents);
        require(msg.value >= requiredBot, "Insufficient BOT sent");

        uint256 platformFee = (requiredBot * platformFeeBps) / 10000;
        uint256 writerAmount = requiredBot - platformFee;

        // Record purchase first (Checks-Effects-Interactions)
        purchases[articleId][msg.sender] = PurchaseInfo({
            purchased: true,
            paidAmount: requiredBot,
            token: address(0),
            purchasedAt: block.timestamp
        });
        readerPurchasedArticleIds[msg.sender].push(articleId);

        // Update statistics
        writerStats[article.author].totalEarningsUsdCents += article.priceUsdCents;
        writerStats[article.author].totalPurchases++;
        readerStats[msg.sender].totalSpentUsdCents += article.priceUsdCents;
        readerStats[msg.sender].totalPurchases++;
        totalPlatformPurchases++;
        totalPlatformRevenueUsdCents += (article.priceUsdCents * platformFeeBps) / 10000;

        // Transfers
        (bool feeSuccess, ) = payable(platformTreasury).call{value: platformFee}("");
        require(feeSuccess, "Treasury transfer failed");

        (bool authorSuccess, ) = payable(article.author).call{value: writerAmount}("");
        require(authorSuccess, "Author transfer failed");

        // Refund any excess msg.value
        if (msg.value > requiredBot) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: msg.value - requiredBot}("");
            require(refundSuccess, "Refund failed");
        }

        emit ArticlePurchased(
            articleId,
            msg.sender,
            article.author,
            address(0),
            requiredBot,
            article.priceUsdCents,
            platformFee,
            writerAmount,
            block.timestamp
        );
    }

    /**
     * @notice Purchase article access using supported ERC-20 token (e.g. USDC)
     * @param articleId The ID of the article to unlock
     * @param token Address of the ERC20 token
     */
    function purchaseWithToken(uint256 articleId, address token) external {
        require(supportedTokens[token], "Token not supported");
        Article memory article = articles[articleId];
        require(article.id != 0, "Article does not exist");
        require(article.active, "Article is inactive");
        require(!purchases[articleId][msg.sender].purchased, "Already purchased");

        uint8 decimals = tokenDecimals[token];
        // Calculate token amount: priceUsdCents has 2 decimals ($1.00 = 100 cents)
        // Token units = (priceUsdCents * 10^decimals) / 100
        uint256 tokenAmount = (article.priceUsdCents * (10 ** decimals)) / 100;
        uint256 platformFee = (tokenAmount * platformFeeBps) / 10000;
        uint256 writerAmount = tokenAmount - platformFee;

        // Record purchase
        purchases[articleId][msg.sender] = PurchaseInfo({
            purchased: true,
            paidAmount: tokenAmount,
            token: token,
            purchasedAt: block.timestamp
        });
        readerPurchasedArticleIds[msg.sender].push(articleId);

        // Update statistics
        writerStats[article.author].totalEarningsUsdCents += article.priceUsdCents;
        writerStats[article.author].totalPurchases++;
        readerStats[msg.sender].totalSpentUsdCents += article.priceUsdCents;
        readerStats[msg.sender].totalPurchases++;
        totalPlatformPurchases++;
        totalPlatformRevenueUsdCents += (article.priceUsdCents * platformFeeBps) / 10000;

        // Transfer tokens from reader to author and treasury
        IERC20 tokenContract = IERC20(token);
        require(tokenContract.transferFrom(msg.sender, platformTreasury, platformFee), "Treasury transfer failed");
        require(tokenContract.transferFrom(msg.sender, article.author, writerAmount), "Author transfer failed");

        emit ArticlePurchased(
            articleId,
            msg.sender,
            article.author,
            token,
            tokenAmount,
            article.priceUsdCents,
            platformFee,
            writerAmount,
            block.timestamp
        );
    }

    // --- View Functions ---

    /**
     * @notice Check if a reader has purchased an article (or is the author)
     */
    function hasPurchased(uint256 articleId, address reader) external view returns (bool) {
        if (articles[articleId].author == reader) {
            return true;
        }
        return purchases[articleId][reader].purchased;
    }

    /**
     * @notice Retrieve an article by ID
     */
    function getArticle(uint256 articleId) external view returns (Article memory) {
        require(articles[articleId].id != 0, "Article does not exist");
        return articles[articleId];
    }

    /**
     * @notice Get all active articles for feed browsing
     */
    function getAllArticles() external view returns (Article[] memory) {
        uint256 total = articleCounter;
        Article[] memory list = new Article[](total);
        for (uint256 i = 1; i <= total; i++) {
            list[i - 1] = articles[i];
        }
        return list;
    }

    /**
     * @notice Get all article IDs purchased by a reader
     */
    function getPurchasedArticles(address reader) external view returns (uint256[] memory) {
        return readerPurchasedArticleIds[reader];
    }

    /**
     * @notice Get all article IDs published by an author
     */
    function getArticlesByAuthor(address author) external view returns (uint256[] memory) {
        return authorArticleIds[author];
    }

    /**
     * @notice Retrieve overall platform metrics
     */
    function getPlatformStats() external view returns (
        uint256 totalArticles,
        uint256 totalPurchases,
        uint256 totalRevenueUsdCents
    ) {
        return (articleCounter, totalPlatformPurchases, totalPlatformRevenueUsdCents);
    }

    // --- Admin Functions ---

    function setPlatformTreasury(address _newTreasury) external onlyOwner {
        require(_newTreasury != address(0), "Invalid address");
        emit PlatformTreasuryUpdated(platformTreasury, _newTreasury);
        platformTreasury = _newTreasury;
    }

    function setPlatformFeeBps(uint256 _newFeeBps) external onlyOwner {
        require(_newFeeBps <= 1000, "Fee cannot exceed 10%");
        emit PlatformFeeUpdated(platformFeeBps, _newFeeBps);
        platformFeeBps = _newFeeBps;
    }

    function setBotUsdPriceCents(uint256 _newPriceCents) external onlyOwner {
        require(_newPriceCents > 0, "Price must be > 0");
        emit BotUsdPriceUpdated(botUsdPriceCents, _newPriceCents);
        botUsdPriceCents = _newPriceCents;
    }

    function setSupportedToken(address token, bool supported, uint8 decimals) external onlyOwner {
        require(token != address(0), "Invalid token");
        supportedTokens[token] = supported;
        tokenDecimals[token] = decimals;
        emit TokenSupportUpdated(token, supported, decimals);
    }

    function setERC8004Registry(address _registry) external onlyOwner {
        emit ERC8004RegistryUpdated(erc8004Registry, _registry);
        erc8004Registry = _registry;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid owner");
        owner = newOwner;
    }
}
