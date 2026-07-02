#!/bin/bash
cd "/Users/arthurjohnhenry/CoWork/Projects/ImageNation DEX"
echo "🔧 Removing git lock file..."
rm -f ".git/index.lock"
echo "📦 Adding all changes..."
git add -A
echo "💾 Committing..."
git commit -m "God Mode: full SIINDEX hero section, goddess voice rewrite, avatar portrait fix"
echo "🚀 Pushing to GitHub..."
git push origin main
echo ""
echo "🌐 Deploying to Vercel..."
npx --yes vercel@latest deploy --yes --scope kukikings --name imagenation-dex --prod
echo ""
echo "✅ Done! Copy the URL above."
read -p "Press Enter to close..."
