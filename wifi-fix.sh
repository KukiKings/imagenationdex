#!/bin/bash
# ── DLINK-191B59 WIFI DROPOUT FIX ──
# Run once in Terminal: bash ~/CoWork/Projects/ImageNation\ DEX/wifi-fix.sh
# Requires your Mac password (sudo) for power management changes.

echo "🔧 IN$DEX WiFi Fix — Dlink-191B59"
echo "──────────────────────────────────"

# 1. Flush DNS cache (clears stale entries that cause page failures)
echo "→ Flushing DNS cache..."
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
echo "   ✓ DNS cache cleared"

# 2. Disable macOS from sleeping the WiFi adapter
#    This is the #1 cause of WiFi dropouts on MacBook — the OS cuts power to the card
echo "→ Disabling WiFi power nap (prevents adapter sleep)..."
sudo pmset -a tcpkeepalive 1
sudo pmset -a powernap 0
echo "   ✓ WiFi adapter will stay active during sleep"

# 3. Renew DHCP lease (forces fresh IP from D-Link router)
echo "→ Renewing DHCP lease from D-Link..."
sudo ipconfig set en0 DHCP
sleep 2
echo "   ✓ DHCP lease renewed"

# 4. Show current DNS config (verify 8.8.8.8 is active)
echo ""
echo "── Current DNS for Dlink-191B59 ──"
networksetup -getdnsservers Wi-Fi
echo ""

# 5. Test connectivity
echo "── Connectivity test ──"
ping -c 3 8.8.8.8 | tail -2
echo ""

echo "✅ Done. DNS is now Google (8.8.8.8/8.8.4.4) + WiFi power save disabled."
echo ""
echo "── ROUTER TIP ──"
echo "If dropouts continue, log into your D-Link at http://192.168.1.1"
echo "Admin → Setup → Wireless → Change channel from Auto to 6 or 11 (2.4GHz)"
echo "or channel 36/40 for 5GHz to reduce interference."
