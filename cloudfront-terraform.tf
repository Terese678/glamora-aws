# S3 Bucket for IPFS content caching
resource "aws_s3_bucket" "glamora_content" {
  bucket = "glamora-content-${random_id.bucket_suffix.hex}"
}

resource "aws_s3_bucket_versioning" "glamora_content" {
  bucket = aws_s3_bucket.glamora_content.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "glamora_content" {
  bucket = aws_s3_bucket.glamora_content.id

  rule {
    id     = "ipfs_content_lifecycle"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }
  }
}

# CloudFront Origin Access Identity
resource "aws_cloudfront_origin_access_identity" "glamora_oai" {
  comment = "Glamora IPFS Content OAI"
}

# S3 Bucket Policy for CloudFront
resource "aws_s3_bucket_policy" "glamora_content_policy" {
  bucket = aws_s3_bucket.glamora_content.id

  policy = jsonencode({
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.glamora_oai.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.glamora_content.arn}/*"
      }
    ]
  })
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "glamora_ipfs" {
  comment             = "Glamora IPFS Content Distribution"
  default_root_object = "index.html"
  enabled             = true
  price_class         = "PriceClass_All"

  origin {
    domain_name = aws_s3_bucket.glamora_content.bucket_regional_domain_name
    origin_id   = "glamora-s3-origin"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.glamora_oai.cloudfront_access_identity_path
    }
  }

  # Default behavior for general content
  default_cache_behavior {
    target_origin_id       = "glamora-s3-origin"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    allowed_methods = ["GET", "HEAD"]
    cached_methods  = ["GET", "HEAD"]

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 86400    # 1 day
    max_ttl     = 31536000 # 1 year
  }

  # Optimized behavior for IPFS content (immutable)
  ordered_cache_behavior {
    path_pattern           = "/ipfs/*"
    target_origin_id       = "glamora-s3-origin"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    allowed_methods = ["GET", "HEAD"]
    cached_methods  = ["GET", "HEAD"]

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 31536000 # 1 year - IPFS is immutable
    default_ttl = 31536000
    max_ttl     = 31536000

    # Custom headers for IPFS content
    response_headers_policy_id = aws_cloudfront_response_headers_policy.ipfs_headers.id
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name        = "Glamora IPFS Distribution"
    Environment = "production"
  }
}

# Response Headers Policy for IPFS content
resource "aws_cloudfront_response_headers_policy" "ipfs_headers" {
  name = "glamora-ipfs-headers"

  custom_headers_config {
    items {
      header   = "X-Content-Source"
      value    = "IPFS"
      override = false
    }
  }

  security_headers_config {
    content_type_options {
      override = true
    }
    frame_options {
      frame_option = "DENY"
      override     = true
    }
    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }
    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = true
      override                   = true
    }
  }
}

# Lambda@Edge function for IPFS fetching
resource "aws_lambda_function" "ipfs_edge" {
  filename         = "ipfs-edge.zip"
  function_name    = "glamora-ipfs-edge"
  role            = aws_iam_role.lambda_edge_role.arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 512

  publish = true # Required for Lambda@Edge
}

# IAM Role for Lambda@Edge
resource "aws_iam_role" "lambda_edge_role" {
  name = "glamora-lambda-edge-role"

  assume_role_policy = jsonencode({
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = [
            "lambda.amazonaws.com",
            "edgelambda.amazonaws.com"
          ]
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_edge_basic" {
  role       = aws_iam_role.lambda_edge_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_edge_s3" {
  name = "glamora-lambda-edge-s3"
  role = aws_iam_role.lambda_edge_role.id

  policy = jsonencode({
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:HeadObject"
        ]
        Resource = "${aws_s3_bucket.glamora_content.arn}/*"
      }
    ]
  })
}

# Random suffix for unique bucket names
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# Outputs
output "cloudfront_domain" {
  value = aws_cloudfront_distribution.glamora_ipfs.domain_name
}

output "s3_bucket" {
  value = aws_s3_bucket.glamora_content.bucket
}