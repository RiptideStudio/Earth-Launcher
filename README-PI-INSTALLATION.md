# Earth Launcher - Raspberry Pi Installation Guide

This guide will help you install Earth Launcher on your Raspberry Pi with all necessary dependencies and optimizations.

## 📋 Prerequisites

### Hardware Requirements
- **Raspberry Pi 4** (recommended) or **Raspberry Pi 3B+**
- **Minimum 2GB RAM** (4GB recommended)
- **At least 4GB free storage space**
- **MicroSD card** with Raspberry Pi OS (32-bit or 64-bit)

### Software Requirements
- **Raspberry Pi OS** (Bullseye or newer)
- **Internet connection** for downloading dependencies
- **Git** (usually pre-installed)

## 🚀 Quick Installation

### Method 1: Automated Installation Script

1. **Download the installation script:**
   ```bash
   wget https://raw.githubusercontent.com/RiptideStudio/Earth-Launcher/main/install-pi.sh
   ```

2. **Make the script executable:**
   ```bash
   chmod +x install-pi.sh
   ```

3. **Run the installation script:**
   ```bash
   ./install-pi.sh
   ```

4. **Follow the prompts** - the script will:
   - Check system requirements
   - Update system packages
   - Install all dependencies
   - Build Earth Launcher for Pi
   - Create desktop shortcut
   - Set up optional systemd service

### Method 2: Manual Installation

If you prefer manual installation or the script fails, follow these steps:

#### Step 1: Update System
```bash
sudo apt-get update
sudo apt-get upgrade -y
```

#### Step 2: Install Dependencies
```bash
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
    libffi-dev
```

#### Step 3: Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Step 4: Clone and Build
```bash
git clone https://github.com/RiptideStudio/Earth-Launcher.git
cd Earth-Launcher
npm install
npm run build:pi
```

#### Step 5: Create Start Script
```bash
cat > start-pi.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
export NODE_ENV=production
export DISPLAY=:0
npm run start:pi
EOF
chmod +x start-pi.sh
```

## 🎮 Usage

### Starting Earth Launcher

#### Option 1: Desktop Shortcut
- Double-click the **Earth Launcher** icon on your desktop

#### Option 2: Command Line
```bash
cd ~/earth-launcher
./start-pi.sh
```

#### Option 3: Systemd Service (if enabled)
```bash
sudo systemctl start earth-launcher
```

### Stopping Earth Launcher

#### If running from command line:
- Press `Ctrl+C` in the terminal

#### If running as systemd service:
```bash
sudo systemctl stop earth-launcher
```

## ⚙️ Configuration

### Performance Optimization

The installation script automatically configures your Pi for better performance:

- **GPU Memory**: Allocates 128MB to GPU
- **Hardware Acceleration**: Enables OpenGL acceleration
- **Swap File**: Increases swap to 2GB if needed
- **Memory Management**: Optimizes for Electron applications

### Manual Configuration

If you need to adjust settings manually:

#### GPU Memory (in `/boot/config.txt`):
```
gpu_mem=128
```

#### Hardware Acceleration:
```
dtoverlay=vc4-kms-v3d
```

#### Swap Size (in `/etc/dphys-swapfile`):
```
CONF_SWAPSIZE=2048
```

## 🔧 Troubleshooting

### Common Issues

#### 1. "Permission Denied" Error
```bash
sudo chmod +x ~/earth-launcher/start-pi.sh
```

#### 2. "Display Not Found" Error
```bash
export DISPLAY=:0
```

#### 3. Low Memory Errors
- Increase swap size: `sudo dphys-swapfile swapoff && sudo sed -i 's/CONF_SWAPSIZE=.*/CONF_SWAPSIZE=2048/' /etc/dphys-swapfile && sudo dphys-swapfile setup && sudo dphys-swapfile swapon`
- Close unnecessary applications
- Consider upgrading to 4GB RAM Pi

#### 4. Slow Performance
- Ensure hardware acceleration is enabled
- Close other applications
- Check CPU temperature: `vcgencmd measure_temp`
- Consider using a heatsink/fan

#### 5. Network Issues
```bash
# Check network connectivity
ping -c 3 google.com

# Check DNS
nslookup github.com
```

### Logs and Debugging

#### View Application Logs
```bash
# If running from command line, logs appear in terminal
# If running as systemd service:
sudo journalctl -u earth-launcher -f
```

#### Check System Resources
```bash
# Memory usage
free -h

# CPU usage
htop

# Disk usage
df -h

# Temperature
vcgencmd measure_temp
```

## 🗑️ Uninstallation

### Using the Uninstall Script
```bash
cd ~/earth-launcher
./uninstall-pi.sh
```

### Manual Uninstallation
```bash
# Stop the service
sudo systemctl stop earth-launcher
sudo systemctl disable earth-launcher

# Remove service file
sudo rm /etc/systemd/system/earth-launcher.service
sudo systemctl daemon-reload

# Remove desktop shortcut
rm ~/Desktop/earth-launcher.desktop

# Remove project directory
rm -rf ~/earth-launcher
```

## 📊 System Requirements

### Minimum Requirements
- **CPU**: ARM Cortex-A53 (Pi 3) or better
- **RAM**: 2GB
- **Storage**: 4GB free space
- **OS**: Raspberry Pi OS Bullseye or newer

### Recommended Requirements
- **CPU**: ARM Cortex-A72 (Pi 4)
- **RAM**: 4GB
- **Storage**: 8GB+ free space
- **OS**: Raspberry Pi OS 64-bit

## 🔄 Updates

### Updating Earth Launcher
```bash
cd ~/earth-launcher
git pull origin main
npm install
npm run build:pi
```

### Updating System Dependencies
```bash
sudo apt-get update
sudo apt-get upgrade -y
```

## 📞 Support

### Getting Help
- **GitHub Issues**: [Report bugs or request features](https://github.com/RiptideStudio/Earth-Launcher/issues)
- **Documentation**: Check the main README for detailed usage instructions
- **Community**: Join our Discord server for community support

### Useful Commands

#### System Information
```bash
# Pi model and specs
cat /proc/cpuinfo | grep Model
free -h
df -h

# OS version
cat /etc/os-release
```

#### Performance Monitoring
```bash
# Real-time system monitor
htop

# Temperature monitoring
watch -n 1 vcgencmd measure_temp

# Memory usage
watch -n 1 free -h
```

## 🎯 Tips for Best Performance

1. **Use 64-bit Raspberry Pi OS** for better performance
2. **Enable hardware acceleration** (done automatically by installer)
3. **Close unnecessary applications** when running Earth Launcher
4. **Use a quality microSD card** (Class 10 or better)
5. **Consider using an SSD** for better I/O performance
6. **Keep your Pi cool** with proper ventilation/heatsink

## 📝 License

Earth Launcher is licensed under the MIT License. See the LICENSE file for details.

---

**Happy Gaming! 🎮**

For the latest updates and support, visit: https://github.com/RiptideStudio/Earth-Launcher 