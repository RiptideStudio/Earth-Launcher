#!/bin/bash

# Earth Launcher Complete Installer
# Builds the AppImage and installs it system-wide

set -e

echo "=== Earth Launcher Installer ==="
echo "This script will build and install Earth Launcher system-wide."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found. Please run this script from the Earth-Launcher project root."
    exit 1
fi

# Check if Node.js and npm are installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install npm first."
    exit 1
fi

echo "✓ Node.js and npm found"
echo ""

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo "✓ Dependencies installed"
else
    echo "✓ Dependencies already installed"
fi
echo ""

# Clean previous builds
echo "Cleaning previous builds..."
rm -rf dist/ release/
echo "✓ Cleaned previous builds"
echo ""

# Build the application
echo "Building Earth Launcher..."
npm run build:pi
echo "✓ Build completed"
echo ""

# Build the AppImage
echo "Creating AppImage..."
npx electron-builder --linux AppImage --arm64
echo "✓ AppImage created"
echo ""

# Find the AppImage
APPIMAGE_SRC=$(ls release/*.AppImage 2>/dev/null | head -n 1)
if [ -z "$APPIMAGE_SRC" ]; then
    echo "Error: No AppImage found in release/. Build may have failed."
    exit 1
fi

echo "Found AppImage: $APPIMAGE_SRC"
echo ""

# Install system-wide
echo "Installing Earth Launcher system-wide..."
INSTALL_DIR="/opt/earth-launcher"
DESKTOP_FILE="$HOME/Desktop/earth-launcher.desktop"
SYSTEM_DESKTOP_FILE="/usr/share/applications/earth-launcher.desktop"

# Create install directory
sudo mkdir -p "$INSTALL_DIR"

# Copy AppImage
sudo cp "$APPIMAGE_SRC" "$INSTALL_DIR/"
sudo chmod +x "$INSTALL_DIR"/*.AppImage

# Copy icon if it exists
if [ -f "icon.png" ]; then
    sudo cp "icon.png" "$INSTALL_DIR/"
    ICON_PATH="$INSTALL_DIR/icon.png"
else
    ICON_PATH=""
fi

# Get the AppImage filename
APPIMAGE_NAME=$(basename "$APPIMAGE_SRC")

# Create desktop shortcut
cat > "$DESKTOP_FILE" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Earth Launcher
Comment=Game Launcher for Earth Library
Exec=$INSTALL_DIR/$APPIMAGE_NAME
Icon=$ICON_PATH
Terminal=false
Categories=Game;
EOF

chmod +x "$DESKTOP_FILE"

# Create system-wide desktop file
sudo tee "$SYSTEM_DESKTOP_FILE" > /dev/null << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Earth Launcher
Comment=Game Launcher for Earth Library
Exec=$INSTALL_DIR/$APPIMAGE_NAME
Icon=$ICON_PATH
Terminal=false
Categories=Game;
EOF

echo "✓ Earth Launcher installed to $INSTALL_DIR"
echo "✓ Desktop shortcut created"
echo "✓ Added to Applications menu"
echo ""

echo "=== Installation Complete! ==="
echo "You can now launch Earth Launcher from:"
echo "  • Your desktop shortcut"
echo "  • The Applications menu"
echo "  • Terminal: $INSTALL_DIR/$APPIMAGE_NAME"
echo ""
echo "To uninstall, run: sudo rm -rf $INSTALL_DIR" 