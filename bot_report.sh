#!/bin/bash
# bot_report.sh - Nginx bot traffic report
# Usage: ./bot_report.sh [access_log_path] [error_log_path]
# Defaults to standard Nginx log locations

ACCESS_LOG="${1:-/var/log/nginx/access.log}"
ERROR_LOG="${2:-/var/log/nginx/error.log}"

echo "========================================"
echo "  BOT TRAFFIC REPORT"
echo "  $(date)"
echo "  Access log: $ACCESS_LOG"
echo "  Error log:  $ERROR_LOG"
echo "========================================"

# --- TOP IPs BY REQUEST COUNT ---
echo ""
echo "--- TOP 20 IPs BY REQUEST COUNT ---"
awk '{print $1}' "$ACCESS_LOG" | sort | uniq -c | sort -rn | head -n 20

# --- IPs WITH 500+ REQUESTS (LIKELY BOTS) ---
echo ""
echo "--- IPs WITH 500+ REQUESTS (LIKELY BOTS) ---"
awk '{print $1}' "$ACCESS_LOG" | sort | uniq -c | sort -rn | awk '$1 > 500'

# --- TOP IPs HITTING VAL_Data_Explorers ---
echo ""
echo "--- TOP 20 IPs HITTING /VAL_Data_Explorers/ ---"
grep "VAL_Data_Explorers" "$ACCESS_LOG" | awk '{print $1}' | sort | uniq -c | sort -rn | head -n 20

# --- BLOCKED IPs (403 RESPONSES) ---
echo ""
echo "--- TOP 20 BLOCKED IPs (403 RESPONSES) ---"
awk '$9 == 403 {print $1}' "$ACCESS_LOG" | sort | uniq -c | sort -rn | head -n 20

# --- BLOCKED IP TOTAL COUNT ---
BLOCKED_COUNT=$(awk '$9 == 403' "$ACCESS_LOG" | wc -l)
echo ""
echo "Total 403 blocked requests: $BLOCKED_COUNT"

# --- KNOWN BLOCKED SUBNETS ---
echo ""
echo "--- HITS FROM KNOWN BLOCKED SUBNETS ---"
echo -n "  202.46.32.0/19 (Shanghai263):  "
grep -c "202\.46\.\(3[2-9]\|[45][0-9]\|6[0-3]\)\." "$ACCESS_LOG"
echo -n "  116.128.0.0/10 (China Unicom): "
grep -c "116\.1[2-8][0-9]\.\|116\.19[01]\." "$ACCESS_LOG"

# --- SUSPICIOUS USER AGENTS ---
echo ""
echo "--- TOP 20 USER AGENTS ---"
awk -F'"' '{print $6}' "$ACCESS_LOG" | sort | uniq -c | sort -rn | head -n 20

# --- EMPTY USER AGENTS ---
echo ""
echo -n "Requests with empty user agent: "
awk -F'"' '$6 == "-" || $6 == ""' "$ACCESS_LOG" | wc -l

# --- REQUESTS PER HOUR (LAST 24 HOURS) ---
echo ""
echo "--- REQUESTS PER HOUR (TODAY) ---"
TODAY=$(date +%d/%b/%Y)
grep "$TODAY" "$ACCESS_LOG" | awk '{print $4}' | cut -d: -f1,2 | uniq -c | sort -t'[' -k2

# --- TOP REQUESTED PATHS ---
echo ""
echo "--- TOP 20 REQUESTED PATHS ---"
awk '{print $7}' "$ACCESS_LOG" | sort | uniq -c | sort -rn | head -n 20

# --- ERROR LOG SUMMARY ---
echo ""
echo "--- ERROR LOG: TOP 20 IPs ---"
grep -oP 'client: \K[0-9.]+' "$ERROR_LOG" | sort | uniq -c | sort -rn | head -n 20

# --- RATE LIMITED REQUESTS ---
echo ""
echo -n "Rate limited requests (error log): "
grep -c "limiting requests" "$ERROR_LOG"

# --- SCAN ACROSS ROTATED LOGS ---
echo ""
echo "--- BLOCKED SUBNET HITS ACROSS ALL LOGS ---"
echo -n "  202.46.32.0/19 (all logs): "
zgrep -c "202\.46\.\(3[2-9]\|[45][0-9]\|6[0-3]\)\." /var/log/nginx/access.log* 2>/dev/null | awk -F: '{sum+=$2} END {print sum}'
echo -n "  116.128.0.0/10 (all logs): "
zgrep -c "116\.1[2-8][0-9]\.\|116\.19[01]\." /var/log/nginx/access.log* 2>/dev/null | awk -F: '{sum+=$2} END {print sum}'

# ==========================================
# LOG HEALTH & SIZE REPORT
# ==========================================
echo ""
echo "========================================"
echo "  LOG HEALTH & SIZE REPORT"
echo "========================================"

# --- CURRENT LOG FILE SIZES ---
echo ""
echo "--- CURRENT LOG FILE SIZES ---"
echo "  Access logs:"
ls -lh /var/log/nginx/access.log* 2>/dev/null | awk '{printf "    %-50s %s\n", $NF, $5}'
echo ""
echo "  Error logs:"
ls -lh /var/log/nginx/error.log* 2>/dev/null | awk '{printf "    %-50s %s\n", $NF, $5}'

# --- TOTAL LOG DISK USAGE ---
echo ""
echo -n "  Total nginx log disk usage: "
du -sh /var/log/nginx/ 2>/dev/null | awk '{print $1}'

# --- LOG FILE COUNT ---
echo ""
ACCESS_COUNT=$(ls /var/log/nginx/access.log* 2>/dev/null | wc -l)
ERROR_COUNT=$(ls /var/log/nginx/error.log* 2>/dev/null | wc -l)
echo "  Access log files (current + rotated): $ACCESS_COUNT"
echo "  Error log files (current + rotated):  $ERROR_COUNT"

# --- LOG DATE RANGES ---
echo ""
echo "--- LOG DATE RANGES ---"
echo -n "  Current access log first entry: "
head -n 1 "$ACCESS_LOG" 2>/dev/null | awk '{print $4}' | tr -d '['
echo -n "  Current access log last entry:  "
tail -n 1 "$ACCESS_LOG" 2>/dev/null | awk '{print $4}' | tr -d '['
echo ""
echo -n "  Current error log first entry:  "
head -n 1 "$ERROR_LOG" 2>/dev/null | awk '{print $1, $2}'
echo -n "  Current error log last entry:   "
tail -n 1 "$ERROR_LOG" 2>/dev/null | awk '{print $1, $2}'

# --- OLDEST ROTATED LOG ---
echo ""
OLDEST_ACCESS=$(ls -t /var/log/nginx/access.log* 2>/dev/null | tail -n 1)
if [ -n "$OLDEST_ACCESS" ] && [ "$OLDEST_ACCESS" != "$ACCESS_LOG" ]; then
    echo -n "  Oldest rotated access log: $OLDEST_ACCESS "
    if [[ "$OLDEST_ACCESS" == *.gz ]]; then
        echo -n "first entry: "
        zcat "$OLDEST_ACCESS" 2>/dev/null | head -n 1 | awk '{print $4}' | tr -d '['
    else
        echo -n "first entry: "
        head -n 1 "$OLDEST_ACCESS" 2>/dev/null | awk '{print $4}' | tr -d '['
    fi
fi

# --- LINE COUNTS ---
echo ""
echo "--- LINE COUNTS (CURRENT LOGS) ---"
echo -n "  Access log lines: "
wc -l < "$ACCESS_LOG" 2>/dev/null
echo -n "  Error log lines:  "
wc -l < "$ERROR_LOG" 2>/dev/null

# --- LOGROTATE CONFIG ---
echo ""
echo "--- LOGROTATE CONFIGURATION ---"
if [ -f /etc/logrotate.d/nginx ]; then
    echo "  Config file: /etc/logrotate.d/nginx"
    echo ""
    sed 's/^/    /' /etc/logrotate.d/nginx
else
    echo "  No logrotate config found at /etc/logrotate.d/nginx"
fi

# --- DAILY REQUEST VOLUME (LAST 7 DAYS) ---
echo ""
echo "--- DAILY REQUEST VOLUME (LAST 7 DAYS) ---"
for i in $(seq 0 6); do
    DAY=$(date -d "$i days ago" +%d/%b/%Y 2>/dev/null || date -v-${i}d +%d/%b/%Y 2>/dev/null)
    if [ -n "$DAY" ]; then
        COUNT=$(zgrep -c "$DAY" /var/log/nginx/access.log* 2>/dev/null | awk -F: '{sum+=$NF} END {print sum}')
        echo "  $DAY: $COUNT requests"
    fi
done

# --- DAILY ERROR VOLUME (LAST 7 DAYS) ---
echo ""
echo "--- DAILY ERROR VOLUME (LAST 7 DAYS) ---"
for i in $(seq 0 6); do
    DAY=$(date -d "$i days ago" +%Y/%m/%d 2>/dev/null || date -v-${i}d +%Y/%m/%d 2>/dev/null)
    if [ -n "$DAY" ]; then
        COUNT=$(zgrep -c "$DAY" /var/log/nginx/error.log* 2>/dev/null | awk -F: '{sum+=$NF} END {print sum}')
        echo "  $DAY: $COUNT errors"
    fi
done

echo ""
echo "========================================"
echo "  REPORT COMPLETE"
echo "========================================"
