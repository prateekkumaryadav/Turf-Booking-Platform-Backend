#!/bin/bash
# ─────────────────────────────────────────────────────────────
# Rate Limit Demo — Two modes:
#   ./test-rate-limit.sh start   → starts gateway (stays alive)
#   ./test-rate-limit.sh test    → fires requests against it
#   ./test-rate-limit.sh stop    → stops the gateway
# ─────────────────────────────────────────────────────────────

PORT=5050
PIDFILE="/tmp/turf-gateway-demo.pid"
export RATE_LIMIT_AUTH=5

case "${1:-test}" in

  start)
    if [ -f "$PIDFILE" ] && kill -0 "$(cat $PIDFILE)" 2>/dev/null; then
      echo "⚠️  Gateway already running (PID $(cat $PIDFILE)). Run: $0 stop"
      exit 1
    fi
    echo "🚀 Starting API Gateway on port $PORT (auth limit = $RATE_LIMIT_AUTH/min)..."
    node -e "
      const express = require('express');
      const { globalLimiter, authLimiter, bookingLimiter } = require('./middleware/rateLimiter');
      const app = express();
      app.use(globalLimiter);
      app.get('/', (req, res) => res.json({ message: 'Gateway running' }));
      app.get('/api/auth/login', authLimiter, (req, res) => res.json({ ok: true }));
      app.get('/api/bookings/slots', bookingLimiter, (req, res) => res.json({ ok: true }));
      app.listen($PORT, () => console.log('✅ Gateway ready at http://localhost:$PORT'));
    " &
    echo $! > "$PIDFILE"
    sleep 1
    echo "   PID: $(cat $PIDFILE)"
    echo ""
    echo "Now run:  $0 test     (repeat this multiple times within 1 minute!)"
    echo "Then:     $0 stop"
    ;;

  test)
    if ! curl -s -o /dev/null http://127.0.0.1:$PORT/ 2>/dev/null; then
      echo "❌ Gateway not running. Start it first:  $0 start"
      exit 1
    fi
    echo "━━━ Sending 3 requests to /api/auth/login ━━━"
    for i in 1 2 3; do
      RESP=$(curl -s -w '\n%{http_code}' http://127.0.0.1:$PORT/api/auth/login)
      CODE=$(echo "$RESP" | tail -1)
      REMAINING=$(curl -sI http://127.0.0.1:$PORT/api/auth/login 2>&1 | grep -i 'RateLimit-Remaining' | tr -d '\r' | awk '{print $2}')
      if [ "$CODE" = "429" ]; then
        echo "  → HTTP $CODE 🚫 RATE LIMITED (remaining: 0)"
      else
        echo "  → HTTP $CODE ✅ (remaining: $REMAINING)"
      fi
    done
    echo ""
    echo "💡 Run '$0 test' again to see the counter carry over!"
    ;;

  stop)
    if [ -f "$PIDFILE" ]; then
      kill "$(cat $PIDFILE)" 2>/dev/null
      rm -f "$PIDFILE"
      echo "🛑 Gateway stopped."
    else
      echo "No gateway running."
    fi
    ;;

  *)
    echo "Usage: $0 {start|test|stop}"
    ;;
esac
