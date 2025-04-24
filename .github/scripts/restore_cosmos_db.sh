#!/bin/bash

# Set environment variables
COSMOS_ACCOUNT_NAME="$1"
COSMOS_RESOURCE_GROUP="$2"
DATABASE_NAME="$3"
LOCATION="$4"

# Directly construct the source database ID for the restore operation
SOURCE_DB_ID="dbs/$DATABASE_NAME"
echo "Using source database ID: $SOURCE_DB_ID"

# Get the instance ID of the Cosmos DB account
INSTANCE_ID=$(az cosmosdb show \
  --name "$COSMOS_ACCOUNT_NAME" \
  --resource-group "$COSMOS_RESOURCE_GROUP" \
  --query "instanceId" -o tsv)
echo "Instance ID: $INSTANCE_ID"

# Get all available restore timestamps where this database existed using database name
RESTORE_TIMESTAMPS=$(az cosmosdb restorable-database list \
  --location "$LOCATION" \
  --instance-id "$INSTANCE_ID" \
  --query "[?name=='$DATABASE_NAME'].restoreTimestamp" -o tsv)

# Get the latest timestamp (should be the first one since they're sorted in descending order)
LATEST_TIMESTAMP=$(echo "$RESTORE_TIMESTAMPS" | head -n 1)
echo "Latest timestamp where database existed: $LATEST_TIMESTAMP"

# Restore the database using the latest valid timestamp
az cosmosdb sql database restore \
  --account-name "$COSMOS_ACCOUNT_NAME" \
  --resource-group "$COSMOS_RESOURCE_GROUP" \
  --name "$DATABASE_NAME" \
  --restore-timestamp "$LATEST_TIMESTAMP" \
  --source-database-id "$SOURCE_DB_ID"
