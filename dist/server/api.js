import Fastify from 'fastify';
import { getConfig, setConfig } from './configRuntime.js';
import { step } from '../engine/loop.js';
import { getCurrentTickAndSqrt, getPoolSnapshot } from '../sdk/poolState.js';
export async function createServer() {
    const app = Fastify({ logger: true });
    app.get('/config', async () => getConfig());
    app.post('/config', async (req, res) => {
        const next = req.body;
        setConfig(next);
        return { ok: true };
    });
    app.get('/status', async () => {
        const cfg = getConfig();
        const [{ tick }, snap] = await Promise.all([
            getCurrentTickAndSqrt(cfg.pool),
            getPoolSnapshot(cfg.pool),
        ]);
        return {
            paused: false,
            tick,
            poolStats: snap,
            config: cfg,
        };
    });
    app.post('/actions/rebalance', async () => {
        const out = await step(getConfig());
        return out;
    });
    return app;
}
