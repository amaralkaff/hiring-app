#!/bin/bash

echo "🚀 Running Playwright Authentication Tests..."
echo ""

# Check if dev server is running on expected port
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Development server is running on port 3000"
    export TEST_BASE_URL="http://localhost:3000"
elif curl -s http://localhost:3002 > /dev/null; then
    echo "⚠️  Development server is running on port 3002, updating TEST_BASE_URL"
    export TEST_BASE_URL="http://localhost:3002"
elif curl -s http://localhost:3001 > /dev/null; then
    echo "⚠️  Development server is running on port 3001, updating TEST_BASE_URL"
    export TEST_BASE_URL="http://localhost:3001"
else
    echo "❌ Development server is not running. Please start it with:"
    echo "   npm run dev"
    echo ""
    exit 1
fi

# Run the tests
echo "🧪 Running authentication tests..."
echo ""

if [ -n "$TEST_BASE_URL" ]; then
    TEST_BASE_URL="$TEST_BASE_URL" npm run test --reporter=list
else
    npm run test --reporter=list
fi

echo ""
echo "✅ Playwright authentication testing complete!"
echo ""
echo "📚 To run all authentication tests:"
echo "   npm run test"
echo ""
echo "🖥️ To run tests in UI mode:"
echo "   npm run test:ui"
echo ""
echo "🔍 To run tests with browser visibility:"
echo "   npm run test:headed"
echo ""
echo "📊 To view test reports:"
echo "   npm run test:report"