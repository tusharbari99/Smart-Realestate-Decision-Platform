#!/bin/bash

set -e

BACKEND_DIR="$HOME/Desktop/smart-real-estate-backend"
FRONTEND_DIR="$HOME/Desktop/smart-real-estate-frontend"

echo
echo "================================="
echo " SmartEstate Final Project Audit"
echo "================================="
echo

echo "1. Starting project..."
cd "$BACKEND_DIR"
npm run project:start

echo
echo "2. Checking backend files..."
npm run check

echo
echo "3. Checking frontend production build..."
cd "$FRONTEND_DIR"
npm run check

echo
echo "4. Testing frontend, backend, APIs, and security..."
cd "$BACKEND_DIR"
npm run project:test

echo
echo "5. Creating database backup..."
npm run backup:db

echo
echo "6. Creating complete project backup..."
npm run backup:project

echo
echo "================================="
echo " Final Audit Successful"
echo "================================="
echo
echo "SmartEstate is ready for final user testing."
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:5001"
