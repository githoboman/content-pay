// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockUSDC
 * @dev Test ERC-20 token simulating USDC (6 decimals) with mint function for Bohr Testnet & local dev
 */
contract MockUSDC {
    string public name = "Mock USD Coin";
    string public symbol = "USDC";
    uint8 public decimals = 6;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor() {
        // Mint 100,000 USDC to deployer
        _mint(msg.sender, 100_000 * 10**6);
    }

    function transfer(address recipient, uint256 amount) external returns (bool) {
        _transfer(msg.sender, recipient, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool) {
        uint256 currentAllowance = allowance[sender][msg.sender];
        require(currentAllowance >= amount, "ERC20: transfer amount exceeds allowance");
        allowance[sender][msg.sender] = currentAllowance - amount;

        _transfer(sender, recipient, amount);
        return true;
    }

    /**
     * @notice Free faucet function to claim 100 mock USDC for testing
     */
    function mintFaucet(address recipient, uint256 amount) external {
        _mint(recipient, amount);
    }

    function _transfer(address sender, address recipient, uint256 amount) internal {
        require(sender != address(0), "ERC20: transfer from zero address");
        require(recipient != address(0), "ERC20: transfer to zero address");
        require(balanceOf[sender] >= amount, "ERC20: transfer exceeds balance");

        balanceOf[sender] -= amount;
        balanceOf[recipient] += amount;
        emit Transfer(sender, recipient, amount);
    }

    function _mint(address account, uint256 amount) internal {
        require(account != address(0), "ERC20: mint to zero address");
        totalSupply += amount;
        balanceOf[account] += amount;
        emit Transfer(address(0), account, amount);
    }
}
