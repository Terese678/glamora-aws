import axios from 'axios';

const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_SECRET_KEY = import.meta.env.VITE_PINATA_SECRET_KEY;

export const uploadToIPFS = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const metadata = JSON.stringify({
      name: file.name,
      keyvalues: {
        platform: 'Glamora',
        timestamp: Date.now().toString()
      }
    });
    formData.append('pinataMetadata', metadata);

    const options = JSON.stringify({
      cidVersion: 0,
    });
    formData.append('pinataOptions', options);

    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        maxBodyLength: Infinity,
        headers: {
          'Content-Type': `multipart/form-data`,
          'pinata_api_key': PINATA_API_KEY,
          'pinata_secret_api_key': PINATA_SECRET_KEY
        }
      }
    );

    console.log('✅ File uploaded to IPFS:', response.data.IpfsHash);
    return response.data.IpfsHash;
  } catch (error) {
    console.error('❌ Error uploading to IPFS:', error);
    throw new Error('Failed to upload to IPFS');
  }
};

export const getIPFSUrl = (hash: string): string => {

  const cleanHash = hash.replace('ipfs://', '');
  
  // Use Pinata's public gateway
  return `https://gateway.pinata.cloud/ipfs/${cleanHash}`;
};

