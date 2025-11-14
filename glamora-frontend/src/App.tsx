import { useState } from 'react';
import { useWeb3 } from './Web3Context';
import CreatorDashboard from './components/CreatorDashboard';
import UserDashboard from './components/UserDashboard';
import './App.css';

function App() {
  const { account, connectWallet, isConnected } = useWeb3();
  const [view, setView] = useState<'home' | 'creator' | 'user'>('home');

  console.log('🔍 App state:', { isConnected, account, view });

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <h1 className="logo">✨ GLAMORA</h1>
          <nav className="nav">
            {isConnected && account ? (
              <>
                <button 
                  className="nav-btn"
                  onClick={() => setView('creator')}
                >
                  Creator Hub
                </button>
                <button 
                  className="nav-btn"
                  onClick={() => setView('user')}
                >
                  Explore
                </button>
                <div className="account-info">
                  <span className="account-address">
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </span>
                </div>
              </>
            ) : (
              <button className="connect-btn" onClick={connectWallet}>
                Connect Wallet
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {!isConnected || !account ? (
          <div className="hero">
            <h2 className="hero-title">
              Welcome to Glamora
            </h2>
            <p className="hero-subtitle">
              The decentralized platform for beauty creators and enthusiasts
            </p>
            <button className="hero-btn" onClick={connectWallet}>
              Get Started
            </button>
          </div>
        ) : view === 'creator' ? (
          <CreatorDashboard account={account} />
        ) : view === 'user' ? (
          <UserDashboard account={account} />
        ) : (
          <div className="hero">
            <h2 className="hero-title">Choose Your Path</h2>
            <div className="path-options">
              <button 
                className="path-btn"
                onClick={() => setView('creator')}
              >
                <span className="path-icon">🎨</span>
                <h3>I'm a Creator</h3>
                <p>Share your content and earn</p>
              </button>
              <button 
                className="path-btn"
                onClick={() => setView('user')}
              >
                <span className="path-icon">✨</span>
                <h3>I'm a User</h3>
                <p>Discover amazing content</p>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
