#!/bin/bash

# Earth Launcher AppImage Installer Script
# Installs the AppImage system-wide to /opt/earth-launcher and sets up shortcuts

set -e

APPIMAGE_SRC=$(ls release/*.AppImage 2>/dev/null | head -n 1)
ICON_SRC="icon.png"
INSTALL_DIR="/opt/earth-launcher"
DESKTOP_FILE="$HOME/Desktop/earth-launcher.desktop"
SYSTEM_DESKTOP_FILE="/usr/share/applications/earth-launcher.desktop"

if [ -z "$APPIMAGE_SRC" ]; then
  echo "Error: No AppImage found in release/. Please build the AppImage first."
  exit 1
fi

sudo mkdir -p "$INSTALL_DIR"
sudo cp "$APPIMAGE_SRC" "$INSTALL_DIR/"

# Copy icon if it exists
if [ -f "$ICON_SRC" ]; then
  sudo cp "$ICON_SRC" "$INSTALL_DIR/"
  ICON_PATH="$INSTALL_DIR/icon.png"
else
  ICON_PATH=""
fi

# Find the AppImage filename for Exec
APPIMAGE_BASENAME=$(basename "$APPIMAGE_SRC")

# Create desktop shortcut
cat > "$DESKTOP_FILE" <<EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Earth Launcher
Comment=Game Launcher for Earth Library
Exec=$INSTALL_DIR/$APPIMAGE_BASENAME
Icon=${ICON_PATH:-application-x-executable}
Terminal=false
Categories=Game;
EOF

chmod +x "$DESKTOP_FILE"

# Copy to system applications menu
sudo cp "$DESKTOP_FILE" "$SYSTEM_DESKTOP_FILE"
sudo chmod +x "$SYSTEM_DESKTOP_FILE"

echo "Earth Launcher installed!"
echo "- AppImage: $INSTALL_DIR/$APPIMAGE_BASENAME"
echo "- Shortcut: $DESKTOP_FILE"
echo "- Applications menu: $SYSTEM_DESKTOP_FILE"
echo "You can now launch Earth Launcher from your desktop or the Applications menu." 