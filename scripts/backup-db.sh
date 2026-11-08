#!/bin/sh
# Daily Postgres backup. Run from cron on the server, e.g.
#   30 2 * * * /opt/kijitalk/scripts/backup-db.sh >> /var/log/kijitalk-backup.log 2>&1
# Keeps BACKUP_KEEP_DAYS (default 14) of compressed dumps in BACKUP_DIR.
# Restore:  gunzip -c FILE.sql.gz | docker compose -f deploy/docker-compose.yml exec -T db psql -U kijitalk -d kijitalk
set -eu
BACKUP_DIR="${BACKUP_DIR:-/var/backups/kijitalk}"
KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
COMPOSE="${COMPOSE_FILE:-$(dirname "$0")/../deploy/docker-compose.yml}"
mkdir -p "$BACKUP_DIR"
FILE="$BACKUP_DIR/kijitalk-$(date -u +%Y%m%dT%H%M%SZ).sql.gz"
docker compose -f "$COMPOSE" exec -T db pg_dump -U kijitalk -d kijitalk --no-owner | gzip -9 > "$FILE"
# Refuse to keep an empty or truncated dump.
[ "$(gunzip -c "$FILE" | head -c 1024 | wc -c)" -gt 100 ] || { echo "Backup looks empty: $FILE"; rm -f "$FILE"; exit 1; }
find "$BACKUP_DIR" -name 'kijitalk-*.sql.gz' -mtime +"$KEEP_DAYS" -delete
echo "Backup ok: $FILE ($(du -h "$FILE" | cut -f1))"
