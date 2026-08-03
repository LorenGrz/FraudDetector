#!/usr/bin/env bash
set -e

STACK="fraud-detector"
REGION="us-east-1"

echo "Building Docker image and deploying FraudDetector..."
sam build
sam deploy

APP_URL=$(aws cloudformation describe-stacks \
  --stack-name "$STACK" \
  --region "$REGION" \
  --query 'Stacks[0].Outputs[?OutputKey==`AppUrl`].OutputValue' \
  --output text)

echo "Done. URL: $APP_URL"
