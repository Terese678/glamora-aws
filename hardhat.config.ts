import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    // Local Hardhat network for testing
    hardhat: {
      chainId: 1281
    },
    
    // Moonbase Alpha Testnet (Polkadot)
    moonbase: {
      url: "https://rpc.api.moonbase.moonbeam.network",
      chainId: 1287,
      accounts: process.env.MOONBEAM_PRIVATE_KEY 
        ? [process.env.MOONBEAM_PRIVATE_KEY]
        : [],
      gas: 5000000,
      gasPrice: 1000000000, // 1 Gwei
    }
  },
  etherscan: {
    apiKey: {
      moonbaseAlpha: "no-api-key-needed" // Moonbeam doesn't need API key
    }
  }
};

export default config;