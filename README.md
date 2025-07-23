# Earth Launcher

A modern, lightweight game launcher for Raspberry Pi with a beautiful dark theme.

## Features

- 🎮 **Simple Game Management** - Add and launch games easily
- 🌙 **Modern Dark Theme** - Beautiful, easy on the eyes
- ⚡ **Lightweight** - Built with Python and tkinter, perfect for Pi
- 🔍 **File Browser** - Browse to find game executables
- 📊 **Status Checking** - See which games are installed/missing
- 🖱️ **Double-click Launch** - Launch games with a simple double-click

## Installation

1. **Download the files** to your Raspberry Pi
2. **Make the installer executable:**
   ```bash
   chmod +x install.sh
   ```
3. **Run the installer:**
   ```bash
   ./install.sh
   ```

## Usage

### Launch the App
- **Desktop shortcut** - Double-click the Earth Launcher icon
- **Applications menu** - Find "Earth Launcher" in the Games category
- **Terminal** - Run `python3 earth_launcher.py`

### Add a Game
1. Click **"Add Game"** button
2. Enter a **game name** (e.g., "Minecraft")
3. Click **"Browse"** to find the game executable
4. Click **"Add Game"** to save

### Launch a Game
- **Double-click** any game in the list
- The game will launch in the background
- Check the status bar for launch confirmation

## Requirements

- **Python 3** (usually pre-installed on Pi)
- **tkinter** (usually pre-installed on Pi)
- **Raspberry Pi OS** (or any Linux distribution)

## File Structure

```
earth_launcher.py    # Main application
install.sh          # Installation script
README.md           # This file
```

## Data Storage

Games are saved to: `~/.earth_launcher/games.json`

## Why This Approach?

- ✅ **Native to Linux** - No Electron bloat
- ✅ **Lightweight** - Perfect for Pi's limited resources
- ✅ **Simple** - Easy to understand and modify
- ✅ **Fast** - Instant startup and response
- ✅ **Reliable** - Uses proven Python/tkinter stack

## Troubleshooting

**If the app doesn't start:**
```bash
python3 -c "import tkinter; print('tkinter is available')"
```

**If games don't launch:**
- Make sure the executable has run permissions
- Check that the path is correct
- Try running the game manually first

**To uninstall:**
```bash
rm ~/Desktop/earth-launcher.desktop
sudo rm /usr/share/applications/earth-launcher.desktop
rm -rf ~/.earth_launcher
``` 