#!/bin/bash

manage_dns_record() {
  local RECORD_TYPE=$1
  local RECORD_NAME=$2
  local RECORD_CONTENT=$3
  local PROXIED=$4
  local CF_TOKEN=$5
  local ZONE_ID=$6

  # Get existing record of this type + name
  RECORD_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records?type=$RECORD_TYPE&name=$RECORD_NAME" \
      -H "Authorization: Bearer $CF_TOKEN" \
      -H "Content-Type: application/json")

  # Check if the GET request was successful
  if ! echo "$RECORD_RESPONSE" | jq -e '.success' > /dev/null; then
    echo "❌ Failed to check existing $RECORD_TYPE record for $RECORD_NAME: $(echo "$RECORD_RESPONSE" | jq -r '.errors[0].message')"
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
      echo "✅ $RECORD_TYPE record for $RECORD_NAME: No changes needed (content matches)"
      return 0
    fi

    RESPONSE=$(curl -s -X PUT "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$RECORD_ID" \
      -H "Authorization: Bearer $CF_TOKEN" \
      -H "Content-Type: application/json" \
      --data "$DATA")

    if ! echo "$RESPONSE" | jq -e '.success' > /dev/null; then
      echo "❌ Failed to update $RECORD_TYPE record for $RECORD_NAME: $(echo "$RESPONSE" | jq -r '.errors[0].message')"
      return 1
    fi
    echo "✅ $RECORD_TYPE record for $RECORD_NAME: Updated successfully"
  else
    RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
      -H "Authorization: Bearer $CF_TOKEN" \
      -H "Content-Type: application/json" \
      --data "$DATA")

    if ! echo "$RESPONSE" | jq -e '.success' > /dev/null; then
      echo "❌ Failed to create $RECORD_TYPE record for $RECORD_NAME: $(echo "$RESPONSE" | jq -r '.errors[0].message')"
      return 1
    fi
    echo "✅ $RECORD_TYPE record for $RECORD_NAME: Created successfully"
  fi
}
