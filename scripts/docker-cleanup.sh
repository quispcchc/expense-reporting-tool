#!/bin/bash
# docker-cleanup.sh - Docker Resource Cleanup Script
# Run weekly via cron: 0 4 * * 0 /path/to/scripts/docker-cleanup.sh >> /var/log/docker-cleanup.log 2>&1

set -e

LOG_FILE="/var/log/docker-cleanup.log"
DAYS_OLD="${CLEANUP_DAYS:-7}"  # Remove resources older than this

log_info() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] $1"; }
log_warn() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [WARN] $1"; }

# Check if Docker is running
if ! docker info &> /dev/null; then
    log_warn "Docker is not running. Skipping cleanup."
    exit 0
fi

log_info "=========================================="
log_info "Starting Docker cleanup"
log_info "=========================================="

# Show current disk usage
log_info "Current Docker disk usage:"
docker system df

# Remove stopped containers
log_info "Removing stopped containers..."
docker container prune -f

# Remove dangling images (untagged)
log_info "Removing dangling images..."
docker image prune -f

# Remove unused images older than specified days
log_info "Removing unused images older than ${DAYS_OLD} days..."
docker image prune -a -f --filter "until=${DAYS_OLD}d" 2>/dev/null || true

# Remove unused networks
log_info "Removing unused networks..."
docker network prune -f

# Remove build cache older than specified days
log_info "Removing build cache older than ${DAYS_OLD} days..."
docker builder prune -f --filter "until=${DAYS_OLD}d" 2>/dev/null || true

# Note: We intentionally do NOT prune volumes automatically
# as they may contain important data (databases, uploads)
log_warn "Volumes are NOT automatically pruned. To manually prune:"
log_warn "  docker volume prune -f  (CAUTION: may delete data)"

# Show final disk usage
log_info "Docker disk usage after cleanup:"
docker system df

log_info "=========================================="
log_info "Docker cleanup complete"
log_info "=========================================="

# Optional: Alert if disk usage is still high
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | tr -d '%')
if [ "$DISK_USAGE" -gt 80 ]; then
    log_warn "WARNING: Disk usage is at ${DISK_USAGE}%"
fi
