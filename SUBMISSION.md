# Glamora - Decentralized Fashion Marketplace
## AWS Global Vibe Hackathon Submission

---

##  The Problem & Solution

Traditional fashion platforms take 30-50% commissions from creators and control content ownership. **Glamora** empowers independent fashion creators to monetize their work directly, keeping 95% of sales through Web3 technology and AWS infrastructure.

**Why This Matters:** Built for my son Nathaniel. I'm creating a future where creators have true ownership and fair compensation for their work.

---

##  How We Used Amazon Q - Our AI Architect

Amazon Q wasn't just a code generator it was our technical consultant for every major decision.

## 📸 Amazon Q Documentation

All Amazon Q interactions are fully documented with screenshots in the `/amazon-q-screenshots/` folder:

- **Code Generation** (Screenshots 01-06): Shows Q generating 800+ lines of Lambda functions
- **Database Architecture** (Screenshots 07-11): DynamoDB vs RDS analysis with cost breakdowns
- **Security Best Practices** (Screenshots 12-14): Wallet authentication and Lambda security
- **CloudFront Integration** (Screenshots 15-18): CDN optimization for IPFS content
- **Cost Optimization** (Screenshots 19-20): Budget planning and service optimization
- **Scalability Planning** (Screenshots 21-22): Auto-scaling and global distribution strategies

Total: 22 screenshots proving legitimate AI-assisted development.

### 1. **Generated Production-Ready Lambda Functions**
Asked Q to create 5 complete TypeScript Lambda functions with DynamoDB schemas, Web3 wallet authentication, IPFS integration, and error handling. Saved 8+ hours.

### 2. **Made Critical Architecture Decisions**
Consulted Q on **DynamoDB vs RDS** for our use case. Q provided cost breakdown, performance analysis, and code examples. **Decision:** DynamoDB saves $170/month at scale while delivering sub-100ms response times.

### 3. **Designed Security From Day One**
Asked Q about securing wallet authentication, IPFS uploads, and transactions. Q provided replay attack prevention, Lambda security configs, and rate limiting strategies. 

### 4. **Optimized CloudFront + IPFS Integration**
Q designed our caching strategy for IPFS content via CloudFront. 

### 5. **Planned For Scale**
Q helped architect auto-scaling from 10k to 100k+ users with cost projections at each stage. 
**Proof:** screenshots documenting every Q interaction across code generation, architecture, security, performance, and cost optimization.

---

##  Technical Stack

**AWS Services:**
- **Lambda** - Serverless business logic
- **DynamoDB** - Read-optimized NoSQL database  
- **CloudFront** - Global CDN for IPFS content
- **API Gateway** - REST API with JWT auth

**Web3 Integration:**
- **Ethereum (Sepolia)** - Smart contracts (Solidity) for payments
- **IPFS (Pinata)** - Decentralized content storage
- **MetaMask** - Wallet authentication

**Frontend:**
- **React** - User interface
- **TypeScript** - Type-safe development

**Architecture:** React frontend → API Gateway → Lambda → DynamoDB + IPFS → Ethereum

---

##  Innovation & Impact

**Technical Innovation:**
- Hybrid Web3 ownership + Web2 performance
- Sub-100ms global content delivery
- 70% reduction in IPFS gateway costs
- Auto-scales 10k → 100k+ users

**Business Value:**
- Creators keep 95% vs 50-70% on traditional platforms
- True content ownership via IPFS + blockchain
- $765B fashion market + $104B creator economy
- Zero geographic restrictions

---

## Demo & Links

**Live Demo:**  https://youtu.be/DcM0-cE0DY8 
**GitHub:** https://github.com/Terese678/glamora-aws  

**Test it:** Requires MetaMask + Sepolia testnet

---

##  What's Next

**Short-term:** Mainnet launch, Polygon integration, creator verification  
**Long-term:** Mobile app, NFT minting, DAO governance, creator grants program

---

##  Built For Nathaniel

This project represents the transparent, equitable platform I want to exist when my son grows up. Amazon Q made it possible to build production-quality infrastructure in 2 weeks - something that would have taken months alone.

**Contact:** dredgeclassics@gmail.com | [@ter_chimbiv](https://twitter.com/ter_chimbiv)

---

*Built with AWS, Amazon Q, and Web3 • November 2025*