import type { HardhatUserConfig } from "hardhat/config";

import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { SensitiveString } from "hardhat/types/config";
import * as dotenv from "dotenv";
dotenv.config();

console.log(`process.env.BASESCAN_API_KEY`);
console.log(process.env.BASESCAN_API_KEY);
console.log(`process.env.BASESCAN_API_KEY`);

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxViemPlugin],
  verify: {
    etherscan: {
      apiKey: process.env.BASESCAN_API_KEY as SensitiveString,
      // customChains: [
      //   {
      //     network: "baseSepolia",
      //     chainId: 84532,
      //     urls: {
      //       apiURL: "https://api-sepolia.basescan.org",
      //       browserURL: "https://sepolia.basescan.org",
      //     },
      //   },
      // ],
    },
  },
  solidity: {
    profiles: {
      default: {
        version: "0.8.20",
      },
      production: {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    baseSepolia: {
      type: "http",
      chainType: "op",
      url: process.env.SEPOLIA_RPC_URL as SensitiveString,
      accounts: [process.env.PRIVATE_KEY as SensitiveString],
    },
  },
};

export default config;
