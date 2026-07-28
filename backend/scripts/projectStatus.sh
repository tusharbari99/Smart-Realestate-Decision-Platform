#!/bin/bash

echo "SmartEstate Status"
echo "------------------"

if curl -s --max-time 3 http://localhost:5001/api/health >/dev/null; then
  echo "✓ Backend: Running on port 5001"
else
  echo "✗ Backend: Not running"
fi

if curl -s --max-time 3 http://localhost:5173 >/dev/null; then
  echo "✓ Frontend: Running on port 5173"
else
  echo "✗ Frontend: Not running"
fi

echo
echo "Backend process:"
lsof -nP -iTCP:5001 -sTCP:LISTEN 2>/dev/null || echo "No process"

echo
echo "Frontend process:"
lsof -nP -iTCP:5173 -sTCP:LISTEN 2>/dev/null || echo "No process"
