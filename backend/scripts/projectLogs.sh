#!/bin/bash

echo "========== BACKEND LOG =========="
tail -n 30 /tmp/smartestate-backend.log 2>/dev/null ||
  echo "Backend log not found."

echo
echo "========== FRONTEND LOG =========="
tail -n 30 /tmp/smartestate-frontend.log 2>/dev/null ||
  echo "Frontend log not found."
