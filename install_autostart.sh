#!/bin/bash
# Autostart installation script for Earth Launcher

echo "Earth Launcher Autostart Setup"
echo "=============================="

# Get the current directory
CURRENT_DIR=$(pwd)
LAUNCHER_PATH="$CURRENT_DIR/main.py"

# Create autostart directory if it doesn't exist
mkdir -p ~/.config/autostart

# Create desktop entry file
cat > ~/.config/autostart/earth-launcher.desktop << EOF
[Desktop Entry]
Type=Application
Name=Earth Launcher
Comment=Game launcher for Raspberry Pi handheld
Exec=python3 $LAUNCHER_PATH
Terminal=false
X-GNOME-Autostart-enabled=true
EOF

echo "Autostart entry created at ~/.config/autostart/earth-launcher.desktop"
echo ""
echo "The launcher will now start automatically when you log in."
echo ""
echo "To disable autostart, delete the file:"
echo "rm ~/.config/autostart/earth-launcher.desktop"
echo ""
echo "To test the launcher now, run:"
echo "python3 main.py" 