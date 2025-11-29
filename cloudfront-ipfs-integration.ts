import { CloudFront, S3 } from 'aws-sdk';
import axios from 'axios';

// CloudFront Distribution Configuration
export const cloudfrontConfig = {
  DistributionConfig: {
    CallerReference: `glamora-ipfs-${Date.now()}`,
    Comment: 'Glamora IPFS Content Distribution',
    DefaultCacheBehavior: {
      TargetOriginId: 'glamora-s3-origin',
      ViewerProtocolPolicy: 'redirect-to-https',
      CachePolicyId: '4135ea2d-6df8-44a3-9df3-4b5a84be39ad', // Managed-CachingOptimized
      Compress: true,
      AllowedMethods: {
        Quantity: 2,
        Items: ['GET', 'HEAD'],
        CachedMethods: {
          Quantity: 2,
          Items: ['GET', 'HEAD']
        }
      }
    },
    Origins: {
      Quantity: 1,
      Items: [{
        Id: 'glamora-s3-origin',
        DomainName: 'glamora-content.s3.amazonaws.com',
        S3OriginConfig: {
          OriginAccessIdentity: 'origin-access-identity/cloudfront/E1234567890'
        }
      }]
    },
    CacheBehaviors: {
      Quantity: 1,
      Items: [{
        PathPattern: '/ipfs/*',
        TargetOriginId: 'glamora-s3-origin',
        ViewerProtocolPolicy: 'redirect-to-https',
        CachePolicyId: '4135ea2d-6df8-44a3-9df3-4b5a84be39ad',
        TTL: 31536000, // 1 year - IPFS content is immutable
        Compress: true
      }]
    },
    Enabled: true,
    PriceClass: 'PriceClass_All'
  }
};

// Lambda@Edge for IPFS content fetching
export const ipfsContentHandler = async (event: any) => {
  const request = event.Records[0].cf.request;
  const uri = request.uri;
  
  // Extract IPFS hash from URI: /ipfs/QmHash
  const ipfsHashMatch = uri.match(/\/ipfs\/([a-zA-Z0-9]{46})/);
  if (!ipfsHashMatch) {
    return {
      status: '400',
      statusDescription: 'Invalid IPFS hash'
    };
  }

  const ipfsHash = ipfsHashMatch[1];
  const s3Key = `ipfs/${ipfsHash}`;

  // Check if content exists in S3 cache
  const s3 = new S3();
  try {
    await s3.headObject({
      Bucket: 'glamora-content',
      Key: s3Key
    }).promise();
    
    // Content exists, serve from S3
    request.uri = `/${s3Key}`;
    return request;
  } catch (error) {
    // Content not in S3, fetch from IPFS
    return await fetchFromIPFS(ipfsHash, s3Key);
  }
};

// IPFS fetching and S3 caching
const fetchFromIPFS = async (ipfsHash: string, s3Key: string) => {
  const pinataGateways = [
    `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
    `https://ipfs.io/ipfs/${ipfsHash}`,
    `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`
  ];

  for (const gateway of pinataGateways) {
    try {
      const response = await axios.get(gateway, {
        timeout: 10000,
        responseType: 'arraybuffer'
      });

      // Cache in S3 for future requests
      const s3 = new S3();
      await s3.putObject({
        Bucket: 'glamora-content',
        Key: s3Key,
        Body: response.data,
        ContentType: response.headers['content-type'] || 'application/octet-stream',
        CacheControl: 'public, max-age=31536000, immutable', // 1 year cache
        Metadata: {
          'ipfs-hash': ipfsHash,
          'fetched-at': new Date().toISOString()
        }
      }).promise();

      return {
        status: '200',
        statusDescription: 'OK',
        body: Buffer.from(response.data).toString('base64'),
        bodyEncoding: 'base64',
        headers: {
          'content-type': [{ key: 'Content-Type', value: response.headers['content-type'] }],
          'cache-control': [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }]
        }
      };
    } catch (error) {
      console.log(`Failed to fetch from ${gateway}:`, error.message);
      continue;
    }
  }

  return {
    status: '404',
    statusDescription: 'Content not found on IPFS'
  };
};

// Pre-warming cache for popular content
export const prewarmContent = async (ipfsHashes: string[]) => {
  const s3 = new S3();
  const cloudfront = new CloudFront();

  for (const hash of ipfsHashes) {
    try {
      // Fetch from IPFS
      const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${hash}`, {
        responseType: 'arraybuffer'
      });

      // Store in S3
      await s3.putObject({
        Bucket: 'glamora-content',
        Key: `ipfs/${hash}`,
        Body: response.data,
        ContentType: response.headers['content-type'],
        CacheControl: 'public, max-age=31536000, immutable'
      }).promise();

      // Create CloudFront invalidation to ensure fresh cache
      await cloudfront.createInvalidation({
        DistributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID!,
        InvalidationBatch: {
          CallerReference: `prewarm-${hash}-${Date.now()}`,
          Paths: {
            Quantity: 1,
            Items: [`/ipfs/${hash}`]
          }
        }
      }).promise();

    } catch (error) {
      console.error(`Failed to prewarm ${hash}:`, error);
    }
  }
};