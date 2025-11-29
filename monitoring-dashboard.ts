// CloudWatch Dashboard for Glamora Scalability Monitoring

import * as AWS from 'aws-sdk';

const cloudwatch = new AWS.CloudWatch();

// Critical metrics for scaling decisions
export const scalingMetrics = {
  lambda: {
    concurrentExecutions: { threshold: 150, period: 120 },
    duration: { threshold: 5000, period: 300 },
    errorRate: { threshold: 1, period: 60 },
    throttles: { threshold: 10, period: 60 }
  },
  dynamodb: {
    readThrottles: { threshold: 0, period: 60 },
    writeThrottles: { threshold: 0, period: 60 },
    consumedReadCapacity: { threshold: 80, period: 120 },
    successfulRequestLatency: { threshold: 50, period: 300 }
  },
  apiGateway: {
    latency: { threshold: 100, period: 120 },
    errorRate: { threshold: 1, period: 60 },
    requestCount: { threshold: 1000, period: 60 }
  }
};

// Auto-scaling CloudWatch alarms
export const createScalingAlarms = async () => {
  const alarms = [
    {
      AlarmName: 'Glamora-Lambda-HighConcurrency',
      MetricName: 'ConcurrentExecutions',
      Namespace: 'AWS/Lambda',
      Statistic: 'Maximum',
      Threshold: 200,
      ComparisonOperator: 'GreaterThanThreshold',
      EvaluationPeriods: 2,
      Period: 60,
      AlarmActions: ['arn:aws:sns:us-east-1:ACCOUNT:scale-up-lambda']
    },
    {
      AlarmName: 'Glamora-API-HighLatency',
      MetricName: 'Latency',
      Namespace: 'AWS/ApiGateway',
      Statistic: 'Average',
      Threshold: 100,
      ComparisonOperator: 'GreaterThanThreshold',
      EvaluationPeriods: 3,
      Period: 60,
      AlarmActions: ['arn:aws:sns:us-east-1:ACCOUNT:investigate-latency']
    },
    {
      AlarmName: 'Glamora-DynamoDB-ReadThrottles',
      MetricName: 'ReadThrottles',
      Namespace: 'AWS/DynamoDB',
      Statistic: 'Sum',
      Threshold: 0,
      ComparisonOperator: 'GreaterThanThreshold',
      EvaluationPeriods: 1,
      Period: 60,
      AlarmActions: ['arn:aws:sns:us-east-1:ACCOUNT:scale-up-dynamodb']
    }
  ];

  for (const alarm of alarms) {
    await cloudwatch.putMetricAlarm(alarm).promise();
  }
};

// Custom metrics for business logic
export const publishCustomMetrics = async (metrics: {
  activeUsers: number;
  contentUploads: number;
  purchases: number;
  cacheHitRate: number;
}) => {
  const params = {
    Namespace: 'Glamora/Business',
    MetricData: [
      {
        MetricName: 'ActiveUsers',
        Value: metrics.activeUsers,
        Unit: 'Count',
        Timestamp: new Date()
      },
      {
        MetricName: 'ContentUploads',
        Value: metrics.contentUploads,
        Unit: 'Count/Minute'
      },
      {
        MetricName: 'Purchases',
        Value: metrics.purchases,
        Unit: 'Count/Minute'
      },
      {
        MetricName: 'CacheHitRate',
        Value: metrics.cacheHitRate,
        Unit: 'Percent'
      }
    ]
  };

  await cloudwatch.putMetricData(params).promise();
};

// Predictive scaling based on historical patterns
export const predictiveScaling = async () => {
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days

  const metrics = await cloudwatch.getMetricStatistics({
    Namespace: 'AWS/Lambda',
    MetricName: 'Invocations',
    Dimensions: [{ Name: 'FunctionName', Value: 'glamora-api' }],
    StartTime: startTime,
    EndTime: endTime,
    Period: 3600, // 1 hour
    Statistics: ['Sum', 'Average']
  }).promise();

  const hourlyPattern = analyzeHourlyPattern(metrics.Datapoints || []);
  const predictedLoad = predictNextHourLoad(hourlyPattern);

  if (predictedLoad > getCurrentCapacity() * 0.8) {
    await preScaleResources(predictedLoad);
  }
};

const analyzeHourlyPattern = (datapoints: AWS.CloudWatch.Datapoint[]) => {
  const hourlyData = new Array(24).fill(0);
  
  datapoints.forEach(point => {
    if (point.Timestamp && point.Sum) {
      const hour = point.Timestamp.getHours();
      hourlyData[hour] = Math.max(hourlyData[hour], point.Sum);
    }
  });
  
  return hourlyData;
};

const predictNextHourLoad = (hourlyPattern: number[]) => {
  const currentHour = new Date().getHours();
  const nextHour = (currentHour + 1) % 24;
  
  // Simple prediction: average of same hour over past week + 20% buffer
  return Math.ceil(hourlyPattern[nextHour] * 1.2);
};

const getCurrentCapacity = () => {
  // Return current provisioned concurrency
  return 50; // This would be fetched from Lambda configuration
};

const preScaleResources = async (predictedLoad: number) => {
  const lambda = new AWS.Lambda();
  const applicationAutoScaling = new AWS.ApplicationAutoScaling();
  
  // Pre-warm Lambda
  const targetConcurrency = Math.ceil(predictedLoad / 100);
  const maxConcurrency = Math.min(targetConcurrency, 200);
  
  if (maxConcurrency > 50) {
    await lambda.putProvisionedConcurrencyConfig({
      FunctionName: 'glamora-api',
      ProvisionedConcurrency: maxConcurrency
    }).promise();
    
    console.log(`Pre-scaled Lambda to ${maxConcurrency} concurrent executions`);
  }
};

// Dashboard configuration
export const dashboardConfig = {
  widgets: [
    {
      type: 'metric',
      properties: {
        metrics: [
          ['AWS/Lambda', 'ConcurrentExecutions', 'FunctionName', 'glamora-api'],
          ['AWS/Lambda', 'Duration', 'FunctionName', 'glamora-api'],
          ['AWS/Lambda', 'Errors', 'FunctionName', 'glamora-api']
        ],
        period: 300,
        stat: 'Average',
        region: 'us-east-1',
        title: 'Lambda Performance'
      }
    },
    {
      type: 'metric',
      properties: {
        metrics: [
          ['AWS/DynamoDB', 'ConsumedReadCapacityUnits', 'TableName', 'GlamoraUnified'],
          ['AWS/DynamoDB', 'ConsumedWriteCapacityUnits', 'TableName', 'GlamoraUnified'],
          ['AWS/DynamoDB', 'SuccessfulRequestLatency', 'TableName', 'GlamoraUnified']
        ],
        period: 300,
        stat: 'Average',
        region: 'us-east-1',
        title: 'DynamoDB Performance'
      }
    },
    {
      type: 'metric',
      properties: {
        metrics: [
          ['AWS/ApiGateway', 'Latency', 'ApiName', 'glamora-api'],
          ['AWS/ApiGateway', 'Count', 'ApiName', 'glamora-api'],
          ['AWS/ApiGateway', '4XXError', 'ApiName', 'glamora-api'],
          ['AWS/ApiGateway', '5XXError', 'ApiName', 'glamora-api']
        ],
        period: 300,
        stat: 'Average',
        region: 'us-east-1',
        title: 'API Gateway Performance'
      }
    }
  ]
};