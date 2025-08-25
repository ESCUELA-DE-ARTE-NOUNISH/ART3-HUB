#!/bin/bash

# Firebase Rules Deployment Script for ART3-HUB
# This script deploys Firestore security rules and indexes

echo "🔥 Deploying Firebase Security Rules for ART3-HUB..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing Firebase CLI..."
    echo "Please run: npm install -g firebase-tools"
    echo "Then run: firebase login"
    exit 1
fi

# Check if user is logged in
echo "📋 Checking Firebase authentication..."
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase. Please run:"
    echo "firebase login"
    exit 1
fi

# Deploy Firestore rules and indexes
echo "🚀 Deploying Firestore security rules..."
firebase deploy --only firestore:rules

echo "📊 Deploying Firestore indexes..."
firebase deploy --only firestore:indexes

echo "✅ Firebase deployment complete!"
echo ""
echo "🔒 Security Rules Summary:"
echo "  - Users can read/write their own data"
echo "  - NFTs have public read access"
echo "  - Admin wallets have PERMISSIVE access (development mode)"
echo "  - Chat memory is user-private"
echo ""
echo "⚠️  IMPORTANT: Admin rules are permissive for development."
echo "   In production, implement proper admin authentication."