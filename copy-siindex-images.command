#!/bin/bash
# Copy all SIINDEX character images from Downloads to project assets
cd "$(dirname "$0")"
mkdir -p "assets"

echo "🔍 Scanning Downloads for SIINDEX images..."
count=0

for f in ~/Downloads/SIINDEX*.png ~/Downloads/SIINDEX*.jpg ~/Downloads/SIINDEX*.jpeg \
          ~/Downloads/IN\$DEX*.png ~/Downloads/IN\$DEX*.jpg \
          ~/Downloads/siindex*.png ~/Downloads/siindex*.jpg; do
  [ -f "$f" ] && cp "$f" "assets/" && echo "✅ Copied: $(basename "$f")" && ((count++))
done

echo ""
echo "📁 Assets folder now contains:"
ls -la "assets/"
echo ""
echo "✅ Done — $count image(s) copied to assets/"
echo "Press Enter to close..."
read
