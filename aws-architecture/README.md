# Glamora - Decentralized Fashion Marketplace

> Empowering fashion creators with true ownership and fair compensation through Web3 and AWS

[![AWS](https://img.shields.io/badge/AWS-Lambda%20%7C%20DynamoDB%20%7C%20CloudFront-orange)](https://aws.amazon.com)
[![Ethereum](https://img.shields.io/badge/Ethereum-Sepolia-blue)](https://sepolia.etherscan.io)
[![IPFS](https://img.shields.io/badge/IPFS-Pinata-green)](https://pinata.cloud)

---

## What is Glamora?

Glamora is a decentralized marketplace where independent fashion creators can:
- Upload and sell digital fashion content (designs, lookbooks, patterns)
- Keep **95% of sales** (vs 50-70% on traditional platforms)
- Retain **complete ownership** through IPFS and blockchain
- Reach a **global audience** with sub-100ms content delivery

**Built for creators. Powered by Web3 and AWS.**

---

##  Architecture

```
React Frontend (TypeScript)
        ↓
AWS API Gateway + Lambda Functions
        ↓
    ┌───────────┬──────────────┐
    ↓           ↓              ↓
DynamoDB   CloudFront    Ethereum (Solidity)
(Metadata)  (CDN Cache)   (Payments)
                ↓
            IPFS (Pinata)
          (Content Storage)
```

---

##  Tech Stack

**AWS Services:**
- **Lambda** - Serverless API functions (TypeScript)
- **DynamoDB** - User profiles, content metadata, purchases
- **CloudFront** - Global CDN for fast IPFS content delivery
- **API Gateway** - RESTful API with JWT authentication

**Blockchain:**
- **Ethereum (Sepolia Testnet)** - Smart contracts written in Solidity
- **IPFS via Pinata** - Decentralized permanent storage
- **MetaMask** - Web3 wallet integration

**Frontend:**
- **React** - Modern UI/UX
- **TypeScript** - Type-safe development
- **Ethers.js** - Blockchain interaction

---

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **MetaMask** browser extension
- **AWS Account** (for deployment)
- **Sepolia testnet ETH** ([Get from faucet](https://sepoliafaucet.com))

---

## 🛠️ Installation

### 1. Clone the repository
```bash
git clone https://github.com/Terese678/glamora-aws.git
cd glamora-aws
```

### 2. Install dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd glamora-frontend
npm install
```

### 3. Configure environment variables
```bash
# Create .env file in root
cp .env.example .env
```

### 4. Deploy smart contracts
```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

### 5. Start the frontend
```bash
cd glamora-frontend
npm run dev
```

Visit `http://localhost:5173` 

---

##  Amazon Q Integration

This project was built with **Amazon Q** as an AI development partner:

- **Code Generation:** Lambda functions with TypeScript types and error handling
- **Architecture Decisions:** DynamoDB vs RDS analysis with cost breakdowns
- **Security Implementation:** Wallet authentication and API protection strategies
- **Performance Optimization:** CloudFront + IPFS integration for 70% cost reduction
- **Scalability Planning:** Auto-scaling configuration for 10k → 100k+ users

**See [SUBMISSION.md](./SUBMISSION.md) for detailed Amazon Q usage documentation.**

---

## 📁 Project Structure

```
glamora-aws/
├── aws-architecture/
│   ├── lambda-functions.ts          # AWS Lambda handlers
│   └── lambda-functions-backup.ts
├── contracts/
│   ├── GlamoraHub.sol              # Main marketplace contract
│   ├── ContentPayment.sol          # Payment processing
│   └── CreatorProfile.sol          # Creator management
├── glamora-frontend/
│   ├── src/
│   │   ├── components/             # React components
│   │   ├── contracts/              # Contract ABIs
│   │   └── ipfsHelper.ts          # IPFS utilities
│   └── package.json
├── cloudfront-terraform.tf         # CloudFront infrastructure
├── SUBMISSION.md                   # Hackathon submission
└── README.md
```

---

## 🎮 Usage

### For Creators:
1. **Connect MetaMask** wallet
2. **Upload content** to IPFS (images, videos, designs)
3. **Set price** in ETH
4. **List on marketplace** - Content metadata stored in DynamoDB

### For Buyers:
1. **Browse marketplace** - Lightning-fast via CloudFront
2. **Purchase with ETH** - Secure Solidity smart contract
3. **Access content** - Permanent IPFS storage

---

## 💰 Cost Analysis

**At 10,000 users:**
- Lambda: $8/month
- DynamoDB: $6/month
- CloudFront: $5/month
- **Total: ~$19/month** (vs $50 budget)

**At 100,000 users:**
- Lambda: $80/month
- DynamoDB: $60/month
- CloudFront: $50/month
- **Total: ~$190/month** (linear scaling)

---

## 🔒 Security Features

- **Wallet Signature Verification** - Prevents unauthorized access
- **JWT Authentication** - Secure session management
- **Rate Limiting** - API abuse protection
- **IPFS Content Validation** - Hash verification before storage
- **Smart Contract Auditing** - Solidity best practices

---

## Performance

- **Content Delivery:** <100ms globally via CloudFront
- **API Response Time:** <50ms average
- **Smart Contract Gas:** Optimized for low transaction costs
- **Database Queries:** Single-digit millisecond latency

---

##  Hackathon Submission

**AWS Global Vibe Hackathon - November 2025**

This project demonstrates:
- ✅ Production-ready AWS Lambda functions
- ✅ Cost-optimized cloud architecture
- ✅ Web3 integration with Ethereum & IPFS
- ✅ Extensive Amazon Q AI assistance
- ✅ Scalable serverless design

**Full submission details:** [SUBMISSION.md](./SUBMISSION.md)

---

## 🔮 Future Roadmap

- [ ] Mainnet deployment (Ethereum + Polygon)
- [ ] Mobile app (React Native)
- [ ] NFT minting for exclusive content
- [ ] Creator analytics dashboard
- [ ] Multi-currency support (USDC, MATIC)
- [ ] DAO governance

---

##  Developer

**Timothy Terese**  
Building Glamora for my son Nathaniel's future 

**Contact:**
- Email: dredgeclassics@gmail.com
- Twitter: [@ter_chimbiv](https://twitter.com/ter_chimbiv)
- GitHub: [@Terese678](https://github.com/Terese678)

---

## 📄 License

MIT License - See [LICENSE](./LICENSE) for details

---

##  Acknowledgments

Special thanks to:
- **Amazon Q** - AI partner throughout development
- **AWS** - Cloud infrastructure
- **Pinata** - IPFS gateway services
- **Ethereum Community** - Web3 tools and resources

---

**Built with ❤️ for creators everywhere**  
*Dedicated to Nathaniel my son - May you grow up in a fair, transparent digital economy*