#!/usr/bin/env python3
"""Connect to Neon DB, drop anonymous role, then enable Data API."""
import json, urllib.request, urllib.error, os

# --- First: DB connection to drop anonymous role ---
import pg8000

# Read the DB password from the connection string
# Let's use neonctl to get it cleanly, but we stored the API key
conn = pg8000.connect(
    host="ep-old-star-abhpdbpp.eu-west-2.aws.neon.tech",
    port=5432,
    database="neondb",
    user="neondb_owner",
    password="***",
    ssl_context=True
)

cur = conn.cursor()
cur.execute("SELECT current_database(), current_user, version()")
row = cur.fetchone()
print(f"Connected: db={row[0]}, user={row[1]}")
print(f"Version: {row[2]}")

# Check schemas
cur.execute("SELECT schema_name FROM information_schema.schemata")
schemas = [r[0] for r in cur.fetchall()]
print(f"Schemas: {schemas}")

# Drop anonymous role if it exists
cur.execute("DROP ROLE IF EXISTS anonymous;")
conn.commit()
print("Dropped anonymous role (if existed)")

# Verify roles
cur.execute("SELECT rolname FROM pg_roles WHERE rolname IN ('anonymous', 'authenticated', 'neondb_owner')")
roles = [r[0] for r in cur.fetchall()]
print(f"Roles remaining: {roles}")

cur.close()
conn.close()

# --- Second: Enable Data API via REST ---
print("\n=== Enabling Data API via REST ===")
api_key_path = '/opt/data/devsnips/.neon-api-key'
with open(api_key_path) as f:
    api_key = f.read().strip()

def api_call(method, path, data=None):
    url = f"https://console.neon.tech/api/v2{path}"
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

# Try PATCH with allow_api_over_v2
result = api_call("PATCH",
    "/projects/raspy-star-93431686/branches/br-wispy-dew-abytefxv/databases/neondb",
    {"database": {"allow_api_over_v2": True}})
print(f"allow_api_over_v2: {json.dumps(result, indent=2)[:500]}")

# Try with provision_data_api = True
result2 = api_call("PATCH",
    "/projects/raspy-star-93431686/branches/br-wispy-dew-abytefxv",
    {"branch": {"provision_data_api": True}})
print(f"\nbranch.provision_data_api: {json.dumps(result2, indent=2)[:500]}")
