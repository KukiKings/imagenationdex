#!/bin/bash
cd "/Users/arthurjohnhenry/CoWork/Projects/ImageNation DEX"
echo "🔧 Removing ALL git lock files..."
rm -f .git/index.lock .git/HEAD.lock .git/refs/heads/main.lock
ls .git/*.lock 2>/dev/null && echo "WARNING: locks remain" || echo "✅ All locks cleared"
echo ""
echo "📦 Staging changes..."
git add -A
echo ""
echo "💾 Committing..."
git commit -m "God Mode: full SIINDEX hero section, goddess voice, avatar portrait fix"
echo ""
echo "🚀 Pushing to GitHub..."
git push origin main
echo ""
echo "✅ Done! GitHub updated. Vercel auto-deploy will trigger."
echo ""
read -p "Press Enter to close..."
