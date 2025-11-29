import axios from 'axios';

const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_SECRET_KEY = import.meta.env.VITE_PINATA_SECRET_KEY;

export const uploadToIPFS = async (file: File): Promise<string> => {
  try {
    console.log('📤 Uploading to IPFS...');
    console.log('🔑 API Key exists:', !!PINATA_API_KEY);
    console.log('🔑 Secret exists:', !!PINATA_SECRET_KEY);
    console.log('📁 File:', file.name, file.size, 'bytes');

    const formData = new FormData();
    formData.append('file', file);

    // ✅ USE API KEY + SECRET (Old method but reliable)
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        headers: {
          'pinata_api_key': PINATA_API_KEY,
          'pinata_secret_api_key': PINATA_SECRET_KEY,
        },
        maxBodyLength: Infinity,
      }
    );

    console.log('✅ Upload successful!');
    console.log('IPFS Hash:', response.data.IpfsHash);
    
    return response.data.IpfsHash;
  } catch (error: any) {
    console.error('❌ UPLOAD FAILED');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data);
    console.error('Message:', error.message);
    throw new Error('Failed to upload to IPFS');
  }
};

export const getIPFSUrl = (cid: string): string => {
  return `https://gateway.pinata.cloud/ipfs/${cid}`;
};
