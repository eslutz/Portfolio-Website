#!/bin/bash

# Default values
COSMOS_ACCOUNT_NAME=""
COSMOS_RESOURCE_GROUP=""
SOURCE_DATABASE_NAME=""
DESTINATION_DATABASE_NAME=""
LOCATION=""
RESTORE_TIMESTAMP=""
OVERWRITE=false

# Function to display usage
function display_usage {
  echo "Usage: $0 [options]"
  echo "Options:"
  echo "  -a, --account-name NAME          Cosmos DB account name (required)"
  echo "  -r, --resource-group NAME        Resource group name (required)"
  echo "  -s, --source-database NAME       Source database name (required)"
  echo "  -d, --destination-database NAME  Destination database name (required)"
  echo "  -l, --location LOCATION          Azure region location (required)"
  echo "  -t, --timestamp TIME             Specific timestamp for restore (optional)"
  echo "  -o, --overwrite                  Allow overwriting existing database (optional)"
  echo "  -h, --help                       Display this help message"
}

# Normalize long options into short options
NORMALIZED_ARGS=()
while [[ $# -gt 0 ]]; do
  case $1 in
    --account-name)
      NORMALIZED_ARGS+=("-a" "$2")
      shift 2
      ;;
    --resource-group)
      NORMALIZED_ARGS+=("-r" "$2")
      shift 2
      ;;
    --source-database)
      NORMALIZED_ARGS+=("-s" "$2")
      shift 2
      ;;
    --destination-database)
      NORMALIZED_ARGS+=("-d" "$2")
      shift 2
      ;;
    --location)
      NORMALIZED_ARGS+=("-l" "$2")
      shift 2
      ;;
    --timestamp)
      NORMALIZED_ARGS+=("-t" "$2")
      shift 2
      ;;
    --overwrite)
      NORMALIZED_ARGS+=("-o")
      shift
      ;;
    --help)
      NORMALIZED_ARGS+=("-h")
      shift
      ;;
    --*)
      echo "Invalid option: $1" >&2
      display_usage
      exit 1
      ;;
    *)
      NORMALIZED_ARGS+=("$1")
      shift
      ;;
  esac
done

# Replace the original arguments with the normalized ones
set -- "${NORMALIZED_ARGS[@]}"

# Parse command line arguments with getopts
while getopts "a:r:s:d:l:t:oh" opt; do
  case $opt in
    a) COSMOS_ACCOUNT_NAME="$OPTARG" ;;
    r) COSMOS_RESOURCE_GROUP="$OPTARG" ;;
    s) SOURCE_DATABASE_NAME="$OPTARG" ;;
    d) DESTINATION_DATABASE_NAME="$OPTARG" ;;
    l) LOCATION="$OPTARG" ;;
    t) RESTORE_TIMESTAMP="$OPTARG" ;;
    o) OVERWRITE=true ;;
    h) display_usage; exit 0 ;;
    \?) echo "Invalid option: -$OPTARG" >&2; display_usage; exit 1 ;;
  esac
done

# Validate required parameters
if [ -z "$COSMOS_ACCOUNT_NAME" ]; then
  echo "Error: Account name is required (use -a or --account-name)"
  display_usage
  exit 1
fi
if [ -z "$COSMOS_RESOURCE_GROUP" ]; then
  echo "Error: Resource group is required (use -r or --resource-group)"
  display_usage
  exit 1
fi
if [ -z "$SOURCE_DATABASE_NAME" ]; then
  echo "Error: Source database is required (use -s or --source-database)"
  display_usage
  exit 1
fi
if [ -z "$DESTINATION_DATABASE_NAME" ]; then
  echo "Error: Destination database is required (use -d or --destination-database)"
  display_usage
  exit 1
fi
if [ -z "$LOCATION" ]; then
  echo "Error: Location is required (use -l or --location)"
  display_usage
  exit 1
fi

# Get the instance ID of the Cosmos DB account
echo "Getting Cosmos DB account information..."
INSTANCE_ID=$(az cosmosdb show \
  --name "$COSMOS_ACCOUNT_NAME" \
  --resource-group "$COSMOS_RESOURCE_GROUP" \
  --query "instanceId" -o tsv)

if [ -z "$INSTANCE_ID" ]; then
  echo "Error: Unable to retrieve the instance ID for the Cosmos DB account."
  exit 1
fi

echo "Cosmos DB Instance ID: $INSTANCE_ID"

# Get all containers in the source database
echo "Retrieving containers from source database..."
CONTAINERS=$(az cosmosdb sql container list \
  --account-name "$COSMOS_ACCOUNT_NAME" \
  --resource-group "$COSMOS_RESOURCE_GROUP" \
  --database-name "$SOURCE_DATABASE_NAME" \
  --query "[].name" -o tsv)

if [ -z "$CONTAINERS" ]; then
  echo "Error: No containers found in the source database or database does not exist."
  exit 1
fi

echo "Found containers: $CONTAINERS"

# If the destination database doesn't exist, create it
echo "Checking if destination database exists..."
DEST_DB_EXISTS=$(az cosmosdb sql database show \
  --account-name "$COSMOS_ACCOUNT_NAME" \
  --resource-group "$COSMOS_RESOURCE_GROUP" \
  --name "$DESTINATION_DATABASE_NAME" 2>/dev/null)

if [ -z "$DEST_DB_EXISTS" ]; then
  echo "Creating destination database: $DESTINATION_DATABASE_NAME"
  az cosmosdb sql database create \
    --account-name "$COSMOS_ACCOUNT_NAME" \
    --resource-group "$COSMOS_RESOURCE_GROUP" \
    --name "$DESTINATION_DATABASE_NAME"
else
  echo "Destination database already exists: $DESTINATION_DATABASE_NAME"
  if [ "$OVERWRITE" != "true" ]; then
    echo "Overwrite not enabled. Skipping restore to avoid data loss."
    echo "Use --overwrite option to allow overwriting the existing database."
    exit 0
  fi
  echo "Overwrite flag enabled. Proceeding with restore..."
fi

# Process each container for restoration
for CONTAINER_NAME in $CONTAINERS; do
  echo "Processing container: $CONTAINER_NAME"

  # If timestamp is not provided, get the latest restorable timestamp
  if [ -z "$RESTORE_TIMESTAMP" ]; then
    echo "Retrieving latest restorable timestamp for container $CONTAINER_NAME..."
    LATEST_TIMESTAMP=$(az cosmosdb sql retrieve-latest-backup-time \
      --account-name "$COSMOS_ACCOUNT_NAME" \
      --resource-group "$COSMOS_RESOURCE_GROUP" \
      --database-name "$SOURCE_DATABASE_NAME" \
      --container-name "$CONTAINER_NAME" \
      --location "$LOCATION" \
      --query "continuousBackupInformation.latestRestorableTimestamp" -o tsv)

    if [ -z "$LATEST_TIMESTAMP" ]; then
      echo "Warning: Unable to retrieve the latest restorable timestamp for container $CONTAINER_NAME. Skipping..."
      continue
    fi

    TIMESTAMP_TO_USE=$LATEST_TIMESTAMP
  else
    TIMESTAMP_TO_USE=$RESTORE_TIMESTAMP
  fi

  echo "Using restore timestamp: $TIMESTAMP_TO_USE for container $CONTAINER_NAME"

  # Check if the container exists in the destination database
  DEST_CONTAINER_EXISTS=$(az cosmosdb sql container show \
    --account-name "$COSMOS_ACCOUNT_NAME" \
    --resource-group "$COSMOS_RESOURCE_GROUP" \
    --database-name "$DESTINATION_DATABASE_NAME" \
    --name "$CONTAINER_NAME" 2>/dev/null)

  # If container exists in destination, delete it first (required for restore)
  if [ ! -z "$DEST_CONTAINER_EXISTS" ]; then
    echo "Container $CONTAINER_NAME already exists in destination database."
    if [ "$OVERWRITE" == "true" ]; then
      echo "Overwrite flag enabled. Deleting existing container..."
      az cosmosdb sql container delete \
        --account-name "$COSMOS_ACCOUNT_NAME" \
        --resource-group "$COSMOS_RESOURCE_GROUP" \
        --database-name "$DESTINATION_DATABASE_NAME" \
        --name "$CONTAINER_NAME" \
        --yes
    else
      echo "Overwrite not enabled. Skipping container $CONTAINER_NAME to avoid data loss."
      continue
    fi
  fi

  # Get container properties to preserve configuration
  echo "Getting container properties from source..."
  CONTAINER_INFO=$(az cosmosdb sql container show \
    --account-name "$COSMOS_ACCOUNT_NAME" \
    --resource-group "$COSMOS_RESOURCE_GROUP" \
    --database-name "$SOURCE_DATABASE_NAME" \
    --name "$CONTAINER_NAME" 2>&1)

  # Check for "Resource Not Found" error
  if [[ $? -ne 0 && "$CONTAINER_INFO" == *"Resource Not Found"* ]]; then
    echo "Error: Container '$CONTAINER_NAME' not found in source database '$SOURCE_DATABASE_NAME'."
    exit 1
  fi

  PARTITION_KEY=$(echo $CONTAINER_INFO | jq -r '.resource.partitionKey.paths[0]')
  THROUGHPUT=$(az cosmosdb sql container throughput show \
    --account-name "$COSMOS_ACCOUNT_NAME" \
    --resource-group "$COSMOS_RESOURCE_GROUP" \
    --database-name "$SOURCE_DATABASE_NAME" \
    --name "$CONTAINER_NAME" \
    --query "resource.minimumThroughput" -o tsv 2>/dev/null)

  echo "Partition key: $PARTITION_KEY"
  echo "Throughput: $THROUGHPUT"

  # Restore the container
  echo "Restoring container $CONTAINER_NAME to destination database..."
  RESTORE_RESULT=$(az cosmosdb sql container restore \
    --account-name "$COSMOS_ACCOUNT_NAME" \
    --resource-group "$COSMOS_RESOURCE_GROUP" \
    --database-name "$DESTINATION_DATABASE_NAME" \
    --name "$CONTAINER_NAME" \
    --restore-timestamp "$TIMESTAMP_TO_USE" 2>&1)

  if [ $? -ne 0 ]; then
    echo "Error: Failed to restore container $CONTAINER_NAME"
    if [[ "$RESTORE_RESULT" == *"Resource Not Found"* ]]; then
      echo "Critical error: Container not available in backup."
      exit 1
    fi
    continue
  fi

  echo "Successfully initiated restore for container $CONTAINER_NAME"

  # Set throughput if it was retrieved successfully
  if [ ! -z "$THROUGHPUT" ] && [ "$THROUGHPUT" != "null" ]; then
    echo "Setting throughput to $THROUGHPUT RU/s for container $CONTAINER_NAME..."
    az cosmosdb sql container throughput update \
      --account-name "$COSMOS_ACCOUNT_NAME" \
      --resource-group "$COSMOS_RESOURCE_GROUP" \
      --database-name "$DESTINATION_DATABASE_NAME" \
      --name "$CONTAINER_NAME" \
      --throughput $THROUGHPUT
  fi
done

echo "Restoration process completed for all containers in database $SOURCE_DATABASE_NAME"
echo "Destination database: $DESTINATION_DATABASE_NAME"
