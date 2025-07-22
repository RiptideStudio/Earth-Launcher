# 🍓 Earth Launcher on Raspberry Pi 4

## System Requirements

### Hardware
- **Raspberry Pi 4** (2GB, 4GB, or 8GB RAM recommended)
- **Storage**: 16GB+ microSD card
- **Display**: HDMI monitor or headless setup
- **Network**: Internet connection for game downloads

### Software
- **Raspberry Pi OS** (Bullseye or newer)
- **Node.js** v16 or higher
- **Git** for game repository operations

## Installation Guide

### 1. Update Raspberry Pi OS
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Node.js
```bash
# Install Node.js 18.x (recommended for Pi 4)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 3. Install Git
```bash
sudo apt install git -y
```

### 4. Clone and Setup Earth Launcher
```bash
# Clone the repository
git clone https://github.com/yourusername/earth-launcher.git
cd earth-launcher

# Install dependencies
npm install
```

### 5. Build for Raspberry Pi
```bash
# Build the application
npm run build

# Create ARM64 distribution
npm run dist:pi
```

## Performance Optimizations

### 1. Memory Management
The launcher is optimized for Pi 4's limited RAM:

- **Lazy loading**: Components load only when needed
- **Efficient rendering**: Minimal re-renders
- **Memory cleanup**: Automatic garbage collection

### 2. Display Settings
For better performance on Pi 4:

```bash
# Enable hardware acceleration
sudo raspi-config
# Navigate to: Advanced Options > GL Driver > GL (Fake KMS)

# Increase GPU memory (if needed)
# Navigate to: Advanced Options > Memory Split > 128 or 256
```

### 3. System Optimizations
```bash
# Disable unnecessary services
sudo systemctl disable bluetooth
sudo systemctl disable hciuart

# Increase swap space (if needed)
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# Set CONF_SWAPSIZE=2048
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

## Usage on Raspberry Pi

### 1. Running the Application
```bash
# Development mode
npm run dev

# Production mode
npm start
```

### 2. Game Compatibility
Games that work well on Pi 4:

- **Web-based games**: HTML5, JavaScript games
- **Python games**: Games written in Python
- **Lightweight executables**: Small, optimized games
- **Retro games**: Emulator-based games

### 3. Storage Considerations
```bash
# Check available space
df -h

# Monitor disk usage
du -sh ~/.config/earth-launcher/games/
```

## Troubleshooting

### Common Issues

1. **Slow Performance**
   ```bash
   # Check system resources
   htop
   
   # Monitor memory usage
   free -h
   ```

2. **Display Issues**
   ```bash
   # Force HDMI output
   sudo nano /boot/config.txt
   # Add: hdmi_force_hotplug=1
   ```

3. **Network Issues**
   ```bash
   # Check network connectivity
   ping github.com
   
   # Test Git operations
   git clone https://github.com/test/repo.git
   ```

### Performance Monitoring
```bash
# Monitor CPU and memory
htop

# Check temperature
vcgencmd measure_temp

# Monitor disk I/O
iotop
```

## Recommended Pi 4 Setup

### Hardware Configuration
- **RAM**: 4GB or 8GB model recommended
- **Storage**: 32GB+ microSD card (Class 10 or better)
- **Cooling**: Active cooling recommended for extended use
- **Power**: 3A power supply

### Software Configuration
- **OS**: Raspberry Pi OS 64-bit (recommended)
- **Desktop**: Use desktop environment for GUI
- **Updates**: Keep system updated

## Game Recommendations for Pi 4

### Web Games
- HTML5 puzzle games
- JavaScript arcade games
- Canvas-based games

### Native Games
- Python-based games
- Lightweight C/C++ games
- Retro game emulators

### Performance Tips
- Close other applications when gaming
- Use wired network connection
- Monitor system temperature
- Consider overclocking (with proper cooling)

## Building Custom Games for Pi 4

### Web Game Template
```html
<!DOCTYPE html>
<html>
<head>
    <title>Pi 4 Game</title>
    <style>
        body { margin: 0; background: #000; }
        canvas { display: block; }
    </style>
</head>
<body>
    <canvas id="gameCanvas"></canvas>
    <script>
        // Optimized for Pi 4 performance
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size
        canvas.width = 800;
        canvas.height = 600;
        
        // Game loop optimized for Pi 4
        function gameLoop() {
            // Your game logic here
            requestAnimationFrame(gameLoop);
        }
        
        gameLoop();
    </script>
</body>
</html>
```

## Support

For Pi 4 specific issues:
1. Check system resources: `htop`, `free -h`
2. Monitor temperature: `vcgencmd measure_temp`
3. Check logs: `journalctl -u earth-launcher`
4. Verify network: `ping github.com`

---

**Note**: Performance may vary based on Pi 4 model and configuration. 4GB and 8GB models will provide better performance. 