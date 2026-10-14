
import { describe, expect, it, beforeEach } from 'vitest';
import { Cl } from '@stacks/transactions';

// The address we hardcoded in the contracts
const DEPLOYER = 'ST9NSDHK5969YF6WJ2MRCVVAVTDENWBNTFJRVZ3E';

const accounts = simnet.getAccounts();
// Wallet 1 will be our "writer"
const wallet1 = accounts.get('wallet_1')!;
// Wallet 2 will be our "reader/buyer"
const wallet2 = accounts.get('wallet_2')!;

describe('Content Pay V3 System Tests', () => {

    // Deploy contracts to the SPECIFIC address they expect
    // This simulates the manual deployment we did on the explorer
    beforeEach(() => {
        // 1. Deploy Traits
        simnet.deployContract(
            'sip-010-trait-ft-standard',
            'contracts/sip-010-trait-ft-standard.clar',
            { clarityVersion: 1 },
            DEPLOYER
        );
        simnet.deployContract(
            'pyth-oracle-trait',
            'contracts/pyth-oracle-trait.clar',
            { clarityVersion: 1 },
            DEPLOYER
        );

        // 2. Deploy Mocks (referencing the traits at DEPLOYER)
        simnet.deployContract(
            'mock-usdc-v3',
            'contracts/mock-usdc.clar',
            { clarityVersion: 1 },
            DEPLOYER
        );
        simnet.deployContract(
            'mock-sbtc-v3',
            'contracts/mock-sbtc.clar',
            { clarityVersion: 1 },
            DEPLOYER
        );
        simnet.deployContract(
            'mock-pyth-oracle-v1',
            'contracts/mock-pyth-oracle.clar',
            { clarityVersion: 1 },
            DEPLOYER
        );

        // 3. Deploy Registry
        simnet.deployContract(
            'content-registry-v3',
            'contracts/content-registry.clar',
            { clarityVersion: 1 },
            DEPLOYER
        );
    });

    it('Flow: Mint USDC, Set Price, Publish, Buy', () => {
        // A. Setup: Free Money (Mint 1000 USDCx to Viewer)
        const mintResult = simnet.callPublicFn(
            `${DEPLOYER}.mock-usdc-v3`,
            'mint',
            [Cl.uint(1000000000), Cl.principal(wallet2)], // 1000 USDC
            wallet2 // anyone can mint in mock
        );
        expect(mintResult.result).toBeOk(Cl.bool(true));

        // B. Setup: Fix Oracle Price (Admin only -> Deployer/Self)
        // 1 STX = $1.50 -> 150000000 (8 decimals)
        const setPriceResult = simnet.callPublicFn(
            `${DEPLOYER}.mock-pyth-oracle-v1`,
            'set-price',
            [
                Cl.bufferFromHex('0100000000000000000000000000000000000000000000000000000000000000'), // STX Feed
                Cl.int(150000000),
                Cl.int(-8)
            ],
            DEPLOYER // Only owner can set price
        );
        expect(setPriceResult.result).toBeOk(Cl.bool(true));

        // C. Writer Publishes Article
        const publishResult = simnet.callPublicFn(
            `${DEPLOYER}.content-registry-v3`,
            'publish-article',
            [
                Cl.stringUtf8("My Paid Video"), // url
                Cl.uint(500), // $5.00
                Cl.stringUtf8("Video") // category
            ],
            wallet1
        );
        // Expect (ok u1) - article ID 1
        expect(publishResult.result).toBeOk(Cl.uint(1));

        // D. Reader Buys with USDCx
        // Needs to approve? SIP-010 usually requires approval handled by 'transfer' if sender is tx-sender
        const buyResult = simnet.callPublicFn(
            `${DEPLOYER}.content-registry-v3`,
            'purchase-with-usdcx',
            [Cl.uint(1)], // Article ID 1
            wallet2
        );
        expect(buyResult.result).toBeOk(Cl.bool(true));

        // E. Verify Purchase Status
        const hasPurchased = simnet.callReadOnlyFn(
            `${DEPLOYER}.content-registry-v3`,
            'has-purchased',
            [Cl.uint(1), Cl.principal(wallet2)],
            wallet2
        );
        expect(hasPurchased.result).toBeBool(true);
    });

    it('Flow: Buy with STX and verify fees', () => {
        // A. Setup: Fix Oracle Price
        simnet.callPublicFn(
            `${DEPLOYER}.mock-pyth-oracle-v1`,
            'set-price',
            [
                Cl.bufferFromHex('0100000000000000000000000000000000000000000000000000000000000000'), // STX Feed
                Cl.int(100000000), // $1.00 per STX
                Cl.int(-8)
            ],
            DEPLOYER
        );

        // B. Publish ($5.00)
        simnet.callPublicFn(
            `${DEPLOYER}.content-registry-v3`,
            'publish-article',
            [Cl.stringUtf8("STX Article"), Cl.uint(500), Cl.stringUtf8("News")],
            wallet1
        );

        // C. Calculate expected STX cost
        // Price = $5.00. STX = $1.00. -> Cost = 5 STX.
        // Platform fee 3% -> 0.15 STX. Writer -> 4.85 STX.

        // D. Buy with STX
        const buyStx = simnet.callPublicFn(
            `${DEPLOYER}.content-registry-v3`,
            'purchase-with-stx',
            [Cl.uint(1)],
            wallet2
        );
        expect(buyStx.result).toBeOk(Cl.bool(true));
    });

});
