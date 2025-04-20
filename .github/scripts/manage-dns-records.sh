#!/bin/bash

# This script provides a function to manage DNS records in Cloudflare in an idempotent way.
# It can create new records or update existing ones, preventing duplicate entries.

# Function: manage_dns_record
# Description: Creates or updates a DNS record in Cloudflare
# Parameters:
#   $1 - record_type: The type of DNS record (e.g., A, CNAME, TXT)
#   $2 - record_name: The name of the record (e.g., @, www)
#   $3 - record_content: The content/value of the record
#   $4 - proxied: Whether the record should be proxied through Cloudflare (true/false)
#   $5 - zone_id: The Cloudflare Zone ID for the domain
#   $6 - api_token: The Cloudflare API token for authentication
manage_dns_record() {
    local record_type=$1
    local record_name=$2
    local record_content=$3
    local proxied=$4
    local zone_id=$5
    local api_token=$6

    # Check if the record already exists by querying Cloudflare's API
    # Returns the record ID if found, empty string if not
    RECORD_ID=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$zone_id/dns_records?type=$record_type&name=$record_name" \
        -H "Authorization: Bearer $api_token" \
        -H "Content-Type: application/json" | \
        jq -r '.result[0].id // ""')

    if [ -n "$RECORD_ID" ]; then
        # If record exists, update it with new content
        echo "::warning::DNS record already exists for $record_type $record_name. Updating existing record."
        curl -s -X PUT "https://api.cloudflare.com/client/v4/zones/$zone_id/dns_records/$RECORD_ID" \
            -H "Authorization: Bearer $api_token" \
            -H "Content-Type: application/json" \
            --data "{\"type\":\"$record_type\",\"name\":\"$record_name\",\"content\":\"$record_content\",\"ttl\":1,\"proxied\":$proxied}"
    else
        # If record doesn't exist, create a new one
        echo "Creating new DNS record for $record_type $record_name"
        curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$zone_id/dns_records" \
            -H "Authorization: Bearer $api_token" \
            -H "Content-Type: application/json" \
            --data "{\"type\":\"$record_type\",\"name\":\"$record_name\",\"content\":\"$record_content\",\"ttl\":1,\"proxied\":$proxied}"
    fi
}
