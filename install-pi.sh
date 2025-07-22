#!/bin/bash

# Earth Launcher - Raspberry Pi Installation Script
# This script installs all dependencies and builds the Earth Launcher for Raspberry Pi

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check system requirements
check_system() {
    print_status "Checking system requirements..."
    
    # Check if running on Raspberry Pi
    if ! grep -q "Raspberry Pi" /proc/cpuinfo 2>/dev/null; then
        print_warning "This script is designed for Raspberry Pi. Continue anyway? (y/N)"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            print_error "Installation cancelled."
            exit 1
        fi
    fi
    
    # Check architecture
    if [[ "$(uname -m)" != "aarch64" && "$(uname -m)" != "armv7l" ]]; then
        print_error "This script is designed for ARM architecture (Raspberry Pi)."
        exit 1
    fi
    
    # Check available memory (minimum 2GB)
    total_mem=$(free -m | awk 'NR==2{printf "%.0f", $2}')
    if [ "$total_mem" -lt 2000 ]; then
        print_warning "Low memory detected (${total_mem}MB). Earth Launcher requires at least 2GB RAM."
        print_warning "Consider using a swap file or upgrading your Pi's RAM."
    fi
    
    # Check available storage (minimum 4GB)
    available_space=$(df -BG . | awk 'NR==2{print $4}' | sed 's/G//')
    if [ "$available_space" -lt 4 ]; then
        print_error "Insufficient storage space. Need at least 4GB free space."
        exit 1
    fi
    
    print_success "System requirements check passed"
}

# Function to update system packages
update_system() {
    print_status "Updating system packages..."
    
    sudo apt-get update
    sudo apt-get upgrade -y
    
    print_success "System packages updated"
}

# Function to install system dependencies
install_dependencies() {
    print_status "Installing system dependencies..."
    
    # Essential build tools
    sudo apt-get install -y \
        build-essential \
        python3 \
        python3-pip \
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
        libxcb-errors0-dev \
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
    
    print_success "System dependencies installed"
}

# Function to install Node.js
install_nodejs() {
    print_status "Installing Node.js..."
    
    # Check if Node.js is already installed
    if command_exists node; then
        node_version=$(node --version)
        print_status "Node.js already installed: $node_version"
        
        # Check if version is 16 or higher
        major_version=$(echo "$node_version" | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$major_version" -ge 16 ]; then
            print_success "Node.js version is compatible"
            return
        else
            print_warning "Node.js version is too old. Updating..."
        fi
    fi
    
    # Install Node.js using NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # Verify installation
    node_version=$(node --version)
    npm_version=$(npm --version)
    print_success "Node.js installed: $node_version"
    print_success "npm installed: $npm_version"
}

# Function to install additional tools
install_tools() {
    print_status "Installing additional tools..."
    
    # Install PM2 for process management (optional)
    if command_exists npm; then
        sudo npm install -g pm2
        print_success "PM2 installed for process management"
    fi
    
    # Install additional useful tools
    sudo apt-get install -y \
        htop \
        tree \
        neofetch \
        screen \
        tmux
    
    print_success "Additional tools installed"
}

# Function to configure system for better performance
configure_system() {
    print_status "Configuring system for better performance..."
    
    # Increase swap size if needed
    current_swap=$(free -m | awk 'NR==3{print $2}')
    if [ "$current_swap" -lt 2048 ]; then
        print_status "Increasing swap size..."
        sudo dphys-swapfile swapoff
        sudo sed -i 's/CONF_SWAPSIZE=.*/CONF_SWAPSIZE=2048/' /etc/dphys-swapfile
        sudo dphys-swapfile setup
        sudo dphys-swapfile swapon
        print_success "Swap size increased to 2GB"
    fi
    
    # Enable hardware acceleration
    if [ -f "/boot/config.txt" ]; then
        # Enable GPU memory split
        if ! grep -q "gpu_mem=" /boot/config.txt; then
            echo "gpu_mem=128" | sudo tee -a /boot/config.txt
            print_success "GPU memory configured"
        fi
        
        # Enable hardware acceleration
        if ! grep -q "dtoverlay=vc4-kms-v3d" /boot/config.txt; then
            echo "dtoverlay=vc4-kms-v3d" | sudo tee -a /boot/config.txt
            print_success "Hardware acceleration enabled"
        fi
    fi
    
    print_success "System configuration completed"
}

# Function to clone and build Earth Launcher
build_earth_launcher() {
    print_status "Building Earth Launcher..."
    
    # Create project directory
    project_dir="$HOME/earth-launcher"
    if [ -d "$project_dir" ]; then
        print_warning "Earth Launcher directory already exists. Updating..."
        cd "$project_dir"
        git pull origin main
    else
        print_status "Cloning Earth Launcher repository..."
        git clone https://github.com/RiptideStudio/Earth-Launcher.git "$project_dir"
        cd "$project_dir"
    fi
    
    # Install npm dependencies
    print_status "Installing npm dependencies..."
    npm install
    
    # Build for Raspberry Pi
    print_status "Building Earth Launcher for Raspberry Pi..."
    npm run build:pi
    
    print_success "Earth Launcher built successfully"
}

# Function to create desktop shortcut
create_desktop_shortcut() {
    print_status "Creating desktop shortcut..."
    
    desktop_file="$HOME/Desktop/earth-launcher.desktop"
    project_dir="$HOME/earth-launcher"
    
    cat > "$desktop_file" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Earth Launcher
Comment=Modern desktop game launcher for Earth Library
Exec=$project_dir/start-pi.sh
Icon=$project_dir/assets/icon.png
Terminal=false
Categories=Game;Utility;
Keywords=game;launcher;earth;library;
EOF
    
    chmod +x "$desktop_file"
    print_success "Desktop shortcut created"
}

# Function to create start script
create_start_script() {
    print_status "Creating start script..."
    
    project_dir="$HOME/earth-launcher"
    start_script="$project_dir/start-pi.sh"
    
    cat > "$start_script" << 'EOF'
#!/bin/bash

# Earth Launcher - Raspberry Pi Start Script

# Change to the project directory
cd "$(dirname "$0")"

# Set environment variables for better performance
export NODE_ENV=production
export ELECTRON_ENABLE_LOGGING=1
export ELECTRON_ENABLE_STACK_DUMPING=1

# Set display for Pi
export DISPLAY=:0

# Start the application
echo "Starting Earth Launcher..."
npm run start:pi
EOF
    
    chmod +x "$start_script"
    print_success "Start script created"
}

# Function to create systemd service (optional)
create_systemd_service() {
    print_status "Creating systemd service..."
    
    service_file="/etc/systemd/system/earth-launcher.service"
    project_dir="$HOME/earth-launcher"
    
    sudo tee "$service_file" > /dev/null << EOF
[Unit]
Description=Earth Launcher
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$project_dir
Environment=NODE_ENV=production
Environment=DISPLAY=:0
ExecStart=$project_dir/start-pi.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
    
    # Enable the service
    sudo systemctl daemon-reload
    sudo systemctl enable earth-launcher.service
    
    print_success "Systemd service created and enabled"
    print_status "To start the service: sudo systemctl start earth-launcher"
    print_status "To stop the service: sudo systemctl stop earth-launcher"
    print_status "To view logs: sudo journalctl -u earth-launcher -f"
}

# Function to create uninstall script
create_uninstall_script() {
    print_status "Creating uninstall script..."
    
    project_dir="$HOME/earth-launcher"
    uninstall_script="$project_dir/uninstall-pi.sh"
    
    cat > "$uninstall_script" << 'EOF'
#!/bin/bash

# Earth Launcher - Raspberry Pi Uninstall Script

set -e

echo "Uninstalling Earth Launcher..."

# Stop and disable systemd service
if systemctl is-active --quiet earth-launcher.service; then
    sudo systemctl stop earth-launcher.service
fi
if systemctl is-enabled --quiet earth-launcher.service; then
    sudo systemctl disable earth-launcher.service
fi

# Remove systemd service file
if [ -f "/etc/systemd/system/earth-launcher.service" ]; then
    sudo rm /etc/systemd/system/earth-launcher.service
    sudo systemctl daemon-reload
fi

# Remove desktop shortcut
if [ -f "$HOME/Desktop/earth-launcher.desktop" ]; then
    rm "$HOME/Desktop/earth-launcher.desktop"
fi

# Remove project directory
if [ -d "$(dirname "$0")" ]; then
    rm -rf "$(dirname "$0")"
fi

echo "Earth Launcher uninstalled successfully"
EOF
    
    chmod +x "$uninstall_script"
    print_success "Uninstall script created"
}

# Function to display installation summary
show_summary() {
    print_success "Installation completed successfully!"
    echo
    echo "Earth Launcher has been installed on your Raspberry Pi."
    echo
    echo "Installation details:"
    echo "  - Project location: $HOME/earth-launcher"
    echo "  - Desktop shortcut: $HOME/Desktop/earth-launcher.desktop"
    echo "  - Start script: $HOME/earth-launcher/start-pi.sh"
    echo "  - Uninstall script: $HOME/earth-launcher/uninstall-pi.sh"
    echo
    echo "To start Earth Launcher:"
    echo "  1. Double-click the desktop shortcut, or"
    echo "  2. Run: $HOME/earth-launcher/start-pi.sh, or"
    echo "  3. Run: sudo systemctl start earth-launcher"
    echo
    echo "To uninstall:"
    echo "  Run: $HOME/earth-launcher/uninstall-pi.sh"
    echo
    echo "For support, visit: https://github.com/RiptideStudio/Earth-Launcher"
    echo
}

# Main installation function
main() {
    echo "=========================================="
    echo "Earth Launcher - Raspberry Pi Installer"
    echo "=========================================="
    echo
    
    # Check if running as root
    if [ "$EUID" -eq 0 ]; then
        print_error "Please do not run this script as root. Run as a regular user."
        exit 1
    fi
    
    # Check system requirements
    check_system
    
    # Update system
    update_system
    
    # Install dependencies
    install_dependencies
    
    # Install Node.js
    install_nodejs
    
    # Install additional tools
    install_tools
    
    # Configure system
    configure_system
    
    # Build Earth Launcher
    build_earth_launcher
    
    # Create start script
    create_start_script
    
    # Create desktop shortcut
    create_desktop_shortcut
    
    # Create uninstall script
    create_uninstall_script
    
    # Ask about systemd service
    echo
    print_warning "Would you like to create a systemd service for automatic startup? (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        create_systemd_service
    fi
    
    # Show summary
    show_summary
}

# Run main function
main "$@" 