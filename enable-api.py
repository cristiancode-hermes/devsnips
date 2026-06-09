#!/usr/bin/env python3
"""Enable Neon Data API via REST API."""
import json
import urllib.request
import urllib.error
import os

api_key_path = '/opt/data/devsnips/.neon-api-key'
with open(api_key_path) as f:
    api_key = f.read().strip()

base = "https://console.neon.tech/api/v2"

def api(method, path, data=None):
    url = f"{base}{path}"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        resp = urllib.request.urlopen(req)
        return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return {"error": e.code, "body": e.read().decode()}

# 1. Check current databases
print("=== DATABASES ===")
dbs = api("GET", "/projects/raspy-star-93431686/branches/br-wispy-dew-abytefxv/databases")
print(json.dumps(dbs, indent=2)[:2000])

# 2. Enable Data API on neondb
print("\n=== ENABLE DATA API ===")
result = api("PATCH", "/projects/raspy-star-93431686/branches/br-wispy-dew-abytefxv/databases/neondb",
             {"database": {"provision_data_api": True}})
print(json.dumps(result, indent=2)[:2000])
