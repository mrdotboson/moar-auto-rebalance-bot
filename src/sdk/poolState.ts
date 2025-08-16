import type { Address } from '../shared/types.js';
import { hyperion_pool_v3_abi } from '@moar-market/sdk/abis';
import { useSurfClient } from '@moar-market/sdk/clients';
import { getModuleAddress } from '@moar-market/sdk/config';
import { getPoolData } from '@moar-market/sdk/protocols/hyperion';
import { get_price_from_sqrt_price_x64 } from '@moar-market/sdk/protocols/hyperion';

export async function getCurrentTickAndSqrt(pool: Address) {
  const moduleAddress = getModuleAddress('hyperion_pool_v3');
  const [tick, sqrt] = await useSurfClient().useABI(hyperion_pool_v3_abi, moduleAddress)
    .view.current_tick_and_price({ typeArguments: [], functionArguments: [pool as any] });
  return { tick: Number(tick), sqrtPriceX64: BigInt(sqrt) };
}

// For APT–USDC we must account for decimals: APT=8, USDC=6; lens returns 1e8 price
export async function getMidPrice1e8(pool: Address, tokenAPT: Address, tokenUSDC: Address): Promise<bigint> {
  const { sqrtPriceX64 } = await getCurrentTickAndSqrt(pool);
  return get_price_from_sqrt_price_x64(sqrtPriceX64, tokenAPT as any, tokenUSDC as any); // 1e8 decimals, APT priced in USDC
}

export async function getPoolSnapshot(pool: Address) {
  const g = await getPoolData(pool as any);
  return {
    tvlUSD: g.tvlUSD,
    feesUSD24h: g.feesUSD,
    volumeUSD24h: g.dailyVolumeUSD,
    feeAPR: g.feeAPR,
    farmAPR: g.farmAPR,
    graphTick: g.pool.currentTick,
    graphSqrtPrice: BigInt(g.pool.sqrtPrice),
    feeTier: g.pool.feeTier,
  };
}


