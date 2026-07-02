#!/bin/bash
cd "/Users/arthurjohnhenry/CoWork/Projects/ImageNation DEX"
echo "🚀 IN\$DEX → Vercel Deploy"
echo "──────────────────────────"
npx vercel@latest deploy --yes --scope kukikings --name imagenation-dex
echo ""
echo "✅ Copy the .vercel.app URL above → Vercel dashboard → Custom Domains → add imagenationdex.com"
read -p "Press Enter to close..."
