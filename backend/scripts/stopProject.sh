#!/bin/bash

echo "Stopping SmartEstate servers..."

BACKEND_PID="$(lsof -ti tcp:5001 2>/dev/null)"
FRONTEND_PID="$(lsof -ti tcp:5173 2>/dev/null)"

if [ -n "$BACKEND_PID" ]; then
  echo "$BACKEND_PID" | xargs kill -9
  echo "✓ Backend stopped."
else
  echo "Backend was not running."
fi

if [ -n "$FRONTEND_PID" ]; then
  echo "$FRONTEND_PID" | xargs kill -9
  echo "✓ Frontend stopped."
else
  echo "Frontend was not running."
fi
