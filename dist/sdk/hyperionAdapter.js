import { scriptComposer } from '@moar-market/sdk/composer';
import { useAptosConfig, useAptos } from '@moar-market/sdk';
import { getAllPositionsView, get_position_info } from '@moar-market/sdk/protocols/hyperion';
import { addLiquidityOptimally as addLiqOpt, removeLiquidity as removeLiq } from '@moar-market/sdk/composer-strategies/protocols/hyperion';
import { Account, Ed25519PrivateKey, PrivateKey, PrivateKeyVariants } from '@aptos-labs/ts-sdk';
export async function getSender() {
    if (!process.env.PRIVATE_KEY)
        throw new Error('PRIVATE_KEY not set');
    const pkString = PrivateKey.formatPrivateKey(process.env.PRIVATE_KEY, PrivateKeyVariants.Ed25519);
    return Account.fromPrivateKey({ privateKey: new Ed25519PrivateKey(pkString) });
}
export async function executeTransaction(tx) {
    const aptos = useAptos();
    const senderAuthenticator = aptos.transaction.sign({ signer: await getSender(), transaction: tx });
    const submitted = await aptos.transaction.submit.simple({ transaction: tx, senderAuthenticator });
    return aptos.waitForTransaction({ transactionHash: submitted.hash });
}
export async function getActiveAPTUSDCPosition(creditAccount, pool) {
    const positions = await getAllPositionsView(creditAccount);
    return positions.find((x) => x.pool === pool) ?? positions[0] ?? null;
}
export function roundToSpacing(tick, spacing = 1) { return Math.round(tick / spacing) * spacing; }
export function pctToHalfWidthTicks(centerTickOrPrice, widthPct, spacing = 1) {
    const halfApprox = Math.floor(Math.log(1 + widthPct) / Math.log(1.0001));
    return Math.max(spacing, Math.floor(halfApprox / spacing) * spacing);
}
export async function composeRangeExit({ creditAccount, pool, tokenAPT, tokenUSDC, feeTier, lower, upper, fundUSDCu64, }) {
    const config = useAptosConfig();
    const sender = (await getSender()).accountAddress;
    const p = await getActiveAPTUSDCPosition(creditAccount, pool);
    if (!p)
        throw new Error('no hyperion position');
    const info = await get_position_info(p.position_object, p.pool);
    return scriptComposer({
        config,
        sender,
        builder: async (b) => {
            await removeLiq(b, creditAccount, {
                position_v3: p.position_object,
                liquidityDelta: info.liquidity,
                tokenA: tokenAPT,
                tokenB: tokenUSDC,
                feeTier,
                minAmountA: 0n,
                minAmountB: 0n,
            });
            // Single-sided USDC funding into APT–USDC band (router will compute optimal split)
            await addLiqOpt(b, creditAccount, {
                tickLower: lower,
                tickUpper: upper,
                tokenA: tokenAPT, // tokenA = APT (8dp)
                tokenB: tokenUSDC, // tokenB = USDC (6dp)
                feeTier,
                amountA: 0n, // APT from vault if available (0n by default)
                amountB: fundUSDCu64, // fund from USDC side
                minAmountA: 0n,
                minAmountB: 0n,
            });
            return b;
        },
    });
}
