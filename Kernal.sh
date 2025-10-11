#!/bin/bash
# ------------------------------------------------------------
# Combined Android Build Environment + ZRAM/Swap Setup
# Author: Manan Agarwal
# ------------------------------------------------------------

set -e

echo "📦 Step 1: Cloning Android build environment scripts..."
git clone https://github.com/akhilnarang/scripts
cd scripts
echo "⚙️ Running Android build environment setup..."
bash setup/android_build_env.sh
cd ..

echo
echo "💾 Step 2: Running ZRAM + swap setup..."
# ------------------ ZRAM Swap Script ------------------------
echo "🧹 Cleaning old configurations..."
swapoff -a || true
systemctl stop zramswap.service 2>/dev/null || true

sed -i 's|^/swapfile none swap sw 0 0|# /swapfile none swap sw 0 0|' /etc/fstab

echo "🪶 Creating 16GB swapfile..."
if [ ! -f /swapfile ]; then
  fallocate -l 16G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
fi
swapon /swapfile
grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab

echo "⚙️ Installing zram-tools..."
apt update -y
apt install -y zram-tools

echo "🧩 Configuring safe adaptive ZRAM..."
cat <<EOF > /etc/default/zramswap
# ZRAM configuration (auto-safe)
ENABLED=true
ALGO=zstd
PERCENTAGE=200
NUM_DEVICES=1
EOF

systemctl enable zramswap.service
systemctl restart zramswap.service

echo "⚙️ Applying kernel tuning..."
grep -q 'vm.swappiness' /etc/sysctl.conf || echo 'vm.swappiness=10' >> /etc/sysctl.conf
grep -q 'vm.vfs_cache_pressure' /etc/sysctl.conf || echo 'vm.vfs_cache_pressure=50' >> /etc/sysctl.conf
sysctl -p

echo
echo "✅ Full setup complete. Current memory status:"
free -h
echo
echo "Swap devices:"
cat /proc/swaps
echo
echo "ZRAM block info:"
lsblk | grep zram
echo
echo "You can safely reboot now: sudo reboot"
