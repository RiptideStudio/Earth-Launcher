# Earth Launcher

A modern desktop game launcher for the Earth Library. This application allows you to browse, download, and manage games from GitHub repositories with a beautiful and intuitive interface.

## Features

- 🎮 **Game Library Management**: View all your installed games in a clean, organized interface
- 📥 **GitHub Integration**: Download games directly from GitHub repositories
- 🔄 **Auto Updates**: Keep your games up to date with automatic GitHub pulls
- 🚀 **One-Click Launch**: Launch games with a single click
- 🔍 **Search & Filter**: Find games quickly with search functionality
- 📊 **Game Statistics**: Track play time, launch count, and other metrics
- 🎨 **Modern UI**: Beautiful dark theme with smooth animations

## Screenshots

- **Home Dashboard**: Overview of your game library with quick actions
- **Game Library**: Browse and manage all installed games
- **Add Games**: Simple form to add new games from GitHub
- **Game Details**: Detailed view with launch, update, and management options

## Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git (for game downloads)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/earth-launcher.git
   cd earth-launcher
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Development mode**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   npm run dist
   ```

## Usage

### Adding Games

1. Navigate to the "Add Game" page
2. Enter a GitHub repository URL (e.g., `https://github.com/username/game-repo`)
3. The game name will be automatically extracted from the repository name
4. Click "Add Game" to download and install the game

### Game Requirements

For a game to work properly in Earth Launcher, the GitHub repository should contain:

- **Executable files**: `game.exe`, `Game.exe`, `main.exe`, or similar
- **Web games**: `index.html` or `index.htm` for browser-based games
- **Documentation**: A `README.md` file describing the game

### Managing Games

- **Launch**: Click the play button to start a game
- **Update**: Use the refresh button to pull the latest changes from GitHub
- **Details**: Click on a game to view detailed information and statistics
- **Remove**: Delete games from your library (coming soon)

## Development

### Project Structure

```
earth-launcher/
├── src/
│   ├── main/           # Electron main process
│   │   ├── main.ts     # Main window and IPC handlers
│   │   └── preload.ts  # Preload script for security
│   └── renderer/       # React frontend
│       ├── components/ # Reusable UI components
│       ├── pages/      # Page components
│       └── main.tsx    # React entry point
├── dist/               # Built files
└── release/            # Distribution packages
```

### Key Technologies

- **Electron**: Desktop application framework
- **React**: Frontend UI library
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Beautiful icons
- **React Router**: Client-side routing
- **Simple Git**: Git operations for game management

### Building

```bash
# Development
npm run dev

# Production build
npm run build

# Create distributable
npm run dist
```

## Configuration

### Game Storage

Games are stored in the user's application data directory:
- **Windows**: `%APPDATA%/earth-launcher/games/`
- **macOS**: `~/Library/Application Support/earth-launcher/games/`
- **Linux**: `~/.config/earth-launcher/games/`

### Supported Game Types

- **Executable games**: `.exe`, `.app`, or binary files
- **Web games**: HTML5 games with `index.html`
- **Portable games**: Self-contained game packages

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/earth-launcher/issues) page
2. Create a new issue with detailed information
3. Include your operating system and version information

## Roadmap

- [ ] Game categories and tags
- [ ] Cloud save synchronization
- [ ] Game mod support
- [ ] Community features
- [ ] Game achievements
- [ ] Multiplayer game support
- [ ] Game streaming integration

---

Made with ❤️ for the Earth Library community 
