#!/bin/bash

set -e

MYSQLDUMP="/Applications/XAMPP/xamppfiles/bin/mysqldump"
BACKUP_DIR="$(cd "$(dirname "$0")/.." && pwd)/backups"
DATE_TIME="$(date +"%Y-%m-%d_%H-%M-%S")"
BACKUP_FILE="$BACKUP_DIR/smart_real_estate_$DATE_TIME.sql"

mkdir -p "$BACKUP_DIR"

if [ ! -x "$MYSQLDUMP" ]; then
  echo "XAMPP mysqldump not found."
  exit 1
fi

"$MYSQLDUMP" \
  -u root \
  --single-transaction \
  --routines \
  --triggers \
  smart_real_estate > "$BACKUP_FILE"

echo
echo "Database backup created:"
echo "$BACKUP_FILE"
