#!/bin/bash
cd "/Users/arthurjohnhenry/CoWork/Projects/ImageNation DEX"
echo "🔧 Removing ALL git lock files..."
rm -f .git/index.lock .git/HEAD.lock .git/refs/heads/main.lock
ls .git/*.lock 2>/dev/null && echo "WARNING: locks remain" || echo "✅ All locks cleared"
echo ""
echo "📦 Staging all changes..."
git add -A
echo ""
echo "💾 Committing..."
git commit -m "God Mode R1: siindex-brief.html + citizen-profile.html — action persistence, live schedule, chart tooltip, history sheet, follow state, INDX/USD price flip, listing filters, WS canvas ring"
echo ""
echo "🚀 Pushing to GitHub..."
git push origin main
echo ""
echo "✅ Done! GitHub updated. Vercel auto-deploy will trigger."
echo ""
read -p "Press Enter to close..."
