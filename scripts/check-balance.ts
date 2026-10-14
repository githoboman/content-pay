
const ADDRESS = "ST1V1SKKEMNCPF6CT7N303852M2ANKKKGY9PTZTJX";

async function checkBalance() {
    console.log(`Checking balance for ${ADDRESS}...`);
    try {
        const response = await fetch(`https://api.testnet.hiro.so/extended/v1/address/${ADDRESS}/balances`);
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }
        const data = await response.json();
        const stx = data.stx;

        console.log(`\n---------------------------------`);
        console.log(`Balance: ${stx.balance / 1000000} STX`);
        console.log(`Locked: ${stx.locked / 1000000} STX`);
        console.log(`---------------------------------\n`);

        if (BigInt(stx.balance) < 500000n) {
            console.log("❌ WARNING: Less than 0.5 STX. Cannot deploy.");
        } else {
            console.log("✅ Sufficient funds for at least one deployment.");
        }
    } catch (e) {
        console.error("Error fetching balance:", e);
    }
}

checkBalance();
