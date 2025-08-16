export type U64 = string | number | bigint;
export type Address = string;

export type RuntimeConfig = {
  rpcUrl: string;
  creditAccount: Address;
  pool: Address;
  tokenAPT: Address;
  tokenUSDC: Address;
  feeTier: number; // 1
  liquidity: {
    notionalUSDC: number;
    widthPct: number;        // ±%
    minWidthTicks: number;
    slippageBps: number;
    maxGasAPT: number;
  };
  strategy: {
    collectOnExit: boolean;
    compoundFees: boolean;
  };
  ops: { pollSec: number; maxDailyTx: number; errorPause: boolean };
};


