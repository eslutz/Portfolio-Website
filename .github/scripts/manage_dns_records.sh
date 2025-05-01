#!/bin/bash

manage_dns_record() {
  # Default values
  local RECORD_TYPE=""
  local RECORD_NAME=""
  local RECORD_CONTENT=""
  local PROXIED="false"
  local CF_TOKEN=""
  local ZONE_ID=""

  # Normalize long options into short options
  NORMALIZED_ARGS=()
  while [[ $# -gt 0 ]]; do
    case $1 in
      --type)
        NORMALIZED_ARGS+=("-t" "$2")
        shift 2
        ;;
      --name)
        NORMALIZED_ARGS+=("-n" "$2")
        shift 2
        ;;
      --content)
        NORMALIZED_ARGS+=("-c" "$2")
        shift 2
        ;;
      --proxied)
        NORMALIZED_ARGS+=("-p" "$2")
        shift 2
        ;;
      --cf-token)
        NORMALIZED_ARGS+=("-k" "$2")
        shift 2
        ;;
      --zone-id)
        NORMALIZED_ARGS+=("-z" "$2")
        shift 2
        ;;
      --*)
        echo "::error::Unknown option: $1" >&2
        return 1
        ;;
      -*)
        # Handle short options
        if [[ "$1" =~ ^-[tncpkz]$ ]]; then
          NORMALIZED_ARGS+=("$1" "$2")
          shift 2
        else
          echo "::error::Unknown option: $1" >&2
          return 1
        fi
        ;;
      *)
        echo "::error::Unexpected argument: $1" >&2
        return 1
        ;;
    esac
  done

  # Reset the positional parameters to the normalized arguments
  set -- "${NORMALIZED_ARGS[@]}"

  # Debug: Print the normalized arguments
  echo "DEBUG: Normalized arguments: $@" >&2

  # Parse command line arguments with getopts
  OPTIND=1 # Reset the option index
  while getopts "t:n:c:p:k:z:" opt; do
    case $opt in
      t) RECORD_TYPE="$OPTARG" ;;
      n) RECORD_NAME="$OPTARG" ;;
      c) RECORD_CONTENT="$OPTARG" ;;
      p) PROXIED="$OPTARG" ;;
      k) CF_TOKEN="$OPTARG" ;;
      z) ZONE_ID="$OPTARG" ;;
      \?) echo "::error::Invalid option: -$OPTARG" >&2; return 1 ;;
      :) echo "::error::Option -$OPTARG requires an argument" >&2; return 1 ;;
    esac
  done

  # Debug: Print parsed values
  echo "DEBUG: RECORD_TYPE: $RECORD_TYPE" >&2
  echo "DEBUG: RECORD_NAME: $RECORD_NAME" >&2
  echo "DEBUG: RECORD_CONTENT: $RECORD_CONTENT" >&2
  echo "DEBUG: PROXIED: $PROXIED" >&2
  echo "DEBUG: ZONE_ID: $ZONE_ID" >&2

  # Validate required parameters
  if [ -z "$RECORD_TYPE" ]; then
    echo "::error::Record type is required (use -t or --type)"
    return 1
  fi
  if [ -z "$RECORD_NAME" ]; then
    echo "::error::Record name is required (use -n or --name)"
    return 1
  fi
  if [ -z "$RECORD_CONTENT" ]; then
    echo "::error::Record content is required (use -c or --content)"
    return 1
  fi
  if [ -z "$CF_TOKEN" ]; then
    echo "::error::Cloudflare token is required (use --cf-token)"
    return 1
  fi
  if [ -z "$ZONE_ID" ]; then
    echo "::error::Zone ID is required (use -z or --zone-id)"
    return 1
  fi

  # Get existing record of this type + name
  RECORD_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records?type=$RECORD_TYPE&name=$RECORD_NAME" \
      -H "Authorization: Bearer $CF_TOKEN" \
      -H "Content-Type: application/json")

  # Check if the GET request was successful
  if ! echo "$RECORD_RESPONSE" | jq -e '.success' > /dev/null; then
    echo "::error::Failed to check existing $RECORD_TYPE record for $RECORD_NAME: $(echo "$RECORD_RESPONSE" | jq -r '.errors[0].message')"
    return 1
  fi

  RECORD_ID=$(echo "$RECORD_RESPONSE" | jq -r '.result[0].id // empty')
  CURRENT_CONTENT=$(echo "$RECORD_RESPONSE" | jq -r '.result[0].content // empty')
  COMMENT="Azure SWA custom domain validation"

  # If it's a TXT record, wrap the content in quotes
  if [ "$RECORD_TYPE" = "TXT" ]; then
    # Remove any existing quotes first, then add new ones to ensure proper formatting
    RECORD_CONTENT=$(echo "$RECORD_CONTENT" | sed 's/^"//;s/"$//')
    RECORD_CONTENT="\"$RECORD_CONTENT\""
  fi

  DATA="$(jq -n \
    --arg type "$RECORD_TYPE" \
    --arg name "$RECORD_NAME" \
    --arg content "$RECORD_CONTENT" \
    --argjson proxied "$PROXIED" \
    --arg comment "$COMMENT" \
    '{type: $type, name: $name, content: $content, ttl: 1, proxied: $proxied, comment: $comment}')"

  if [ -n "$RECORD_ID" ]; then
    if [ "$CURRENT_CONTENT" = "$RECORD_CONTENT" ]; then
      echo "$RECORD_TYPE record for $RECORD_NAME: No changes needed (content matches)"
      return 0
    fi

    RESPONSE=$(curl -s -X PUT "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$RECORD_ID" \
      -H "Authorization: Bearer $CF_TOKEN" \
      -H "Content-Type: application/json" \
      --data "$DATA")

    if ! echo "$RESPONSE" | jq -e '.success' > /dev/null; then
      echo "::error::Failed to update $RECORD_TYPE record for $RECORD_NAME: $(echo "$RESPONSE" | jq -r '.errors[0].message')"
      return 1
    fi
    echo "$RECORD_TYPE record for $RECORD_NAME: Updated successfully"
  else
    RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
      -H "Authorization: Bearer $CF_TOKEN" \
      -H "Content-Type: application/json" \
      --data "$DATA")

    if ! echo "$RESPONSE" | jq -e '.success' > /dev/null; then
      echo "::error::Failed to create $RECORD_TYPE record for $RECORD_NAME: $(echo "$RESPONSE" | jq -r '.errors[0].message')"
      return 1
    fi
    echo "$RECORD_TYPE record for $RECORD_NAME: Created successfully"
  fi
}
