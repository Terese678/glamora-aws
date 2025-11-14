import { useState, useEffect } from 'react';
import { useWeb3 } from '../Web3Context';
import { uploadToIPFS, getIPFSUrl } from '../ipfsHelper';
import { ethers } from 'ethers';

interface CreatorDashboardProps {
  account: string;
}

const CreatorDashboard: React.FC<CreatorDashboardProps> = ({ account }) => {
  const { hub, contentPayment } = useWeb3();
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  
  const [registrationForm, setRegistrationForm] = useState({
    username: '',
    bio: ''
  });

  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    price: '',
    file: null as File | null
  });

  const [myContent, setMyContent] = useState<any[]>([]);

  useEffect(() => {
    checkIfRegistered();
  }, [account, hub]);

  const checkIfRegistered = async () => {
    if (!hub || !account) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const registered = await hub.isCreator(account);
      console.log('Is registered:', registered);
      setIsRegistered(registered);
      
      if (registered) {
        await loadMyContent();
      }
    } catch (error) {
      console.error('Error checking registration:', error);
    }
    setIsLoading(false);
  };

  const loadMyContent = async () => {
  if (!contentPayment || !account) {
    console.log('❌ ContentPayment contract or account not ready');
    return;
  }

  try {
    console.log('📥 Loading your content...');
    setIsLoadingContent(true);
    
    const nextId = await contentPayment.nextContentId();
    const totalContent = nextId.toNumber();
    console.log('📊 Total content on platform:', totalContent);
    
    const creatorContent: any[] = [];
    
    for (let i = 1; i < totalContent; i++) {
      try {
        const content = await contentPayment.getContent(i);
        
        if (content.creator.toLowerCase() === account.toLowerCase()) {
            // Skip test data with fake IPFS hashes
            if (content.contentHash.includes('QmTest')) {
              console.log('⏭️ Skipping test content:', content.title);
              continue;
            }
  
            creatorContent.push({
              id: i,
              title: content.title,
              description: content.description || 'No description',
              price: ethers.utils.formatEther(content.price),
              ipfsHash: content.contentHash,
              purchaseCount: content.purchaseCount ? content.purchaseCount.toNumber() : 0
            });
          }
      } catch (err) {
        console.log(`Skipping content ID ${i}:`, err);
      }
    }
    
    console.log('✅ Found', creatorContent.length, 'of your content items');
    setMyContent(creatorContent);
    
  } catch (error) {
    console.error('Error loading content:', error);
    setMyContent([]);
  } finally {
    setIsLoadingContent(false);
  }
};

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hub) {
      alert('Please connect your wallet first!');
      return;
    }
    
    setIsRegistering(true);
    try {
      const tx = await hub.registerCreator(registrationForm.username, registrationForm.bio);
      console.log('Transaction sent:', tx.hash);
      await tx.wait();
      console.log('Transaction confirmed!');
      alert('✨ Creator profile registered successfully!');
      setIsRegistered(true);
    } catch (error: any) {
      console.error('Error registering:', error);
      if (error.message.includes('already registered')) {
        alert('You are already registered as a creator!');
        setIsRegistered(true);
      } else {
        alert('Failed to register: ' + error.message);
      }
    }
    setIsRegistering(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadForm({ ...uploadForm, file: e.target.files[0] });
    }
  };

  const handleUploadContent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contentPayment || !uploadForm.file) {
      alert('Please select a file to upload!');
      return;
    }
    
    setIsUploading(true);
    try {
      // Step 1: Upload to IPFS
      console.log('📤 Uploading to IPFS...');
      const ipfsHash = await uploadToIPFS(uploadForm.file);
      console.log('✅ IPFS Hash:', ipfsHash);
      
      // Step 2: Store on blockchain
      console.log('⛓️ Creating content on blockchain...');
      const priceInWei = ethers.utils.parseEther(uploadForm.price);
      const tx = await contentPayment.createContent(
        account,
        uploadForm.title,
        ipfsHash,
        priceInWei
      );
      
      console.log('Transaction sent:', tx.hash);
      await tx.wait();
      console.log('✅ Content created successfully!');
      
      alert('🎉 Content uploaded successfully to IPFS and blockchain!');
      
      // Reset form
      setUploadForm({
        title: '',
        description: '',
        price: '',
        file: null
      });
      
      // Reload content
      await loadMyContent();
      
    } catch (error: any) {
      console.error('❌ Error uploading content:', error);
      alert('Failed to upload: ' + error.message);
    }
    setIsUploading(false);
  };

  if (isLoading) {
    return (
      <div className="dashboard">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isRegistered) {
    return (
      <div className="dashboard">
        <h2 className="gradient-text">Register as Creator</h2>
        <form onSubmit={handleRegister} className="form">
          <input
            type="text"
            placeholder="Your Username"
            value={registrationForm.username}
            onChange={(e) => setRegistrationForm({...registrationForm, username: e.target.value})}
            required
            className="input"
          />
          <textarea
            placeholder="Your Bio (Tell us about yourself)"
            value={registrationForm.bio}
            onChange={(e) => setRegistrationForm({...registrationForm, bio: e.target.value})}
            required
            className="input"
            rows={4}
          />
          <button type="submit" disabled={isRegistering} className="button-primary">
            {isRegistering ? 'Registering...' : '✨ Register as Creator'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="profile-card">
        <h2 className="gradient-text">✨ Creator Dashboard</h2>
        <p className="bio">✅ You are registered as a creator on Glamora!</p>
      </div>

      {/* Upload Content Form */}
      <div className="profile-card" style={{ marginTop: '2rem' }}>
        <h3 className="gradient-text">📤 Upload New Content</h3>
        <form onSubmit={handleUploadContent} className="form">
          <input
            type="text"
            placeholder="Content Title"
            value={uploadForm.title}
            onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
            required
            className="input"
          />
          <textarea
            placeholder="Description"
            value={uploadForm.description}
            onChange={(e) => setUploadForm({...uploadForm, description: e.target.value})}
            required
            className="input"
            rows={3}
          />
          <input
            type="number"
            step="0.01"
            placeholder="Price (DEV tokens)"
            value={uploadForm.price}
            onChange={(e) => setUploadForm({...uploadForm, price: e.target.value})}
            required
            className="input"
          />
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            required
            className="input"
            style={{ padding: '0.75rem' }}
          />
          <button type="submit" disabled={isUploading} className="button-primary">
            {isUploading ? '⏳ Uploading to IPFS...' : '🚀 Upload Content'}
          </button>
        </form>
      </div>

      {/* My Content */}
      {myContent.length > 0 && (
        <div className="profile-card" style={{ marginTop: '2rem' }}>
          <h3 className="gradient-text">📚 My Content</h3>
          <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
            {myContent.map((item) => (
              <div key={item.id} className="content-item">
                <h4>{item.title}</h4>
                <p>{item.description}</p>
                <p className="text">💰 Price: {item.price} DEV</p>
                <p className="text" style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                  IPFS: {item.ipfsHash.substring(0, 20)}...
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatorDashboard;
