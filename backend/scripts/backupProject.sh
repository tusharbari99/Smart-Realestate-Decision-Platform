#!/bin/bash

set -e

BACKEND_DIR="$HOME/Desktop/smart-real-estate-backend"
FRONTEND_DIR="$HOME/Desktop/smart-real-estate-frontend"
BACKUP_DIR="$HOME/Desktop/SmartEstate-Backups"
DATE_TIME="$(date +"%Y-%m-%d_%H-%M-%S")"
BACKUP_FILE="$BACKUP_DIR/SmartEstate_$DATE_TIME.zip"

mkdir -p "$BACKUP_DIR"

cd "$HOME/Desktop"

zip -rq "$BACKUP_FILE" \
  smart-real-estate-backend \
  smart-real-estate-frontend \
  -x "*/node_modules/*" \
  -x "*/dist/*" \
  -x "*/.git/*" \
  -x "*/backups/*" \
  -x "*/.env"

echo
echo "Complete project backup created:"
echo "$BACKUP_FILE"
