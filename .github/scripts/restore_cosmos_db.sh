#!/bin/bash

# Default values
COSMOS_ACCOUNT_NAME=""
COSMOS_RESOURCE_GROUP=""
SOURCE_DATABASE_NAME=""
CONTAINER_NAME=""
DESTINATION_DATABASE_NAME=""
LOCATION=""

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
    --container)
      NORMALIZED_ARGS+=("-c" "$2")
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
    --*)
      echo "Invalid option: $1" >&2
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
while getopts "a:r:s:c:d:l:" opt; do
  case $opt in
    a) COSMOS_ACCOUNT_NAME="$OPTARG" ;;
    r) COSMOS_RESOURCE_GROUP="$OPTARG" ;;
    s) SOURCE_DATABASE_NAME="$OPTARG" ;;
    c) CONTAINER_NAME="$OPTARG" ;;
    d) DESTINATION_DATABASE_NAME="$OPTARG" ;;
    l) LOCATION="$OPTARG" ;;
    \?) echo "Invalid option: -$OPTARG" >&2; exit 1 ;;
  esac
done

# Shift processed options
shift $((OPTIND - 1))

# Validate required parameters
if [ -z "$COSMOS_ACCOUNT_NAME" ]; then
  echo "Error: Account name is required (use -a or --account-name)"
  exit 1
fi
if [ -z "$COSMOS_RESOURCE_GROUP" ]; then
  echo "Error: Resource group is required (use -r or --resource-group)"
  exit 1
fi
if [ -z "$SOURCE_DATABASE_NAME" ]; then
  echo "Error: Source database is required (use -s or --source-database)"
  exit 1
fi
if [ -z "$CONTAINER_NAME" ]; then
  echo "Error: Container name is required (use -c or --container-name)"
  exit 1
fi
if [ -z "$DESTINATION_DATABASE_NAME" ]; then
  echo "Error: Destination database is required (use -d or --destination-database)"
  exit 1
fi
if [ -z "$LOCATION" ]; then
  echo "Error: Location is required (use -l or --location)"
  exit 1
fi

# Directly construct the source database ID for the restore operation
SOURCE_DB_ID="dbs/$SOURCE_DATABASE_NAME"
echo "Using source database ID: $SOURCE_DB_ID"
echo "Restoring to database: $DESTINATION_DATABASE_NAME"

# Get the instance ID of the Cosmos DB account
INSTANCE_ID=$(az cosmosdb show \
  --name "$COSMOS_ACCOUNT_NAME" \
  --resource-group "$COSMOS_RESOURCE_GROUP" \
  --query "instanceId" -o tsv)
echo "Instance ID: $INSTANCE_ID"

# Get the latest restorable timestamp for the source database and container
LATEST_TIMESTAMP=$(az cosmosdb sql retrieve-latest-backup-time \
  --account-name "$COSMOS_ACCOUNT_NAME" \
  --resource-group "$COSMOS_RESOURCE_GROUP" \
  --database-name "$SOURCE_DATABASE_NAME" \
  --container-name "$CONTAINER_NAME" \
  --location "$LOCATION" \
  --query "continuousBackupInformation.latestRestorableTimestamp" -o tsv)

if [ -z "$LATEST_TIMESTAMP" ]; then
  echo "Error: Unable to retrieve the latest restorable timestamp for the source database and container."
  exit 1
fi

echo "Latest timestamp where database and container existed: $LATEST_TIMESTAMP"

# Restore the container using the latest valid timestamp
az cosmosdb sql container restore \
  --account-name "$COSMOS_ACCOUNT_NAME" \
  --resource-group "$COSMOS_RESOURCE_GROUP" \
  --database-name "$DESTINATION_DATABASE_NAME" \
  --name "$CONTAINER_NAME" \
  --restore-timestamp "$LATEST_TIMESTAMP" \
  --source-container-id "dbs/$SOURCE_DATABASE_NAME/colls/$CONTAINER_NAME"
