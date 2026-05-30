#!/bin/bash

echo "Checking Planxo AI Production Status..."

# 1. Check if required environment variables are likely to be set
echo "Checking environment variable configuration..."
if [ -f .env ]; then
    echo "  .env file found"
else
    echo "  .env file NOT found (normal in Vercel, check Vercel dashboard)"
fi

# 2. Check API Routes
echo "Verifying API Routes..."
check_route() {
    if [ -f "src/app/$1/route.ts" ]; then
        echo "  [OK] $1 route exists"
    else
        echo "  [MISSING] $1 route NOT found"
    fi
}

check_route "api/v2/health"
check_route "api/v2/bookings"
check_route "api/v2/slots"
check_route "api/v2/elevenlabs/tts"
check_route "api/v2/elevenlabs/voices"

# 3. Check Components
echo "Verifying Core Components..."
check_component() {
    if [ -f "src/components/$1" ]; then
        echo "  [OK] $1 component exists"
    else
        echo "  [MISSING] $1 component NOT found"
    fi
}

check_component "ai/TextSchedulingAssistant.tsx"
check_component "voice/VoiceSchedulingAgent.tsx"

# 4. Check Database Schema
echo "Checking Database Migrations..."
if [ -d "prisma" ] || [ -d "supabase/migrations" ]; then
    echo "  [OK] Database schema/migrations directory exists"
else
    echo "  [WARNING] No database schema directory found"
fi

echo "Verification complete!"
