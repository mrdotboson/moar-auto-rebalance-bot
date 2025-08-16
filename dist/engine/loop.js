import { getCurrentTickAndSqrt } from '../sdk/poolState.js';
import { get_position_info, getAllPositionsView } from '@moar-market/sdk/protocols/hyperion';
import { composeRangeExit, roundToSpacing, pctToHalfWidthTicks, executeTransaction } from '../sdk/hyperionAdapter.js';
let cooldownUntil = 0;
export async function step(cfg) {
    if (Date.now() < cooldownUntil)
        return { ok: true, action: 'cooldown' };
    const eps = 1; // hysteresis (tickSpacing=1 for feeTier=1)
    const { tick } = await getCurrentTickAndSqrt(cfg.pool);
    const positions = await getAllPositionsView(cfg.creditAccount);
    const p = positions.find((x) => x.pool === cfg.pool) ?? positions[0];
    if (!p)
        return { ok: false, reason: 'no_position' };
    const info = await get_position_info(p.position_object, p.pool);
    const outside = tick <= (info.tick_lower - eps) || tick >= (info.tick_upper + eps);
    if (!outside)
        return { ok: true, action: 'idle' };
    const center = roundToSpacing(tick, 1);
    const half = Math.max(cfg.liquidity.minWidthTicks, pctToHalfWidthTicks(center, cfg.liquidity.widthPct, 1));
    const lower = center - half, upper = center + half;
    const tx = await composeRangeExit({
        creditAccount: cfg.creditAccount,
        pool: cfg.pool,
        tokenAPT: cfg.tokenAPT,
        tokenUSDC: cfg.tokenUSDC,
        feeTier: cfg.feeTier,
        lower, upper,
        fundUSDCu64: BigInt(Math.floor(cfg.liquidity.notionalUSDC * 1e6)),
    });
    const res = await executeTransaction(tx);
    cooldownUntil = Date.now() + 3000;
    return { ok: true, action: 'rebalanced', txHash: res.hash, lower, upper, tick };
}
