#!/bin/bash
# Wrapper for neonctl with API key from file
API_KEY=$(cat /opt/data/devsnips/.neon-api-key)
exec npx neonctl "$@" --api-key "$API_KEY"
