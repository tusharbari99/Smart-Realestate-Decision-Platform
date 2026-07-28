#!/bin/bash

BACKEND_DIR="$HOME/Desktop/smart-real-estate-backend"
FRONTEND_DIR="$HOME/Desktop/smart-real-estate-frontend"

BACKEND_LOG="/tmp/smartestate-backend.log"
FRONTEND_LOG="/tmp/smartestate-frontend.log"

echo "Stopping old SmartEstate servers..."

lsof -ti tcp:5001 | xargs kill -9 2>/dev/null || true
lsof -ti tcp:5173 | xargs kill -9 2>/dev/null || true

sleep 1

echo "Starting backend..."

cd "$BACKEND_DIR" || exit 1
nohup npm start > "$BACKEND_LOG" 2>&1 &

echo "Starting frontend..."

cd "$FRONTEND_DIR" || exit 1
nohup npm run dev -- --host 0.0.0.0 > "$FRONTEND_LOG" 2>&1 &

sleep 4

echo
echo "Checking servers..."

if curl -s --max-time 5 http://localhost:5001/api/health >/dev/null; then
  echo "✓ Backend running: http://localhost:5001"
else
  echo "✗ Backend did not start."
  echo "Check: $BACKEND_LOG"
fi

if curl -s --max-time 5 http://localhost:5173 >/dev/null; then
  echo "✓ Frontend running: http://localhost:5173"
else
  echo "✗ Frontend did not start."
  echo "Check: $FRONTEND_LOG"
fi

echo
echo "SmartEstate start process completed."
