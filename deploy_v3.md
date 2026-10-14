# V3 Deployment Instructions (COMPLETE GUIDE)

**Wallet:** `ST1V1SKKEMNCPF6CT7N303852M2ANKKKGY9PTZTJX`

Follow these steps exactly to deploy a fresh, working environment.

## Part 1: Traits (Dependencies)

### 1. Deploy SIP-010 Trait
**Contract Name:** `sip-010-trait-ft-standard`
**Code:**
```clarity
(define-trait sip-010-trait
  (
    (transfer? (uint principal principal (optional (buff 34))) (response bool uint))
    (get-name () (response (string-ascii 32) uint))
    (get-symbol () (response (string-ascii 32) uint))
    (get-decimals () (response uint uint))
    (get-balance (principal) (response uint uint))
    (get-total-supply () (response uint uint))
    (get-token-uri () (response (optional (string-utf8 256)) uint))
  )
)
```

### 2. Deploy Pyth Oracle Trait
**Contract Name:** `pyth-oracle-trait`
**Code:**
```clarity
(define-trait pyth-oracle-trait
  (
    (read-price-feed ((buff 32) (optional (buff 32))) (response { price: int, expo: int, timestamp: uint } uint))
  )
)
```

---

## Part 2: Mock Contracts

### 3. Deploy USDCx V3
**Contract Name:** `mock-usdc-v3`
**Code:**
```clarity
;; mock-usdc-v3
(impl-trait 'ST1V1SKKEMNCPF6CT7N303852M2ANKKKGY9PTZTJX.sip-010-trait-ft-standard.sip-010-trait)

(define-fungible-token mock-usdc)

(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-token-owner (err u101))

(define-public (transfer? (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
    (begin
        (asserts! (is-eq tx-sender sender) err-not-token-owner)
        (try! (ft-transfer? mock-usdc amount sender recipient))
        (match memo to-print (print to-print) 0x)
        (ok true)
    )
)

(define-read-only (get-name) (ok "Mock USDC"))
(define-read-only (get-symbol) (ok "mUSDC"))
(define-read-only (get-decimals) (ok u6))
(define-read-only (get-balance (who principal)) (ok (ft-get-balance mock-usdc who)))
(define-read-only (get-total-supply) (ok (ft-get-supply mock-usdc)))
(define-read-only (get-token-uri) (ok none))

(define-public (mint (amount uint) (recipient principal))
    (begin
        (ft-mint? mock-usdc amount recipient)
    )
)
```

### 4. Deploy sBTC V3
**Contract Name:** `mock-sbtc-v3`
**Code:**
```clarity
;; mock-sbtc-v3
(impl-trait 'ST1V1SKKEMNCPF6CT7N303852M2ANKKKGY9PTZTJX.sip-010-trait-ft-standard.sip-010-trait)

(define-fungible-token mock-sbtc)

(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-token-owner (err u101))

(define-public (transfer? (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
    (begin
        (asserts! (is-eq tx-sender sender) err-not-token-owner)
        (try! (ft-transfer? mock-sbtc amount sender recipient))
        (match memo to-print (print to-print) 0x)
        (ok true)
    )
)

(define-read-only (get-name) (ok "Mock sBTC"))
(define-read-only (get-symbol) (ok "sBTC"))
(define-read-only (get-decimals) (ok u8))
(define-read-only (get-balance (who principal)) (ok (ft-get-balance mock-sbtc who)))
(define-read-only (get-total-supply) (ok (ft-get-supply mock-sbtc)))
(define-read-only (get-token-uri) (ok none))

(define-public (mint (amount uint) (recipient principal))
    (begin
        (ft-mint? mock-sbtc amount recipient)
    )
)
```

### 5. Deploy Pyth Oracle V1
**Contract Name:** `mock-pyth-oracle-v1`
**Code:**
```clarity
;; mock-pyth-oracle-v1
(impl-trait 'ST1V1SKKEMNCPF6CT7N303852M2ANKKKGY9PTZTJX.pyth-oracle-trait.pyth-oracle-trait)

(define-constant ERR-NOT-AUTHORIZED (err u100))

(define-data-var contract-owner principal tx-sender)

(define-map price-feeds (buff 32) { price: int, expo: int, timestamp: uint })

(define-read-only (read-price-feed (feed-id (buff 32)) (vaa (optional (buff 32))))
  (ok (default-to 
    { price: 0, expo: 0, timestamp: u0 }
    (map-get? price-feeds feed-id)
  ))
)

(define-public (set-price (feed-id (buff 32)) (price int) (expo int))
  (begin
    (map-set price-feeds feed-id {
      price: price,
      expo: expo,
      timestamp: block-height
    })
    (ok true)
  )
)
```

---

## Part 3: Main Registry

### 6. Deploy Content Registry V3
**Contract Name:** `content-registry-v3`
**Code:**
*(Copy the full content of `contracts/content-registry.clar` from your codebase - it is already updated)*

---

## Part 4: Final Setup

1.  **Mint USDCx V3:**
    *   Call `mint` on `mock-usdc-v3`
    *   Amount: `1000000000` (1000 USDC)
    *   Recipient: Your Address

2.  **Initialize Oracle:**
    *   **Refresh your Localhost Article Page**
    *   Scroll down to "Testnet Admin Tools"
    *   Click "🔧 Fix STX Price" (This calls your new Oracle!)

3.  **Buy with USDCx:**
    *   The button should work now!
