#!/bin/bash
API_KEY=*** /opt/data/devsnips/.neon-api-key)

echo "=== BRANCHES ==="
curl -s -X GET "https://console.neon.tech/api/v2/projects/raspy-star-93431686/branches" \
  -H "Authorization: Bearer *** \
  -H "Accept: application/json" | python3 -m json.tool 2>&1 | head -40

echo ""
echo "=== ROLES ==="
curl -s -X GET "https://console.neon.tech/api/v2/projects/raspy-star-93431686/branches/br-wispy-dew-abytefxv/roles" \
  -H "Authorization: Bearer *** \
  -H "Accept: application/json" | python3 -m json.tool 2>&1 | head -40

echo ""
echo "=== CREATE DATA API ==="
DATA=$(jq -n --arg api_key "$API_KEY" '{
  "database": {"provision_data_api": true}
}')
curl -s -X PATCH "https://console.neon.tech/api/v2/projects/raspy-star-93431686/branches/br-wispy-dew-abytefxv/databases/neondb" \
  -H "Authorization: Bearer *** \
  -H "Content-Type: application/json" \
  -d '{"database": {"provision_data_api": true}}' | python3 -m json.tool 2>&1 | head -30
