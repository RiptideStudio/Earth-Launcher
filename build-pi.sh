#!/bin/bash

# Earth Launcher - Raspberry Pi Build Script
# This script builds the Earth Launcher as a proper installable application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're on Raspberry Pi
check_pi() {
    if ! grep -q "Raspberry Pi" /proc/cpuinfo 2>/dev/null; then
        print_warning "This script is designed for Raspberry Pi. Continue anyway? (y/N)"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            print_error "Build cancelled."
            exit 1
        fi
    fi
}

# Install build dependencies
install_build_deps() {
    print_status "Installing build dependencies..."
    
    sudo apt-get update
    sudo apt-get install -y \
        build-essential \
        python3 \
        git \
        curl \
        wget \
        unzip \
        pkg-config \
        libssl-dev \
        libffi-dev \
        libbz2-dev \
        libreadline-dev \
        libsqlite3-dev \
        libncurses5-dev \
        libncursesw5-dev \
        xz-utils \
        tk-dev \
        libxml2-dev \
        libxmlsec1-dev \
        libffi-dev \
        liblzma-dev \
        libgdbm-compat-dev \
        libnss3-dev \
        libatk-bridge2.0-dev \
        libgtk-3-dev \
        libxss-dev \
        libasound2-dev \
        libdrm-dev \
        libxrandr-dev \
        libxcomposite-dev \
        libxcursor-dev \
        libxdamage-dev \
        libxfixes-dev \
        libxrender-dev \
        libxss-dev \
        libxtst-dev \
        libx11-xcb-dev \
        libxcb-dri3-dev \
        libxcb-render0-dev \
        libxcb-shape0-dev \
        libxcb-xfixes0-dev \
        libxcb-keysyms1-dev \
        libxcb-icccm4-dev \
        libxcb-image0-dev \
        libxcb-shm0-dev \
        libxcb-util1-dev \
        libxcb-randr0-dev \
        libxcb-xkb-dev \
        libxcb-xinerama0-dev \
        libxcb-xtest0-dev \
        libxcb-sync-dev \
        libxcb-present-dev \
        libxcb-glx0-dev \
        libxcb-dri2-0-dev \
        libxcb-util-dev \
        libxcb-errors0-dev
    
    print_success "Build dependencies installed"
}

# Install Node.js if not present
install_nodejs() {
    print_status "Checking Node.js installation..."
    
    if ! command -v node >/dev/null 2>&1; then
        print_status "Installing Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    
    node_version=$(node --version)
    npm_version=$(npm --version)
    print_success "Node.js: $node_version, npm: $npm_version"
}

# Build the application
build_app() {
    print_status "Building Earth Launcher..."
    
    # Clean previous builds
    rm -rf dist/ release/ node_modules/
    
    # Install dependencies
    print_status "Installing npm dependencies..."
    npm install
    
    # Build renderer
    print_status "Building renderer..."
    npm run build:renderer
    
    # Build main process
    print_status "Building main process..."
    npm run build:main
    
    # Copy Pi-specific main file and update package.json
    print_status "Setting up Pi-specific configuration..."
    cp src/main/main-pi.ts dist/main-pi.js
    
    # Update package.json to use main-pi.js for Pi builds
    sed -i 's/"main": "dist\/main.js"/"main": "dist\/main-pi.js"/' package.json
    
    # Create a backup of the original package.json
    cp package.json package.json.backup
    
    print_success "Application built successfully"
}

# Create AppImage
create_appimage() {
    print_status "Creating AppImage..."
    
    # Install electron-builder if not present
    if ! npm list -g electron-builder >/dev/null 2>&1; then
        print_status "Installing electron-builder..."
        sudo npm install -g electron-builder
    fi
    
    # Build AppImage
    print_status "Building AppImage package..."
    npx electron-builder --linux arm64 AppImage
    
    print_success "AppImage created successfully"
}

# Create DEB package
create_deb() {
    print_status "Creating DEB package..."
    
    # Build DEB package
    print_status "Building DEB package..."
    npx electron-builder --linux arm64 deb
    
    print_success "DEB package created successfully"
}

# Create desktop shortcut
create_desktop_shortcut() {
    print_status "Creating desktop shortcut..."
    
    cat > "$HOME/Desktop/earth-launcher.desktop" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Earth Launcher
Comment=Game Launcher for Earth Library
Exec=$HOME/earth-launcher/Earth-Launcher-*.AppImage
Icon=$HOME/earth-launcher/icon.png
Terminal=false
Categories=Game;
EOF
    
    chmod +x "$HOME/Desktop/earth-launcher.desktop"
    print_success "Desktop shortcut created"
}

# Restore original package.json
restore_package_json() {
    if [ -f "package.json.backup" ]; then
        print_status "Restoring original package.json..."
        mv package.json.backup package.json
        print_success "Package.json restored"
    fi
}

# Create installation script
create_install_script() {
    print_status "Creating installation script..."
    
    cat > install-earth-launcher.sh << 'EOF'
#!/bin/bash

# Earth Launcher Installation Script
set -e

echo "Installing Earth Launcher..."

# Find the AppImage
APPIMAGE=$(find . -name "Earth-Launcher-*.AppImage" | head -n 1)

if [ -z "$APPIMAGE" ]; then
    echo "Error: AppImage not found!"
    exit 1
fi

# Make it executable
chmod +x "$APPIMAGE"

# Create installation directory
sudo mkdir -p /opt/earth-launcher
sudo cp "$APPIMAGE" /opt/earth-launcher/

# Create desktop shortcut
cat > "$HOME/Desktop/earth-launcher.desktop" << DESKTOP
[Desktop Entry]
Version=1.0
Type=Application
Name=Earth Launcher
Comment=Game Launcher for Earth Library
Exec=/opt/earth-launcher/$(basename "$APPIMAGE")
Icon=/opt/earth-launcher/icon.png
Terminal=false
Categories=Game;
DESKTOP

chmod +x "$HOME/Desktop/earth-launcher.desktop"

# Create system-wide desktop file
sudo cp "$HOME/Desktop/earth-launcher.desktop" /usr/share/applications/

echo "Earth Launcher installed successfully!"
echo "You can now launch it from the Applications menu or desktop shortcut."
EOF
    
    chmod +x install-earth-launcher.sh
    print_success "Installation script created"
}

# Main function
main() {
    echo "=========================================="
    echo "Earth Launcher - Pi Build Script"
    echo "=========================================="
    echo
    
    # Check if running as root
    if [ "$EUID" -eq 0 ]; then
        print_error "Please do not run this script as root. Run as a regular user."
        exit 1
    fi
    
    # Check system
    check_pi
    
    # Install dependencies
    install_build_deps
    install_nodejs
    
    # Build application
    build_app
    
    # Create packages
    create_appimage
    create_deb
    
    # Create shortcuts and install script
    create_desktop_shortcut
    create_install_script
    
    # Restore original package.json
    restore_package_json
    
    # Show summary
    print_success "Build completed successfully!"
    echo
    echo "Generated files:"
    echo "  - AppImage: $(find release/ -name "*.AppImage" 2>/dev/null | head -n 1)"
    echo "  - DEB package: $(find release/ -name "*.deb" 2>/dev/null | head -n 1)"
    echo "  - Installation script: install-earth-launcher.sh"
    echo "  - Desktop shortcut: $HOME/Desktop/earth-launcher.desktop"
    echo
    echo "To install:"
    echo "  ./install-earth-launcher.sh"
    echo
    echo "To run directly:"
    echo "  ./release/Earth-Launcher-*.AppImage"
    echo
}

# Run main function
main "$@" 