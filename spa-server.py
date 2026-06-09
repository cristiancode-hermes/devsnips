#!/usr/bin/env python3
"""Simple SPA HTTP server - rewrites non-file, non-API routes to index.html"""
import http.server
import os
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 5200
DIR = sys.argv[2] if len(sys.argv) > 2 else '.'

class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIR, **kwargs)

    def do_GET(self):
        # Don't rewrite API routes
        if self.path.startswith('/api/'):
            self.send_response(404)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{"error":"API only available in production"}')
            return

        # Check if the path corresponds to an existing file
        file_path = os.path.join(DIR, self.path.lstrip('/'))
        if not os.path.exists(file_path) or os.path.isdir(file_path):
            # SPA rewrite: serve index.html for non-file routes
            self.path = '/index.html'
        return super().do_GET()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

if __name__ == '__main__':
    httpd = http.server.HTTPServer(('0.0.0.0', PORT), SPAHandler)
    print(f'SPA server at http://localhost:{PORT}')
    httpd.serve_forever()
