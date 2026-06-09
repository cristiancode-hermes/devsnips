#!/bin/bash
API_KEY=$(cat /opt/data/devsnips/.neon-api-key)
npx neonctl roles list --project-id raspy-star-93431686 --api-key "$API_KEY" 2>&1
