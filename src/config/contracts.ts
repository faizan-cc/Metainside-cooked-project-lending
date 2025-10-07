export const CONTRACT_ADDRESSES = {
  lendingPool: import.meta.env.VITE_LENDING_POOL_ADDRESS || '0x6b93F6F4e601dd1d5C99b5Db4F5fc10E0068A0Be',
  reputationOracle: import.meta.env.VITE_REPUTATION_ORACLE_ADDRESS || '0xeae7d0Eb4f103230f2d370A8aeE657bd91Abf330',
  usdc: import.meta.env.VITE_USDC_ADDRESS || '0x3Eb8145DCCD22489Bb64E425De53406C2aE29a72'
};

export const CHAIN_CONFIG = {
  chainId: parseInt(import.meta.env.VITE_CHAIN_ID || '84532'),
  rpcUrl: import.meta.env.VITE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'
};
