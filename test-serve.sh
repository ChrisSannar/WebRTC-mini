#!/bin/bash

# Test script to verify static file serving
# Starts serve, checks URLs, reports status, kills serve

PORT=3001
DIR="apps/example"

echo "Starting serve on port $PORT..."
npx serve "$DIR" -l $PORT &
SERVER_PID=$!

# Wait for server to start
sleep 2

echo ""
echo "=== Testing URLs ==="
echo ""

check_url() {
  local url=$1
  local status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT$url")
  if [ "$status" = "200" ]; then
    echo "✓ $url - $status"
  else
    echo "✗ $url - $status"
  fi
}

check_url "/"
check_url "/index.html"
check_url "/dist/index.js"
check_url "/dist/webrtc-peer.js"
check_url "/dist/helpers/create-peer-connection.js"
check_url "/dist/config/ice-servers.js"

echo ""
echo "=== Killing server (PID: $SERVER_PID) ==="
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null

echo "Done."
