# Earth Launcher - Raspberry Pi Installation Guide

## 🎮 **Quick Installation (Recommended)**

### **Option 1: Automated Installation**
```bash
# Download and run the installation script
curl -fsSL https://raw.githubusercontent.com/RiptideStudio/Earth-Launcher/main/install-pi.sh | bash
```

### **Option 2: Build and Install Application**
```bash
# Clone the repository
git clone https://github.com/RiptideStudio/Earth-Launcher.git
cd Earth-Launcher

# Make build script executable
chmod +x build-pi.sh

# Run the build script
./build-pi.sh

# Install the application
./install-earth-launcher.sh
```

## 🚀 **What You Get**

After installation, you'll have:
- **Desktop shortcut** on your Pi's desktop
- **Start menu entry** in Applications > Games
- **Proper application** that runs like any other desktop app
- **No terminal required** to launch

## 📦 **Installation Methods**

### **Method 1: AppImage (Recommended)**
- **Self-contained** application
- **No system installation** required
- **Portable** - can be moved to other Pi's
- **Easy to update** - just replace the file

### **Method 2: DEB Package**
- **System integration** with package manager
- **Automatic updates** through apt
- **Proper uninstallation** through package manager

## 🛠️ **Manual Build Process**

If you want to build it yourself:

### **1. Install Dependencies**
```bash
sudo apt update
sudo apt install -y build-essential python3 git curl wget unzip
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### **2. Build the Application**
```bash
# Clone repository
git clone https://github.com/RiptideStudio/Earth-Launcher.git
cd Earth-Launcher

# Install dependencies
npm install

# Build the application
npm run build

# Create AppImage
npx electron-builder --linux arm64 AppImage
```

### **3. Install the Application**
```bash
# Find the AppImage
find release/ -name "*.AppImage"

# Make it executable
chmod +x release/Earth-Launcher-*.AppImage

# Run it
./release/Earth-Launcher-*.AppImage
```

## 🎯 **Usage**

### **Launching the Application**
1. **Double-click** the desktop shortcut
2. **Or** find it in Applications > Games > Earth Launcher
3. **Or** run from terminal: `./Earth-Launcher-*.AppImage`

### **Features**
- **Browse games** from Earth Library
- **Install games** with one click
- **Launch games** directly from the launcher
- **Update games** automatically
- **Track playtime** and statistics
- **Manage your game library**

## 🔧 **Troubleshooting**

### **Graphics Issues**
If you get graphics errors like "failed to get fd for plane":
```bash
# Run with software rendering
LIBGL_ALWAYS_SOFTWARE=1 ./Earth-Launcher-*.AppImage

# Or disable hardware acceleration
ELECTRON_DISABLE_ACCELERATION=1 ./Earth-Launcher-*.AppImage
```

### **Permission Issues**
```bash
# Make sure the AppImage is executable
chmod +x Earth-Launcher-*.AppImage
```

### **Missing Dependencies**
```bash
# Install common missing packages
sudo apt install -y libxcb-util-dev libxcb-keysyms1-dev libxcb-image0-dev
```

## 📋 **System Requirements**

- **Raspberry Pi 4** (recommended) or Pi 3B+
- **2GB RAM** minimum (4GB recommended)
- **4GB free storage** minimum
- **Raspberry Pi OS** (Bullseye or newer)
- **Desktop environment** (not headless)

## 🗑️ **Uninstalling**

### **AppImage Method**
```bash
# Remove desktop shortcut
rm ~/Desktop/earth-launcher.desktop

# Remove from applications menu
sudo rm /usr/share/applications/earth-launcher.desktop

# Remove application files
sudo rm -rf /opt/earth-launcher
```

### **DEB Package Method**
```bash
sudo apt remove earth-launcher
```

## 🔄 **Updating**

### **AppImage Method**
1. **Download** the new AppImage
2. **Replace** the old file
3. **Make executable**: `chmod +x new-appimage.AppImage`

### **DEB Package Method**
```bash
sudo apt update
sudo apt upgrade earth-launcher
```

## 📞 **Support**

- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: Check the main README for detailed information
- **Community**: Join our Discord for help and discussions

---

**Earth Launcher** - Your gateway to the Earth Library universe! 🌍🎮 