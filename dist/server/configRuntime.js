import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
const schema = z.object({
    rpcUrl: z.string().url(),
    creditAccount: z.string(),
    pool: z.string(),
    tokenAPT: z.string(),
    tokenUSDC: z.string(),
    feeTier: z.number(),
    liquidity: z.object({
        notionalUSDC: z.number().positive(),
        widthPct: z.number().positive(),
        minWidthTicks: z.number().int().positive(),
        slippageBps: z.number().nonnegative(),
        maxGasAPT: z.number().nonnegative(),
    }),
    strategy: z.object({
        collectOnExit: z.boolean(),
        compoundFees: z.boolean(),
    }),
    ops: z.object({ pollSec: z.number().positive(), maxDailyTx: z.number(), errorPause: z.boolean() }),
});
const CONFIG_PATH = path.resolve(process.cwd(), 'config.json');
let cached = load();
function load() {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return schema.parse(parsed);
}
export function getConfig() { return cached; }
export function setConfig(next) { cached = schema.parse(next); fs.writeFileSync(CONFIG_PATH, JSON.stringify(cached, null, 2)); }
fs.watchFile(CONFIG_PATH, { interval: 1000 }, () => { try {
    cached = load();
}
catch { /* ignore */ } });
