#!/usr/bin/env python3
"""Deploy to Netlify using the env token and subprocess."""
import os
import subprocess
import sys

token = os.environ.get('NETLIFY_AUTH_TOKEN', '')
if not token:
    print("NETLIFY_AUTH_TOKEN not found")
    sys.exit(1)

print(f"Token found: {token[:8]}...{token[-4:]}")

# Use subprocess to run netlify deploy - subprocesses inherit env
env = os.environ.copy()
env['NETLIFY_AUTH_TOKEN'] = token

result = subprocess.run(
    ['npx', 'netlify-cli', 'deploy', '--build', '--prod'],
    cwd='/opt/data/devsnips',
    env=env,
    capture_output=True,
    text=True,
    timeout=300
)

print("STDOUT:", result.stdout[-2000:] if result.stdout else "")
print("STDERR:", result.stderr[-2000:] if result.stderr else "")
print("Exit:", result.returncode)
