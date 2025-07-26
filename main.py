#!/usr/bin/env python3
"""
Earth Launcher - A simple game launcher for Raspberry Pi handheld devices
Supports D-pad navigation and GPIO button input
"""

import os
import sys
import json
import zipfile
import subprocess
import threading
import time
from pathlib import Path
import pygame
import requests
from github import Github
import RPi.GPIO as GPIO

# Configuration
CONFIG_FILE = "config.json"
GAMES_DIR = "games"
REPO_OWNER = "your_username"  # Change this to your GitHub username
REPO_NAME = "your_games_repo"  # Change this to your games repository name
GITHUB_TOKEN = None  # Set this if you have a GitHub token for private repos

# GPIO Pin Configuration (adjust these to match your hardware)
GPIO_PINS = {
    'UP': 17,
    'DOWN': 18,
    'LEFT': 27,
    'RIGHT': 22,
    'A': 23,      # Select/Install
    'B': 24,      # Back/Delete
    'START': 11,  # Exit
    'SELECT': 12  # Refresh
}

# Colors
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
GRAY = (128, 128, 128)
GREEN = (0, 255, 0)
RED = (255, 0, 0)
BLUE = (0, 0, 255)
YELLOW = (255, 255, 0)

class GameLauncher:
    def __init__(self):
        pygame.init()
        
        # Set up display for handheld (adjust resolution as needed)
        self.width = 800
        self.height = 480
        self.screen = pygame.display.set_mode((self.width, self.height), pygame.FULLSCREEN)
        pygame.display.set_caption("Earth Launcher")
        
        # Font setup
        self.font_large = pygame.font.Font(None, 36)
        self.font_medium = pygame.font.Font(None, 28)
        self.font_small = pygame.font.Font(None, 24)
        
        # Game state
        self.games = []
        self.installed_games = set()
        self.selected_index = 0
        self.scroll_offset = 0
        self.max_visible = 8
        self.show_exit_button = False  # Track if we're showing exit button
        self.progress_lock = threading.Lock()  # Thread safety for progress updates
        
        # Load configuration
        self.load_config()
        
        # Update launcher from git
        self.update_launcher()
        
        # Set up GPIO
        self.setup_gpio()
        
        # Load games
        self.load_games()
        
    def setup_gpio(self):
        """Set up GPIO pins for button input"""
        GPIO.setmode(GPIO.BCM)
        GPIO.setwarnings(False)
        
        for pin in GPIO_PINS.values():
            GPIO.setup(pin, GPIO.IN, pull_up_down=GPIO.PUD_UP)
            
    def load_config(self):
        """Load configuration from file"""
        if os.path.exists(CONFIG_FILE):
            try:
                with open(CONFIG_FILE, 'r') as f:
                    config = json.load(f)
                    global REPO_OWNER, REPO_NAME, GITHUB_TOKEN
                    REPO_OWNER = config.get('repo_owner', REPO_OWNER)
                    REPO_NAME = config.get('repo_name', REPO_NAME)
                    GITHUB_TOKEN = config.get('github_token', GITHUB_TOKEN)
            except:
                pass
                
    def save_config(self):
        """Save configuration to file"""
        config = {
            'repo_owner': REPO_OWNER,
            'repo_name': REPO_NAME,
            'github_token': GITHUB_TOKEN
        }
        with open(CONFIG_FILE, 'w') as f:
            json.dump(config, f, indent=2)
            
    def update_launcher(self):
        """Update the launcher from git repository"""
        try:
            import subprocess
            import os
            
            # Get the current directory (where the launcher is located)
            current_dir = os.path.dirname(os.path.abspath(__file__))
            
            # Check if this is a git repository
            if os.path.exists(os.path.join(current_dir, '.git')):
                print("Updating launcher from git...")
                
                # Change to the launcher directory
                os.chdir(current_dir)
                
                # Pull the latest changes
                result = subprocess.run(['git', 'pull'], 
                                      capture_output=True, 
                                      text=True, 
                                      timeout=30)
                
                if result.returncode == 0:
                    print("Launcher updated successfully!")
                    if result.stdout.strip():
                        print(f"Changes: {result.stdout.strip()}")
                else:
                    print(f"Git pull failed: {result.stderr.strip()}")
                    
            else:
                print("Not a git repository, skipping update")
                
        except Exception as e:
            print(f"Error updating launcher: {e}")
            # Continue running even if update fails
            
    def load_games(self):
        """Load games from GitHub repository"""
        try:
            if GITHUB_TOKEN:
                g = Github(GITHUB_TOKEN)
            else:
                g = Github()
                
            repo = g.get_repo(f"{REPO_OWNER}/{REPO_NAME}")
            contents = repo.get_contents("")
            
            self.games = []
            for content in contents:
                if content.name.endswith('.zip'):
                    game_name = content.name.replace('.zip', '')
                    self.games.append({
                        'name': game_name,
                        'download_url': content.download_url,
                        'size': content.size
                    })
                    
        except Exception as e:
            print(f"Error loading games: {e}")
            # Fallback to local games directory
            self.load_local_games()
            
    def load_local_games(self):
        """Load games from local directory as fallback"""
        games_path = Path(GAMES_DIR)
        if games_path.exists():
            for zip_file in games_path.glob("*.zip"):
                game_name = zip_file.stem
                self.games.append({
                    'name': game_name,
                    'download_url': str(zip_file),
                    'size': zip_file.stat().st_size
                })
                
    def check_installed_games(self):
        """Check which games are installed"""
        self.installed_games.clear()
        games_path = Path(GAMES_DIR)
        if games_path.exists():
            for game_dir in games_path.iterdir():
                if game_dir.is_dir():
                    self.installed_games.add(game_dir.name)
                    
    def install_game(self, game):
        """Install a game from the repository"""
        try:
            # Create games directory if it doesn't exist
            games_path = Path(GAMES_DIR)
            games_path.mkdir(exist_ok=True)
            
            game_path = games_path / game['name']
            if game_path.exists():
                return False  # Already installed
                
            # Download and extract game
            print(f"Installing {game['name']}...")
            
            if game['download_url'].startswith('http'):
                # Download from GitHub with progress
                zip_path = games_path / f"{game['name']}.zip"
                self.download_with_progress(game['download_url'], zip_path, game['name'])
            else:
                # Local file
                zip_path = Path(game['download_url'])
                
            # Extract the game with progress
            self.extract_with_progress(zip_path, game_path, game['name'])
            
            # Set execute permissions on the main executable
            self.set_execute_permissions(game_path)
                
            # Clean up zip file
            if zip_path.exists():
                zip_path.unlink()
                
            self.installed_games.add(game['name'])
            # Clear installation progress
            self.clear_install_progress(game['name'])
            return True
            
        except Exception as e:
            print(f"Error installing {game['name']}: {e}")
            return False
            
    def download_with_progress(self, url, file_path, game_name):
        """Download file with progress bar"""
        response = requests.get(url, stream=True)
        total_size = int(response.headers.get('content-length', 0))
        
        with open(file_path, 'wb') as f:
            downloaded = 0
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total_size > 0:
                        progress = (downloaded / total_size) * 100
                        self.update_install_progress(game_name, progress, "Downloading")
                        
    def extract_with_progress(self, zip_path, extract_path, game_name):
        """Extract zip file with progress bar"""
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            file_list = zip_ref.namelist()
            total_files = len(file_list)
            
            for i, file_name in enumerate(file_list):
                zip_ref.extract(file_name, extract_path)
                progress = ((i + 1) / total_files) * 100
                self.update_install_progress(game_name, progress, "Extracting")
                
    def update_install_progress(self, game_name, percentage, action):
        """Update installation progress for a specific game"""
        with self.progress_lock:
            # Find the game in the list and update its progress
            for game in self.games:
                if game['name'] == game_name:
                    game['installing'] = True
                    game['progress'] = percentage
                    game['action'] = action
                    break
                
    def clear_install_progress(self, game_name):
        """Clear installation progress for a specific game"""
        with self.progress_lock:
            for game in self.games:
                if game['name'] == game_name:
                    game.pop('installing', None)
                    game.pop('progress', None)
                    game.pop('action', None)
                    break
                    
    def set_execute_permissions(self, game_path):
        """Set execute permissions on the main executable file"""
        # Look for the main executable
        main_executables = ['GameRuntime', 'game', 'main', 'start', 'run', 'launch', 'app', 'program']
        
        for exe_name in main_executables:
            exe_path = game_path / exe_name
            if exe_path.exists():
                try:
                    # Set execute permission (755)
                    os.chmod(exe_path, 0o755)
                    print(f"Set execute permissions on: {exe_path}")
                    return
                except Exception as e:
                    print(f"Error setting permissions on {exe_path}: {e}")
                    
        # If no main executable found, try to find any file without extension
        for file_path in game_path.iterdir():
            if file_path.is_file() and not file_path.suffix and file_path.name[0].isupper():
                try:
                    os.chmod(file_path, 0o755)
                    print(f"Set execute permissions on: {file_path}")
                    return
                except Exception as e:
                    print(f"Error setting permissions on {file_path}: {e}")
            
    def delete_game(self, game):
        """Delete an installed game"""
        try:
            game_path = Path(GAMES_DIR) / game['name']
            if game_path.exists():
                import shutil
                shutil.rmtree(game_path)
                self.installed_games.discard(game['name'])
                return True
        except Exception as e:
            print(f"Error deleting {game['name']}: {e}")
        return False
        
    def run_game(self, game):
        """Run an installed game"""
        game_path = Path(GAMES_DIR) / game['name']
        if not game_path.exists():
            print(f"Game directory not found: {game_path}")
            return False
            
        print(f"Attempting to run game: {game['name']}")
        print(f"Game path: {game_path}")
        
        # List all files in the game directory for debugging
        print("Files in game directory:")
        for item in game_path.iterdir():
            print(f"  - {item.name}")
            
        # Look for any executable file (Linux) - this will find GameRuntime, etc.
        for exe_file in game_path.glob("*"):
            if exe_file.is_file():
                # Check if it's executable OR if it looks like a main executable
                is_executable = os.access(exe_file, os.X_OK)
                is_main_executable = (
                    exe_file.name.lower() in ['gameruntime', 'game', 'main', 'start', 'run', 'launch', 'app', 'program'] or
                    (not exe_file.suffix and exe_file.name[0].isupper())  # Files without extension that start with capital letter
                )
                
                if is_executable or is_main_executable:
                    print(f"Found executable file: {exe_file}")
                    print(f"Absolute path: {exe_file.absolute()}")
                    print(f"File exists: {exe_file.exists()}")
                    print(f"File is file: {exe_file.is_file()}")
                    
                    try:
                        # Use absolute path and run from the game directory
                        subprocess.Popen([str(exe_file.absolute())], cwd=str(game_path))
                        print(f"Successfully started: {exe_file}")
                        return True
                    except Exception as e:
                        print(f"Error running {exe_file}: {e}")
                        continue
                        
        # Look for common executable files as fallback
        executables = ['game', 'main', 'start', 'run', 'launch', 'app', 'program']
        extensions = ['', '.py', '.sh', '.exe', '.bin', '.elf']
        
        for exe in executables:
            for ext in extensions:
                exe_path = game_path / f"{exe}{ext}"
                if exe_path.exists():
                    print(f"Found common executable: {exe_path}")
                    try:
                        # For Python files, use python interpreter
                        if ext == '.py':
                            subprocess.Popen([sys.executable, str(exe_path)], cwd=str(game_path))
                        else:
                            subprocess.Popen([str(exe_path)], cwd=str(game_path))
                        print(f"Successfully started: {exe_path}")
                        return True
                    except Exception as e:
                        print(f"Error running {exe_path}: {e}")
                        continue
                        
        # If no executable found, try to run any Python file
        for py_file in game_path.glob("*.py"):
            print(f"Trying Python file: {py_file}")
            try:
                subprocess.Popen([sys.executable, str(py_file)], cwd=str(game_path))
                print(f"Successfully started Python file: {py_file}")
                return True
            except Exception as e:
                print(f"Error running Python file {py_file}: {e}")
                continue
                
        print(f"Could not find any executable files in {game_path}")
        return False
        
    def handle_input(self):
        """Handle GPIO and keyboard input"""
        # Check GPIO buttons
        if GPIO.input(GPIO_PINS['UP']) == GPIO.LOW:
            self.selected_index = max(0, self.selected_index - 1)
            time.sleep(0.1)
            
        if GPIO.input(GPIO_PINS['DOWN']) == GPIO.LOW:
            self.selected_index = min(len(self.games) - 1, self.selected_index + 1)
            time.sleep(0.1)
            
        if GPIO.input(GPIO_PINS['A']) == GPIO.LOW:
            # Check if exit button is selected
            if self.show_exit_button and self.selected_index >= len(self.games):
                return False  # Exit the launcher
            elif self.selected_index < len(self.games):
                game = self.games[self.selected_index]
                if game['name'] in self.installed_games:
                    print(f"Launching game: {game['name']}")
                    success = self.run_game(game)
                    if not success:
                        print(f"Failed to launch {game['name']}")
                else:
                    # Start installation in a separate thread
                    install_thread = threading.Thread(target=self.install_game, args=(game,))
                    install_thread.daemon = True
                    install_thread.start()
            time.sleep(0.1)
            
        if GPIO.input(GPIO_PINS['B']) == GPIO.LOW:
            if self.selected_index < len(self.games):
                game = self.games[self.selected_index]
                if game['name'] in self.installed_games:
                    self.delete_game(game)
            time.sleep(0.1)
            
        if GPIO.input(GPIO_PINS['START']) == GPIO.LOW:
            return False
            
        # Exit fullscreen with START + SELECT combination
        if GPIO.input(GPIO_PINS['START']) == GPIO.LOW and GPIO.input(GPIO_PINS['SELECT']) == GPIO.LOW:
            pygame.quit()
            return False
            
        # Emergency exit with any 3-button combination
        buttons_pressed = sum([
            GPIO.input(GPIO_PINS['UP']) == GPIO.LOW,
            GPIO.input(GPIO_PINS['DOWN']) == GPIO.LOW,
            GPIO.input(GPIO_PINS['LEFT']) == GPIO.LOW,
            GPIO.input(GPIO_PINS['RIGHT']) == GPIO.LOW,
            GPIO.input(GPIO_PINS['A']) == GPIO.LOW,
            GPIO.input(GPIO_PINS['B']) == GPIO.LOW,
            GPIO.input(GPIO_PINS['START']) == GPIO.LOW,
            GPIO.input(GPIO_PINS['SELECT']) == GPIO.LOW
        ])
        if buttons_pressed >= 3:
            print("Emergency exit triggered!")
            pygame.quit()
            return False
            
        if GPIO.input(GPIO_PINS['SELECT']) == GPIO.LOW:
            self.load_games()
            time.sleep(0.1)
            
        # Toggle exit button with LEFT button
        if GPIO.input(GPIO_PINS['LEFT']) == GPIO.LOW:
            self.show_exit_button = not self.show_exit_button
            time.sleep(0.1)
            
        # Handle keyboard input for testing
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                return False
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_UP:
                    self.selected_index = max(0, self.selected_index - 1)
                elif event.key == pygame.K_DOWN:
                    max_index = len(self.games) - 1
                    if self.show_exit_button:
                        max_index = len(self.games)  # Allow going to exit button
                    self.selected_index = min(max_index, self.selected_index + 1)
                elif event.key == pygame.K_RETURN:  # A button
                    # Check if exit button is selected
                    if self.show_exit_button and self.selected_index >= len(self.games):
                        return False  # Exit the launcher
                    elif self.selected_index < len(self.games):
                        game = self.games[self.selected_index]
                        if game['name'] in self.installed_games:
                            print(f"Launching game: {game['name']}")
                            success = self.run_game(game)
                            if not success:
                                print(f"Failed to launch {game['name']}")
                        else:
                            # Start installation in a separate thread
                            install_thread = threading.Thread(target=self.install_game, args=(game,))
                            install_thread.daemon = True
                            install_thread.start()
                elif event.key == pygame.K_BACKSPACE:  # B button
                    if self.selected_index < len(self.games):
                        game = self.games[self.selected_index]
                        if game['name'] in self.installed_games:
                            self.delete_game(game)
                elif event.key == pygame.K_ESCAPE:  # START button
                    return False
                elif event.key == pygame.K_F11:  # Toggle fullscreen
                    pygame.display.toggle_fullscreen()
                elif event.key == pygame.K_q:  # Quit (Mac-friendly)
                    return False
                elif event.key == pygame.K_F4:  # Force quit
                    pygame.quit()
                    return False
                elif event.key == pygame.K_F12:  # Emergency exit
                    pygame.quit()
                    return False
                elif event.key == pygame.K_LEFT:  # Toggle exit button
                    self.show_exit_button = not self.show_exit_button
                elif event.key == pygame.K_r:  # SELECT button
                    self.load_games()
                    
        return True
        
    def draw(self):
        """Draw the UI"""
        self.screen.fill(BLACK)
        
        # Draw title
        title = self.font_large.render("Earth Launcher", True, WHITE)
        self.screen.blit(title, (20, 20))
        
        # Draw instructions
        instructions = [
            "A: Install/Run | B: Delete | START: Exit | SELECT: Refresh",
            f"Games: {len(self.games)} | Installed: {len(self.installed_games)}"
        ]
        
        for i, instruction in enumerate(instructions):
            text = self.font_small.render(instruction, True, GRAY)
            self.screen.blit(text, (20, 60 + i * 25))
            
        # Draw games list
        start_y = 120
        visible_games = self.games[self.scroll_offset:self.scroll_offset + self.max_visible]
        
        for i, game in enumerate(visible_games):
            y = start_y + i * 40
            is_selected = (self.scroll_offset + i) == self.selected_index
            is_installed = game['name'] in self.installed_games
            
            # Background for selected item
            if is_selected:
                pygame.draw.rect(self.screen, BLUE, (10, y - 5, self.width - 20, 35))
                
            # Game name with progress if installing
            with self.progress_lock:
                if game.get('installing', False):
                    progress = game.get('progress', 0)
                    action = game.get('action', 'Installing')
                    name_with_progress = f"{game['name']} - {action} {progress:.1f}%"
                    color = YELLOW  # Yellow for installing
                else:
                    name_with_progress = game['name']
                    color = GREEN if is_installed else WHITE
                    
            name_text = self.font_medium.render(name_with_progress, True, color)
            self.screen.blit(name_text, (20, y))
            
            # Status indicator (only show if not installing)
            with self.progress_lock:
                if not game.get('installing', False):
                    status = "INSTALLED" if is_installed else "NOT INSTALLED"
                    status_color = GREEN if is_installed else RED
                    status_text = self.font_small.render(status, True, status_color)
                    self.screen.blit(status_text, (self.width - 250, y + 5))
                    
                    # Size info
                    size_mb = game['size'] / (1024 * 1024)
                    size_text = self.font_small.render(f"{size_mb:.1f}MB", True, GRAY)
                    self.screen.blit(size_text, (self.width - 80, y + 5))
            
        # Draw scroll indicator
        if len(self.games) > self.max_visible:
            scroll_text = f"Page {self.scroll_offset // self.max_visible + 1}/{(len(self.games) - 1) // self.max_visible + 1}"
            scroll_surface = self.font_small.render(scroll_text, True, GRAY)
            self.screen.blit(scroll_surface, (20, self.height - 30))
            
        # Draw exit button if enabled
        if self.show_exit_button:
            exit_text = self.font_medium.render("EXIT", True, RED)
            exit_rect = pygame.Rect(self.width - 120, self.height - 50, 100, 30)
            
            # Highlight if selected (when at the bottom of the list)
            if self.selected_index >= len(self.games):
                pygame.draw.rect(self.screen, RED, exit_rect)
                exit_text = self.font_medium.render("EXIT", True, WHITE)
            else:
                pygame.draw.rect(self.screen, BLACK, exit_rect)
                pygame.draw.rect(self.screen, RED, exit_rect, 2)
                
            self.screen.blit(exit_text, (self.width - 110, self.height - 45))
            
        pygame.display.flip()
        
    def run(self):
        """Main game loop"""
        running = True
        clock = pygame.time.Clock()
        
        while running:
            # Update installed games list
            self.check_installed_games()
            
            # Handle input
            running = self.handle_input()
            
            # Update scroll offset
            if self.selected_index >= self.scroll_offset + self.max_visible:
                self.scroll_offset = self.selected_index - self.max_visible + 1
            elif self.selected_index < self.scroll_offset:
                self.scroll_offset = self.selected_index
                
            # Draw
            self.draw()
            
            # Cap frame rate
            clock.tick(60)
            
        # Cleanup
        GPIO.cleanup()
        pygame.quit()
        
if __name__ == "__main__":
    launcher = GameLauncher()
    launcher.run() 