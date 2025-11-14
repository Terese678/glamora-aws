import { useState, useEffect } from 'react';
import { useWeb3 } from '../Web3Context';
import { getIPFSUrl } from '../ipfsHelper';
import { ethers } from 'ethers';

interface UserDashboardProps {
  account: string;
}

interface ContentItem {
  id: number;
  creator: string;
  title: string;
  description: string;
  price: string;
  ipfsHash: string;
  purchaseCount: number;
  isPurchased: boolean;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ account }) => {
  const { contentPayment } = useWeb3();
  const [allContent, setAllContent] = useState<ContentItem[]>([]);
  const [myPurchases, setMyPurchases] = useState<ContentItem[]>([]);
  const [selectedTab, setSelectedTab] = useState<'explore' | 'purchases'>('explore');
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);

  useEffect(() => {
    loadAllContent();
  }, [contentPayment, account]);

  const loadAllContent = async () => {
    if (!contentPayment || !account) return;

    setIsLoading(true);
    try {
      console.log('📥 Loading all content...');
      
      const nextId = await contentPayment.nextContentId();
      const totalContent = nextId.toNumber();
      console.log('📊 Total content on platform:', totalContent);

      const contentList: ContentItem[] = [];
      const purchased: ContentItem[] = [];

      for (let i = 1; i < totalContent; i++) {
        try {
          const content = await contentPayment.getContent(i);

          // Skip test data with fake IPFS hashes
          if (content.contentHash.includes('QmTest')) {
            console.log('⏭️ Skipping test content');
            continue;
          }

          const hasPurchased = await contentPayment.hasAccess(account, i);

          const item: ContentItem = {
            id: i,
            creator: content.creator,
            title: content.title,
            description: content.description || 'No description',
            price: ethers.utils.formatEther(content.price),
            ipfsHash: content.contentHash,
            purchaseCount: content.purchaseCount ? content.purchaseCount.toNumber() : 0,
            isPurchased: hasPurchased
          };

          contentList.push(item);
          
          if (hasPurchased) {
            purchased.push(item);
          }
        } catch (err) {
          console.log(`❌ Error loading content ID ${i}:`, err);
        }
      }

      console.log('✅ Loaded', contentList.length, 'content items');
      console.log('✅ You own', purchased.length, 'items');
      
      setAllContent(contentList);
      setMyPurchases(purchased);
    } catch (error) {
      console.error('Error loading content:', error);
    }
    setIsLoading(false);
  };

  const handlePurchase = async (contentId: number, price: string) => {
    if (!contentPayment) return;

    setIsPurchasing(true);
    try {
      console.log('💰 Purchasing content ID:', contentId);
      
      const priceInWei = ethers.utils.parseEther(price);
      const tx = await contentPayment.purchaseContent(contentId, {
        value: priceInWei
      });

      console.log('Transaction sent:', tx.hash);
      await tx.wait();
      console.log('✅ Purchase successful!');
      
      alert('🎉 Content purchased successfully! Check "My Purchases" tab.');
      
      setSelectedContent(null);
      await loadAllContent();
    } catch (error: any) {
      console.error('❌ Purchase failed:', error);
      alert('Failed to purchase: ' + error.message);
    }
    setIsPurchasing(false);
  };

  const ContentModal = () => {
    if (!selectedContent) return null;

    return (
      <div className="modal-overlay" onClick={() => setSelectedContent(null)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={() => setSelectedContent(null)}>
            ✕
          </button>
          
          <h2>{selectedContent.title}</h2>
          <p className="modal-creator">by {selectedContent.creator.slice(0, 6)}...{selectedContent.creator.slice(-4)}</p>
          <p className="modal-description">{selectedContent.description}</p>

          {selectedContent.isPurchased ? (
            <div className="purchased-badge">
              <span>✅ You Own This Content</span>
              <p className="content-hash">
                IPFS: {selectedContent.ipfsHash}
              </p>
              <a 
                href={getIPFSUrl(selectedContent.ipfsHash)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="primary-btn"
                style={{ marginTop: '1rem', display: 'inline-block' }}
              >
                🔗 View on IPFS
              </a>
            </div>
          ) : (
            <>
              <div className="modal-price">
                <span className="price-label">Price:</span>
                <span className="price-value">{selectedContent.price} DEV</span>
              </div>
              <button
                className="primary-btn"
                onClick={() => handlePurchase(selectedContent.id, selectedContent.price)}
                disabled={isPurchasing}
                style={{ width: '100%' }}
              >
                {isPurchasing ? '⏳ Processing...' : '💰 Purchase Now'}
              </button>
            </>
          )}

          <div className="content-stats" style={{ marginTop: '1.5rem' }}>
            <span>🛒 {selectedContent.purchaseCount} purchases</span>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="dashboard">
        <p>Loading content...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${selectedTab === 'explore' ? 'active' : ''}`}
          onClick={() => setSelectedTab('explore')}
        >
          ✨ Explore Content ({allContent.length})
        </button>
        <button
          className={`tab ${selectedTab === 'purchases' ? 'active' : ''}`}
          onClick={() => setSelectedTab('purchases')}
        >
          📚 My Purchases ({myPurchases.length})
        </button>
      </div>

      {/* Explore Tab */}
      {selectedTab === 'explore' && (
        <div className="explore-section">
          <div className="section-header">
            <h3>Discover Amazing Content</h3>
          </div>

          {allContent.length === 0 ? (
            <p className="empty-state">No content available yet. Check back soon! ✨</p>
          ) : (
            <div className="content-grid">
              {allContent.map((content) => (
                <div 
                  key={content.id} 
                  className={`content-card ${content.isPurchased ? 'owned' : ''}`}
                  onClick={() => setSelectedContent(content)}
                  style={{ cursor: 'pointer' }}
                >
                  {content.isPurchased && (
                    <div className="owned-badge">✅ Owned</div>
                  )}
                  <h4>{content.title}</h4>
                  <p className="content-creator">
                    by {content.creator.slice(0, 6)}...{content.creator.slice(-4)}
                  </p>
                  <p className="content-description">{content.description}</p>
                  <div className="content-stats">
                    <span>💰 {content.price} DEV</span>
                    <span>🛒 {content.purchaseCount} sales</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* My Purchases Tab */}
      {selectedTab === 'purchases' && (
        <div className="purchased-section">
          <div className="section-header">
            <h3>Your Purchased Content</h3>
          </div>

          {myPurchases.length === 0 ? (
            <div className="empty-state-card">
              <span style={{ fontSize: '3rem' }}>📚</span>
              <h3>No Purchases Yet</h3>
              <p>Explore content and make your first purchase!</p>
              <button 
                className="primary-btn"
                onClick={() => setSelectedTab('explore')}
              >
                Explore Content
              </button>
            </div>
          ) : (
            <div className="content-grid">
              {myPurchases.map((content) => (
                <div 
                  key={content.id} 
                  className="content-card owned"
                  onClick={() => setSelectedContent(content)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="owned-badge">✅ Owned</div>
                  <h4>{content.title}</h4>
                  <p className="content-creator">
                    by {content.creator.slice(0, 6)}...{content.creator.slice(-4)}
                  </p>
                  <p className="content-description">{content.description}</p>
                  <div className="content-hash-preview">
                    <small>IPFS: {content.ipfsHash.slice(0, 20)}...</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <ContentModal />
    </div>
  );
};

export default UserDashboard;
