import deployedAddresses from './deployed-addresses.json';

export const contractAddresses = {
  glamoraHub: deployedAddresses.GlamoraHub,
  creatorProfile: deployedAddresses.CreatorProfile,
  contentPayment: deployedAddresses.ContentPayment,
};

// Moonbase Alpha testnet configuration
export const CHAIN_CONFIG = {
  chainId: 1287,
  chainName: 'Moonbase Alpha',
  rpcUrl: 'https://rpc.api.moonbase.moonbeam.network',
  blockExplorer: 'https://moonbase.moonscan.io',
  nativeCurrency: {
    name: 'DEV',
    symbol: 'DEV',
    decimals: 18,
  },
};
