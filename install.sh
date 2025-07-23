#!/bin/bash

echo "=== Earth Launcher Installer ==="
echo "Installing modern game launcher for Raspberry Pi..."

# Make the launcher executable
chmod +x earth_launcher.py

# Create desktop shortcut
cat > ~/Desktop/earth-launcher.desktop << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Earth Launcher
Comment=Modern Game Launcher for Raspberry Pi
Exec=python3 $(pwd)/earth_launcher.py
Icon=applications-games
Terminal=false
Categories=Game;
EOF

chmod +x ~/Desktop/earth-launcher.desktop

# Create system-wide shortcut
sudo tee /usr/share/applications/earth-launcher.desktop > /dev/null << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Earth Launcher
Comment=Modern Game Launcher for Raspberry Pi
Exec=python3 $(pwd)/earth_launcher.py
Icon=applications-games
Terminal=false
Categories=Game;
EOF

echo "✅ Earth Launcher installed successfully!"
echo ""
echo "You can now launch Earth Launcher from:"
echo "  • Desktop shortcut"
echo "  • Applications menu"
echo "  • Terminal: python3 earth_launcher.py"
echo ""
echo "Features:"
echo "  • Modern dark theme"
echo "  • Add games with file browser"
echo "  • Double-click to launch games"
echo "  • Automatic game status checking"
echo "  • Lightweight and fast" 