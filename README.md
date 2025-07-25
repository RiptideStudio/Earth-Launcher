# Earth Launcher

A simple, lightweight game launcher designed specifically for Raspberry Pi handheld devices. Features D-pad navigation and GPIO button support for custom handheld builds.

## Features

- **Simple UI**: Minimal interface optimized for small screens
- **D-pad Navigation**: Full support for directional pad movement
- **GPIO Button Support**: Direct hardware button integration
- **GitHub Integration**: Download games from your GitHub repository
- **Auto-extraction**: Automatically extracts zip files when installing games
- **Game Management**: Install, run, and delete games with simple button presses

## Hardware Requirements

- Raspberry Pi 4 (64-bit recommended)
- Custom handheld case with buttons
- GPIO buttons connected to the following pins (configurable):
  - UP: GPIO 17
  - DOWN: GPIO 18
  - LEFT: GPIO 27
  - RIGHT: GPIO 22
  - A (Select/Install): GPIO 23
  - B (Back/Delete): GPIO 24
  - START (Exit): GPIO 25
  - SELECT (Refresh): GPIO 26

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/Earth-Launcher.git
   cd Earth-Launcher
   ```

2. **Run the setup script:**
   ```bash
   python setup.py
   ```
   
   This will:
   - Install required dependencies
   - Configure GPIO pins and display settings
   - Set up GitHub repository connection
   - Create a sample test game

3. **Manual installation (alternative):**
   ```bash
   pip install -r requirements.txt
   ```

## Configuration

### GitHub Repository Setup

1. Create a GitHub repository to store your game zip files
2. Upload your game zip files to the repository
3. Update `config.json` with your repository details:
   ```json
   {
     "repo_owner": "your_github_username",
     "repo_name": "your_games_repository",
     "github_token": "your_github_token"  // Optional, for private repos
   }
   ```

### GPIO Pin Configuration

Edit the GPIO pin numbers in `config.json` to match your hardware:

```json
{
  "gpio_pins": {
    "UP": 17,
    "DOWN": 18,
    "LEFT": 27,
    "RIGHT": 22,
    "A": 23,
    "B": 24,
    "START": 25,
    "SELECT": 26
  }
}
```

### Display Configuration

Set your screen resolution in `config.json`:

```json
{
  "display": {
    "width": 800,
    "height": 480
  }
}
```

## Usage

### Controls

- **D-pad (UP/DOWN)**: Navigate through games
- **A Button**: Install game (if not installed) or run game (if installed)
- **B Button**: Delete installed game
- **START Button**: Exit launcher
- **SELECT Button**: Refresh game list from repository

### Game Format

Games should be packaged as zip files containing:
- Executable file (common names: `game`, `main`, `start`, `run`, `launch`)
- All game assets and dependencies
- Optional: `README.md` with game instructions

### Supported Game Types

- Python games (`.py` files)
- Shell scripts (`.sh` files)
- Binary executables (`.bin`, `.exe` files)
- Any file that can be executed

## Game Repository Structure

Your GitHub repository should contain zip files of games:

```
your_games_repo/
├── game1.zip
├── game2.zip
├── game3.zip
└── ...
```

Each zip file should extract to a folder with the same name as the zip file.

## Development

### Testing Without GPIO

You can test the launcher on any computer using keyboard controls:
- **Arrow Keys**: Navigate
- **Enter**: A button (Install/Run)
- **Backspace**: B button (Delete)
- **Escape**: START button (Exit)
- **R**: SELECT button (Refresh)

### Adding New Features

The launcher is modular and easy to extend. Key files:
- `main.py`: Main application logic
- `config.json`: Configuration settings
- `setup.py`: Setup and configuration script

## Troubleshooting

### Common Issues

1. **GPIO Permission Error**: Run with sudo or add user to gpio group
   ```bash
   sudo usermod -a -G gpio $USER
   ```

2. **Display Issues**: Check your display resolution in `config.json`

3. **Game Won't Run**: Ensure the game has proper executable permissions
   ```bash
   chmod +x games/game_name/game_file
   ```

4. **GitHub Connection Issues**: Check your repository name and token in `config.json`

### Debug Mode

Run with verbose output:
```bash
python main.py --debug
```

## License

This project is open source. Feel free to modify and distribute.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the configuration
3. Open an issue on GitHub

---

**Happy Gaming! 🎮** 