
// Types and interfaces
interface UserProfile {
  walletAddress: string;
  username?: string;
  email?: string;
  createdAt: number;
  updatedAt: number;
}

interface ContentMetadata {
  ipfsHash: string;
  creatorAddress: string;
  title: string;
  description?: string;
  price: number;
  createdAt: number;
}

interface Purchase {
  contentId: string;
  buyerAddress: string;
  sellerAddress: string;
  price: number;
  purchaseDate: number;
}

// DynamoDB table schemas
const UserTableSchema = {
  TableName: 'GlamoraUsers',
  KeySchema: [
    { AttributeName: 'walletAddress', KeyType: 'HASH' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'walletAddress', AttributeType: 'S' }
  ]
};

const ContentTableSchema = {
  TableName: 'GlamoraContent',
  KeySchema: [
    { AttributeName: 'ipfsHash', KeyType: 'HASH' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'ipfsHash', AttributeType: 'S' },
    { AttributeName: 'creatorAddress', AttributeType: 'S' }
  ]
};

const PurchaseTableSchema = {
  TableName: 'GlamoraPurchases',
  KeySchema: [
    { AttributeName: 'contentId', KeyType: 'HASH' },
    { AttributeName: 'buyerAddress', KeyType: 'RANGE' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'contentId', AttributeType: 'S' },
    { AttributeName: 'buyerAddress', AttributeType: 'S' }
  ]
};

// Optimized DynamoDB client with connection pooling
const dynamoClient = new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION,
  maxRetries: 3,
  httpOptions: {
    connectTimeout: 1000,
    timeout: 5000,
    agent: new https.Agent({
      keepAlive: true,
      maxSockets: 50,
      maxFreeSockets: 10
    })
  }
});

// Circuit breaker for resilience
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private failureThreshold = 3,
    private recoveryTimeout = 30000
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Service temporarily unavailable');
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
  
  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }
}

const dynamoCircuitBreaker = new CircuitBreaker();

// In-memory cache for frequently accessed data
const cache = new Map<string, { data: any; expiry: number }>();

// User Authentication Lambda - Optimized
export const authenticateUser = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { signature, message, walletAddress } = JSON.parse(event.body || '');

    // Verify MetaMask signature
    const recoveredAddress = ethers.utils.verifyMessage(message, signature);
    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      throw new Error('Invalid signature');
    }

    const timestamp = Date.now();
    const region = event.headers['CloudFront-Viewer-Country'] || 'US';

    const userProfile = {
      pk: `USER#${walletAddress}`,
      sk: 'PROFILE',
      gsi1pk: `REGION#${region}`,
      gsi1sk: `USER#${timestamp}`,
      walletAddress,
      region,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    await dynamoCircuitBreaker.execute(async () => {
      return dynamoClient.put({
        TableName: 'GlamoraUnified',
        Item: userProfile,
        ConditionExpression: 'attribute_not_exists(pk)'
      }).promise();
    });

    // Generate JWT token
    const token = jwt.sign({ walletAddress, region }, process.env.JWT_SECRET!, { expiresIn: '24h' });

    return {
      statusCode: 200,
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token, userProfile })
    };
  } catch (error) {
    console.error('Auth error:', error);
    return {
      statusCode: error.message.includes('ConditionalCheckFailedException') ? 409 : 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// IPFS Content Upload Lambda - Optimized
export const uploadContent = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { ipfsHash, title, description, price, creatorAddress, category = 'general' } = JSON.parse(event.body || '');

    // Validate IPFS hash format
    if (!ipfsHash.match(/^Qm[1-9A-HJ-NP-Za-km-z]{44}$/)) {
      throw new Error('Invalid IPFS hash format');
    }

    const timestamp = Date.now();
    const contentMetadata = {
      pk: `CONTENT#${ipfsHash}`,
      sk: 'METADATA',
      gsi1pk: `CREATOR#${creatorAddress}`,
      gsi1sk: `CONTENT#${timestamp}`,
      gsi2pk: `CATEGORY#${category}`,
      gsi2sk: `PRICE#${String(price).padStart(10, '0')}#${timestamp}`,
      ipfsHash,
      creatorAddress,
      title,
      description,
      price,
      category,
      createdAt: timestamp
    };

    await dynamoCircuitBreaker.execute(async () => {
      return dynamoClient.put({
        TableName: 'GlamoraUnified',
        Item: contentMetadata
      }).promise();
    });

    // Invalidate creator cache
    cache.delete(`creator:${creatorAddress}`);

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(contentMetadata)
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// Content Purchase Lambda
export const purchaseContent = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { contentId, signature, buyerAddress } = JSON.parse(event.body || '');

    // Verify buyer signature
    const message = `Purchase content ${contentId}`;
    const recoveredAddress = ethers.utils.verifyMessage(message, signature);
    if (recoveredAddress.toLowerCase() !== buyerAddress.toLowerCase()) {
      throw new Error('Invalid buyer signature');
    }

    const dynamodb = new AWS.DynamoDB.DocumentClient();

    // Get content details
    const content = await dynamodb.get({
      TableName: 'GlamoraContent',
      Key: { ipfsHash: contentId }
    }).promise();

    if (!content.Item) {
      throw new Error('Content not found');
    }

    const purchase: Purchase = {
      contentId,
      buyerAddress,
      sellerAddress: content.Item.creatorAddress,
      price: content.Item.price,
      purchaseDate: Date.now()
    };

    await dynamodb.put({
      TableName: 'GlamoraPurchases',
      Item: purchase
    }).promise();

    return {
      statusCode: 200,
      body: JSON.stringify(purchase)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// Get Creator Profile Lambda
export const getCreatorProfile = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { walletAddress } = event.pathParameters || {};

    if (!walletAddress) {
      throw new Error('Wallet address is required');
    }

    const dynamodb = new AWS.DynamoDB.DocumentClient();

    // Get user profile
    const userProfile = await dynamodb.get({
      TableName: 'GlamoraUsers',
      Key: { walletAddress }
    }).promise();

    // Get creator content
    const content = await dynamodb.query({
      TableName: 'GlamoraContent',
      IndexName: 'CreatorIndex',
      KeyConditionExpression: 'creatorAddress = :address',
      ExpressionAttributeValues: {
        ':address': walletAddress
      }
    }).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        profile: userProfile.Item,
        content: content.Items
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// Optimized IPFS Content Delivery with Caching
export const getContentUrl = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { ipfsHash } = event.pathParameters || {};
    
    if (!ipfsHash || !ipfsHash.match(/^Qm[1-9A-HJ-NP-Za-km-z]{44}$/)) {
      throw new Error('Invalid IPFS hash');
    }

    // Check cache first
    const cacheKey = `content:${ipfsHash}`;
    const cached = cache.get(cacheKey);
    
    if (cached && cached.expiry > Date.now()) {
      return {
        statusCode: 200,
        headers: {
          'Cache-Control': 'public, max-age=300',
          'Content-Type': 'application/json',
          'X-Cache': 'HIT'
        },
        body: JSON.stringify(cached.data)
      };
    }

    // Get content metadata
    const content = await dynamoCircuitBreaker.execute(async () => {
      return dynamoClient.get({
        TableName: 'GlamoraUnified',
        Key: { pk: `CONTENT#${ipfsHash}`, sk: 'METADATA' }
      }).promise();
    });

    if (!content.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Content not found' })
      };
    }

    const cloudFrontUrl = `${process.env.CLOUDFRONT_DOMAIN}/ipfs/${ipfsHash}`;
    const response = {
      url: cloudFrontUrl,
      ipfsHash,
      title: content.Item.title,
      price: content.Item.price,
      cached: false
    };

    // Cache for 5 minutes
    cache.set(cacheKey, {
      data: response,
      expiry: Date.now() + 300000
    });
    
    return {
      statusCode: 200,
      headers: {
        'Cache-Control': 'public, max-age=300',
        'Content-Type': 'application/json',
        'X-Cache': 'MISS'
      },
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Content URL error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// Batch content prewarming for popular creators
export const prewarmCreatorContent = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { creatorAddress } = event.pathParameters || {};
    
    const dynamodb = new AWS.DynamoDB.DocumentClient();
    const content = await dynamodb.query({
      TableName: 'GlamoraContent',
      IndexName: 'CreatorIndex',
      KeyConditionExpression: 'creatorAddress = :address',
      ExpressionAttributeValues: { ':address': creatorAddress },
      Limit: 10 // Prewarm top 10 content pieces
    }).promise();

    const ipfsHashes = content.Items?.map(item => item.ipfsHash) || [];
    
    // Trigger prewarming (async)
    const lambda = new AWS.Lambda();
    await lambda.invoke({
      FunctionName: 'glamora-prewarm-content',
      InvocationType: 'Event',
      Payload: JSON.stringify({ ipfsHashes })
    }).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Prewarming initiated',
        contentCount: ipfsHashes.length
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
