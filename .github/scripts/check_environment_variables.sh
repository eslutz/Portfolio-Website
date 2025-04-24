#!/bin/bash

# Set environment variables
SWA_NAME="$1"
RESOURCE_GROUP="$2"
ROOT_DOMAIN="$3"

# Validate required variables
if [ -z "$SWA_NAME" ]; then
  echo "::error::STATIC_WEB_APP_NAME is not set. Please set it as a repository variable."
  exit 1
fi
if [ -z "$RESOURCE_GROUP" ]; then
  echo "::error::RESOURCE_GROUP_NAME is not set. Please set it as a repository variable."
  exit 1
fi
if [ -z "$ROOT_DOMAIN" ]; then
  echo "::error::CUSTOM_ROOT_DOMAIN is not set. Please set it as a repository variable."
  exit 1
fi

# Validate CUSTOM_ROOT_DOMAIN is an apex domain
IFS='.' read -ra DOMAIN_PARTS <<< "$ROOT_DOMAIN"
if [ ${#DOMAIN_PARTS[@]} -ne 2 ]; then
  echo "::error::CUSTOM_ROOT_DOMAIN must be an apex domain (e.g., example.com)"
  exit 1
fi

echo "Using Static Web App: $SWA_NAME"
echo "Using Resource Group: $RESOURCE_GROUP"
echo "Using Root Domain: $ROOT_DOMAIN"
