#!/bin/bash
# Quick production build and test script

echo "🏗️  Building production version..."
pnpm build

echo "🚀 Starting production preview..."
pnpm preview --port 5173 &
SERVER_PID=$!

echo "📱 Opening browser in 3 seconds..."
sleep 3

# Open browser (works on most systems)
if command -v xdg-open > /dev/null; then
    xdg-open http://localhost:5173
elif command -v open > /dev/null; then
    open http://localhost:5173
else
    echo "Please open http://localhost:5173 in your browser"
fi

echo "
🔍 Production test server running on http://localhost:5173
📊 Open DevTools Console to see performance logs
🛑 Press Ctrl+C to stop
"

# Wait for Ctrl+C
wait $SERVER_PID