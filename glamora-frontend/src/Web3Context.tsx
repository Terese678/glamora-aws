import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import GlamoraHubABI from './contracts/GlamoraHub.json';
import ContentPaymentABI from './contracts/ContentPayment.json';

const CREATOR_HUB_ADDRESS = '0x4fe1D1b42E734c52365C0DdF2C94bf34f6e07115';
const CONTENT_PAYMENT_ADDRESS = '0x86eC3e58B69e9975d572d099814c2F470E18b2e6';

interface Web3ContextType {
  account: string | null;
  hub: ethers.Contract | null;
  contentPayment: ethers.Contract | null;
  connectWallet: () => Promise<void>;
  isConnected: boolean;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const Web3Provider = ({ children }: { children: ReactNode }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [hub, setHub] = useState<ethers.Contract | null>(null);
  const [contentPayment, setContentPayment] = useState<ethers.Contract | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask!');
      return;
    }

    try {
      console.log('🔌 Requesting wallet connection...');
      
      // Request accounts
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      
      const userAccount = accounts[0];
      console.log('✅ Connected account:', userAccount);
      
      // Switch to Moonbase Alpha network
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x507' }], // 1287 in hex
        });
        console.log('✅ Switched to Moonbase Alpha');
      } catch (switchError: any) {
        // Chain not added, add it
        if (switchError.code === 4902) {
          console.log('📡 Adding Moonbase Alpha network...');
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x507',
              chainName: 'Moonbase Alpha',
              rpcUrls: ['https://rpc.api.moonbase.moonbeam.network'],
              nativeCurrency: {
                name: 'DEV',
                symbol: 'DEV',
                decimals: 18
              },
              blockExplorerUrls: ['https://moonbase.moonscan.io']
            }]
          });
          console.log('✅ Moonbase Alpha network added');
        }
      }
      
      setAccount(userAccount);
      setIsConnected(true);

      // Initialize provider and contracts
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const hubContract = new ethers.Contract(
        CREATOR_HUB_ADDRESS,
        GlamoraHubABI.abi || GlamoraHubABI,
        signer
      );

      const paymentContract = new ethers.Contract(
        CONTENT_PAYMENT_ADDRESS,
        ContentPaymentABI.abi || ContentPaymentABI,
        signer
      );

      setHub(hubContract);
      setContentPayment(paymentContract);
      
      console.log('✅ Contracts initialized');
      console.log('✅ Web3 fully connected!');
      
    } catch (error) {
      console.error('❌ Error connecting wallet:', error);
      alert('Failed to connect wallet: ' + (error as Error).message);
    }
  };

  // Auto-connect if already connected
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            console.log('🔄 Auto-connecting to existing session...');
            connectWallet();
          }
        });
    }
  }, []);

  return (
    <Web3Context.Provider value={{ account, hub, contentPayment, connectWallet, isConnected }}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) throw new Error('useWeb3 must be used within Web3Provider');
  return context;
};
