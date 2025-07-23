#!/usr/bin/env python3
"""
Earth Launcher - Modern Game Launcher for Windows
A simple, elegant game launcher with dark theme and repository support
"""

import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import subprocess
import os
import json
import threading
import requests
import zipfile
import tempfile
from pathlib import Path
from urllib.parse import urljoin

class ModernGameLauncher:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Earth Launcher")
        self.root.geometry("1000x700")
        self.root.configure(bg='#1a1a1a')
        
        # Data storage
        self.games_file = Path.home() / "AppData" / "Local" / "EarthLauncher" / "games.json"
        self.games_file.parent.mkdir(parents=True, exist_ok=True)
        self.games = self.load_games()
        
        # Repository settings - CHANGE THIS TO YOUR GITHUB REPO
        self.repo_owner = "RiptideStudio"  # Change to your GitHub username
        self.repo_name = "Earth-Library"   # Change to your repository name
        self.repo_url = f"https://api.github.com/repos/{self.repo_owner}/{self.repo_name}/contents"
        self.install_dir = Path.home() / "Games" / "EarthLauncher"
        self.install_dir.mkdir(parents=True, exist_ok=True)
        
        # Colors
        self.colors = {
            'bg': '#1a1a1a',
            'fg': '#ffffff',
            'accent': '#3b82f6',
            'secondary': '#374151',
            'success': '#10b981',
            'warning': '#f59e0b',
            'error': '#ef4444'
        }
        
        self.setup_ui()
        self.load_games_list()
        
    def setup_ui(self):
        """Setup the main UI with modern styling"""
        # Configure styles
        style = ttk.Style()
        style.theme_use('clam')
        
        # Configure colors
        style.configure('Dark.TFrame', background=self.colors['bg'])
        style.configure('Dark.TLabel', background=self.colors['bg'], foreground=self.colors['fg'])
        style.configure('Dark.TButton', 
                       background=self.colors['accent'], 
                       foreground=self.colors['fg'],
                       borderwidth=0,
                       focuscolor='none')
        style.map('Dark.TButton',
                 background=[('active', self.colors['accent']),
                           ('pressed', self.colors['accent'])])
        
        # Main container
        main_frame = ttk.Frame(self.root, style='Dark.TFrame')
        main_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)
        
        # Header
        header_frame = ttk.Frame(main_frame, style='Dark.TFrame')
        header_frame.pack(fill=tk.X, pady=(0, 20))
        
        title_label = ttk.Label(header_frame, 
                               text="Earth Launcher", 
                               font=('Arial', 24, 'bold'),
                               style='Dark.TLabel')
        title_label.pack(side=tk.LEFT)
        
        # Buttons frame
        buttons_frame = ttk.Frame(header_frame, style='Dark.TFrame')
        buttons_frame.pack(side=tk.RIGHT)
        
        refresh_repo_btn = ttk.Button(buttons_frame, 
                                     text="Refresh Repository", 
                                     command=self.refresh_repository,
                                     style='Dark.TButton')
        refresh_repo_btn.pack(side=tk.RIGHT, padx=(10, 0))
        
        add_btn = ttk.Button(buttons_frame, 
                            text="Add Local Game", 
                            command=self.add_game_dialog,
                            style='Dark.TButton')
        add_btn.pack(side=tk.RIGHT, padx=(10, 0))
        
        refresh_btn = ttk.Button(buttons_frame, 
                                text="Refresh", 
                                command=self.refresh_games,
                                style='Dark.TButton')
        refresh_btn.pack(side=tk.RIGHT)
        
        # Create notebook for tabs
        notebook = ttk.Notebook(main_frame)
        notebook.pack(fill=tk.BOTH, expand=True)
        
        # Installed Games Tab
        installed_frame = ttk.Frame(notebook, style='Dark.TFrame')
        notebook.add(installed_frame, text="Installed Games")
        
        # Repository Games Tab
        repo_frame = ttk.Frame(notebook, style='Dark.TFrame')
        notebook.add(repo_frame, text="Repository Games")
        
        # Setup installed games tab
        self.setup_installed_games_tab(installed_frame)
        
        # Setup repository games tab
        self.setup_repository_games_tab(repo_frame)
        
        # Status bar
        self.status_var = tk.StringVar()
        self.status_var.set("Ready")
        status_bar = ttk.Label(main_frame, 
                              textvariable=self.status_var,
                              style='Dark.TLabel')
        status_bar.pack(fill=tk.X, pady=(10, 0))
        
        # Load repository games after UI is set up
        self.load_repository_games()
        
    def setup_installed_games_tab(self, parent):
        """Setup the installed games tab"""
        # Games list
        list_frame = ttk.Frame(parent, style='Dark.TFrame')
        list_frame.pack(fill=tk.BOTH, expand=True)
        
        # Create Treeview for installed games
        columns = ('Name', 'Path', 'Status', 'Type')
        self.installed_tree = ttk.Treeview(list_frame, columns=columns, show='headings', height=15)
        
        # Configure columns
        self.installed_tree.heading('Name', text='Game Name')
        self.installed_tree.heading('Path', text='Installation Path')
        self.installed_tree.heading('Status', text='Status')
        self.installed_tree.heading('Type', text='Type')
        
        self.installed_tree.column('Name', width=200)
        self.installed_tree.column('Path', width=300)
        self.installed_tree.column('Status', width=100)
        self.installed_tree.column('Type', width=100)
        
        # Scrollbar
        scrollbar = ttk.Scrollbar(list_frame, orient=tk.VERTICAL, command=self.installed_tree.yview)
        self.installed_tree.configure(yscrollcommand=scrollbar.set)
        
        self.installed_tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        # Bind double-click to launch
        self.installed_tree.bind('<Double-1>', self.launch_selected_game)
        
        # Action buttons
        actions_frame = ttk.Frame(parent, style='Dark.TFrame')
        actions_frame.pack(fill=tk.X, pady=(10, 0))
        
        uninstall_btn = ttk.Button(actions_frame, 
                                  text="Uninstall Selected", 
                                  command=self.uninstall_selected_game,
                                  style='Dark.TButton')
        uninstall_btn.pack(side=tk.LEFT)
        
    def setup_repository_games_tab(self, parent):
        """Setup the repository games tab"""
        # Repository info
        info_frame = ttk.Frame(parent, style='Dark.TFrame')
        info_frame.pack(fill=tk.X, pady=(0, 10))
        
        ttk.Label(info_frame, 
                 text="Available games from Earth Library repository", 
                 style='Dark.TLabel').pack(side=tk.LEFT)
        
        # Games list
        list_frame = ttk.Frame(parent, style='Dark.TFrame')
        list_frame.pack(fill=tk.BOTH, expand=True)
        
        # Create Treeview for repository games
        columns = ('Name', 'Description', 'Size', 'Status')
        self.repo_tree = ttk.Treeview(list_frame, columns=columns, show='headings', height=15)
        
        # Configure columns
        self.repo_tree.heading('Name', text='Game Name')
        self.repo_tree.heading('Description', text='Description')
        self.repo_tree.heading('Size', text='Size')
        self.repo_tree.heading('Status', text='Status')
        
        self.repo_tree.column('Name', width=200)
        self.repo_tree.column('Description', width=300)
        self.repo_tree.column('Size', width=100)
        self.repo_tree.column('Status', width=100)
        
        # Scrollbar
        scrollbar = ttk.Scrollbar(list_frame, orient=tk.VERTICAL, command=self.repo_tree.yview)
        self.repo_tree.configure(yscrollcommand=scrollbar.set)
        
        self.repo_tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        # Action buttons
        actions_frame = ttk.Frame(parent, style='Dark.TFrame')
        actions_frame.pack(fill=tk.X, pady=(10, 0))
        
        install_btn = ttk.Button(actions_frame, 
                                text="Install Selected", 
                                command=self.install_selected_game,
                                style='Dark.TButton')
        install_btn.pack(side=tk.LEFT)
        
    def load_games(self):
        """Load games from JSON file"""
        if self.games_file.exists():
            try:
                with open(self.games_file, 'r') as f:
                    return json.load(f)
            except:
                return {}
        return {}
    
    def save_games(self):
        """Save games to JSON file"""
        with open(self.games_file, 'w') as f:
            json.dump(self.games, f, indent=2)
    
    def load_games_list(self):
        """Load games into the Treeview"""
        # Clear existing items
        for item in self.installed_tree.get_children():
            self.installed_tree.delete(item)
        
        # Add games
        for name, game_info in self.games.items():
            status = "Installed" if os.path.exists(game_info['path']) else "Missing"
            game_type = game_info.get('type', 'Local')
            self.installed_tree.insert('', tk.END, values=(name, game_info['path'], status, game_type))
    
    def load_repository_games(self):
        """Load games from repository"""
        self.status_var.set("Loading repository games...")
        
        def fetch_games():
            try:
                # Fetch games from GitHub repository
                games = self.fetch_github_games()
                
                # Update UI on main thread
                self.root.after(0, lambda: self.update_repository_games_list(games))
                
            except Exception as e:
                self.root.after(0, lambda: self.status_var.set(f"Error loading repository: {e}"))
        
        threading.Thread(target=fetch_games, daemon=True).start()
    
    def fetch_github_games(self):
        """Fetch games from GitHub repository"""
        # Use the configured repository URL
        api_url = self.repo_url
        
        try:
            response = requests.get(api_url, timeout=10)
            response.raise_for_status()
            
            contents = response.json()
            games = []
            
            for item in contents:
                if item['type'] == 'file' and item['name'].endswith('.zip'):
                    # Extract game info from filename
                    game_name = item['name'].replace('.zip', '').replace('-', ' ').replace('_', ' ').title()
                    
                    games.append({
                        'name': game_name,
                        'description': f"Game from {item['name']}",
                        'size': f"{item['size'] / 1024:.1f} KB",
                        'status': 'Available',
                        'download_url': item['download_url'],
                        'executable': self.guess_executable_name(game_name)
                    })
            
            return games
            
        except requests.exceptions.RequestException:
            # If GitHub API fails, return empty list
            return []
    
    def guess_executable_name(self, game_name):
        """Guess the executable name based on game name"""
        # Convert game name to executable format
        base_name = game_name.lower().replace(' ', '_').replace('-', '_')
        return f"{base_name}.exe"
    
    def update_repository_games_list(self, games):
        """Update the repository games list in the UI"""
        # Clear existing items
        for item in self.repo_tree.get_children():
            self.repo_tree.delete(item)
        
        if not games:
            # Show message if no games found
            self.repo_tree.insert('', tk.END, values=(
                "No games found", 
                "Check repository URL or try refreshing", 
                "", 
                "Error"
            ))
            self.status_var.set("No games found in repository")
            return
        
        # Add games
        for game in games:
            status = "Available"
            if game['name'] in self.games:
                status = "Installed"
            
            self.repo_tree.insert('', tk.END, values=(
                game['name'], 
                game['description'], 
                game['size'], 
                status
            ))
        
        self.status_var.set(f"Loaded {len(games)} games from repository")
    
    def refresh_repository(self):
        """Refresh the repository games list"""
        self.status_var.set("Refreshing repository...")
        
        def refresh():
            try:
                self.load_repository_games()
                self.root.after(0, lambda: self.status_var.set("Repository refreshed"))
            except Exception as e:
                self.root.after(0, lambda: self.status_var.set(f"Error refreshing repository: {e}"))
        
        threading.Thread(target=refresh, daemon=True).start()
    
    def install_selected_game(self):
        """Install the selected game from repository"""
        selection = self.repo_tree.selection()
        if not selection:
            messagebox.showwarning("Warning", "Please select a game to install")
            return
        
        item = self.repo_tree.item(selection[0])
        game_name = item['values'][0]
        
        if game_name in self.games:
            messagebox.showinfo("Info", f"{game_name} is already installed")
            return
        
        # Get game info from our repository data
        game_info = self.get_game_info(game_name)
        if not game_info:
            messagebox.showerror("Error", f"Game information not found for {game_name}")
            return
        
        # Show download progress
        progress_dialog = self.show_download_progress(game_name)
        
        def download_and_install():
            try:
                # Create game directory
                game_dir = self.install_dir / game_name.lower().replace(' ', '_')
                game_dir.mkdir(parents=True, exist_ok=True)
                
                # Download the ZIP file
                zip_path = self.download_game_zip(game_info['download_url'], game_name, progress_dialog)
                if not zip_path:
                    self.root.after(0, lambda: progress_dialog.destroy())
                    return
                
                # Extract the ZIP file
                self.extract_game_zip(zip_path, game_dir, progress_dialog)
                
                # Find the executable - look for common game file types
                executable_path = None
                possible_executables = [
                    game_dir / game_info['executable'],
                    game_dir / f"{game_name.lower().replace(' ', '_')}.exe",
                    game_dir / f"{game_name.lower().replace(' ', '_')}.py",
                    game_dir / "game.exe",
                    game_dir / "main.exe",
                    game_dir / "launcher.exe"
                ]
                
                # Also search for any .exe or .py files in the extracted directory
                for file_path in game_dir.rglob("*.exe"):
                    possible_executables.append(file_path)
                for file_path in game_dir.rglob("*.py"):
                    possible_executables.append(file_path)
                
                # Find the first existing executable
                for exe_path in possible_executables:
                    if exe_path.exists():
                        executable_path = exe_path
                        break
                
                if not executable_path:
                    # If no executable found, show error instead of creating fallback
                    self.root.after(0, lambda: self.handle_installation_error(
                        f"No executable found in {game_name}.zip. Please check the ZIP file contains a game executable.", 
                        progress_dialog
                    ))
                    return
                
                # Add to games list
                self.games[game_name] = {
                    'path': str(executable_path),
                    'type': 'Repository',
                    'installed_date': '2024-01-01',
                    'download_url': game_info['download_url']
                }
                self.save_games()
                
                # Update UI
                self.root.after(0, lambda: self.finish_installation(game_name, progress_dialog))
                
            except Exception as e:
                self.root.after(0, lambda: self.handle_installation_error(str(e), progress_dialog))
        
        threading.Thread(target=download_and_install, daemon=True).start()
    
    def get_game_info(self, game_name):
        """Get game information from repository data"""
        # Fetch fresh data from GitHub
        games = self.fetch_github_games()
        
        for game in games:
            if game['name'] == game_name:
                return {
                    'download_url': game['download_url'],
                    'executable': game['executable']
                }
        
        return None
    
    def show_download_progress(self, game_name):
        """Show download progress dialog"""
        dialog = tk.Toplevel(self.root)
        dialog.title(f"Installing {game_name}")
        dialog.geometry("400x200")
        dialog.configure(bg=self.colors['bg'])
        dialog.transient(self.root)
        dialog.grab_set()
        
        # Center the dialog
        dialog.geometry("+%d+%d" % (self.root.winfo_rootx() + 50,
                                   self.root.winfo_rooty() + 50))
        
        ttk.Label(dialog, text=f"Installing {game_name}...", style='Dark.TLabel').pack(pady=(20, 10))
        
        progress_var = tk.StringVar()
        progress_var.set("Downloading...")
        progress_label = ttk.Label(dialog, textvariable=progress_var, style='Dark.TLabel')
        progress_label.pack(pady=10)
        
        dialog.progress_var = progress_var
        dialog.progress_label = progress_label
        
        return dialog
    
    def download_game_zip(self, url, game_name, progress_dialog):
        """Download game ZIP file"""
        try:
            # Try to download from the actual URL first
            try:
                progress_dialog.progress_var.set("Downloading from repository...")
                
                import tempfile
                temp_dir = tempfile.mkdtemp()
                zip_path = Path(temp_dir) / f"{game_name.lower().replace(' ', '_')}.zip"
                
                # Attempt to download the actual ZIP file
                response = requests.get(url, stream=True, timeout=10)
                response.raise_for_status()
                
                total_size = int(response.headers.get('content-length', 0))
                downloaded = 0
                
                with open(zip_path, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        if chunk:
                            f.write(chunk)
                            downloaded += len(chunk)
                            if total_size > 0:
                                progress = (downloaded / total_size) * 100
                                progress_dialog.progress_var.set(f"Downloading... {progress:.1f}%")
                
                progress_dialog.progress_var.set("Download complete!")
                
                # Show what's in the ZIP file
                self.show_zip_contents(zip_path, game_name)
                
                return zip_path
                
            except requests.exceptions.RequestException:
                # If download fails, create a demo ZIP file
                progress_dialog.progress_var.set("Creating demo game package...")
                
                import tempfile
                temp_dir = tempfile.mkdtemp()
                zip_path = Path(temp_dir) / f"{game_name.lower().replace(' ', '_')}.zip"
                
                # Create the game content
                if game_name == "Retro Snake":
                    game_code = self.create_snake_game()
                elif game_name == "Space Invaders":
                    game_code = self.create_space_invaders_game()
                elif game_name == "Tetris Classic":
                    game_code = self.create_tetris_game()
                elif game_name == "Pong Remastered":
                    game_code = self.create_pong_game()
                else:
                    game_code = self.create_generic_game(game_name)
                
                # Create a ZIP file with the game
                with zipfile.ZipFile(zip_path, 'w') as zipf:
                    # Add the main game file
                    zipf.writestr(f"{game_name.lower().replace(' ', '_')}.py", game_code)
                    
                    # Add a README
                    readme_content = f"""# {game_name}

This is a Python game created by Earth Launcher.

## How to run:
python {game_name.lower().replace(' ', '_')}.py

## Controls:
- Use arrow keys to control the game
- Press ESC to exit

Enjoy playing!
"""
                    zipf.writestr("README.md", readme_content)
                
                progress_dialog.progress_var.set("Demo package created!")
                return zip_path
            
        except Exception as e:
            progress_dialog.progress_var.set(f"Download failed: {e}")
            return None
    
    def show_zip_contents(self, zip_path, game_name):
        """Show what's inside the downloaded ZIP file"""
        try:
            with zipfile.ZipFile(zip_path, 'r') as zipf:
                file_list = zipf.namelist()
                print(f"\n=== Contents of {game_name}.zip ===")
                for file_name in file_list:
                    print(f"  {file_name}")
                print("=" * 50)
        except Exception as e:
            print(f"Error reading ZIP contents: {e}")
    
    def extract_game_zip(self, zip_path, game_dir, progress_dialog):
        """Extract game ZIP file"""
        try:
            progress_dialog.progress_var.set("Extracting game files...")
            
            with zipfile.ZipFile(zip_path, 'r') as zipf:
                # List all files in the ZIP
                file_list = zipf.namelist()
                progress_dialog.progress_var.set(f"Found {len(file_list)} files in ZIP")
                
                # Extract all files
                zipf.extractall(game_dir)
            
            progress_dialog.progress_var.set("Extraction complete!")
            
            # Log what was extracted
            print(f"Extracted files to {game_dir}:")
            for file_path in game_dir.rglob("*"):
                if file_path.is_file():
                    print(f"  - {file_path.name}")
            
        except Exception as e:
            progress_dialog.progress_var.set(f"Extraction failed: {e}")
            raise
    
    def create_fallback_game(self, game_dir, game_name):
        """Create a fallback Python game if executable not found"""
        game_path = game_dir / f"{game_name.lower().replace(' ', '_')}.py"
        
        if game_name == "Retro Snake":
            game_code = self.create_snake_game()
        elif game_name == "Space Invaders":
            game_code = self.create_space_invaders_game()
        elif game_name == "Tetris Classic":
            game_code = self.create_tetris_game()
        elif game_name == "Pong Remastered":
            game_code = self.create_pong_game()
        else:
            game_code = self.create_generic_game(game_name)
        
        with open(game_path, 'w') as f:
            f.write(game_code)
        
        return game_path
    
    def finish_installation(self, game_name, progress_dialog):
        """Finish the installation process"""
        progress_dialog.destroy()
        self.load_games_list()
        self.load_repository_games()  # Refresh repo list to update status
        self.status_var.set(f"Installed: {game_name}")
        messagebox.showinfo("Success", f"{game_name} has been installed successfully!")
    
    def handle_installation_error(self, error, progress_dialog):
        """Handle installation errors"""
        progress_dialog.destroy()
        messagebox.showerror("Installation Error", f"Failed to install game: {error}")
        self.status_var.set("Installation failed")
    
    def create_snake_game(self):
        """Create a simple Snake game"""
        return '''#!/usr/bin/env python3
import tkinter as tk
import random

class SnakeGame:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Retro Snake")
        self.root.geometry("400x400")
        self.root.configure(bg='black')
        
        self.canvas = tk.Canvas(self.root, bg='black', width=400, height=400)
        self.canvas.pack()
        
        self.snake = [(100, 100), (90, 100), (80, 100)]
        self.direction = "Right"
        self.food = self.create_food()
        self.score = 0
        
        self.root.bind("<KeyPress>", self.change_direction)
        self.update()
        self.root.mainloop()
    
    def create_food(self):
        x = random.randint(0, 19) * 20
        y = random.randint(0, 19) * 20
        return (x, y)
    
    def change_direction(self, event):
        if event.keysym == "Up" and self.direction != "Down":
            self.direction = "Up"
        elif event.keysym == "Down" and self.direction != "Up":
            self.direction = "Down"
        elif event.keysym == "Left" and self.direction != "Right":
            self.direction = "Left"
        elif event.keysym == "Right" and self.direction != "Left":
            self.direction = "Right"
    
    def update(self):
        head = self.snake[0]
        if self.direction == "Up":
            new_head = (head[0], head[1] - 20)
        elif self.direction == "Down":
            new_head = (head[0], head[1] + 20)
        elif self.direction == "Left":
            new_head = (head[0] - 20, head[1])
        else:
            new_head = (head[0] + 20, head[1])
        
        if new_head in self.snake or new_head[0] < 0 or new_head[0] >= 400 or new_head[1] < 0 or new_head[1] >= 400:
            self.game_over()
            return
        
        self.snake.insert(0, new_head)
        
        if new_head == self.food:
            self.score += 10
            self.food = self.create_food()
        else:
            self.snake.pop()
        
        self.draw()
        self.root.after(150, self.update)
    
    def draw(self):
        self.canvas.delete("all")
        for segment in self.snake:
            self.canvas.create_rectangle(segment[0], segment[1], segment[0] + 20, segment[1] + 20, fill="green")
        self.canvas.create_oval(self.food[0], self.food[1], self.food[0] + 20, self.food[1] + 20, fill="red")
        self.canvas.create_text(50, 20, text=f"Score: {self.score}", fill="white")
    
    def game_over(self):
        self.canvas.create_text(200, 200, text="GAME OVER", fill="red", font=("Arial", 24))
        self.canvas.create_text(200, 230, text=f"Final Score: {self.score}", fill="white", font=("Arial", 16))

if __name__ == "__main__":
    SnakeGame()
'''
    
    def create_space_invaders_game(self):
        """Create a simple Space Invaders game"""
        return '''#!/usr/bin/env python3
import tkinter as tk
import random

class SpaceInvaders:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Space Invaders")
        self.root.geometry("400x500")
        self.root.configure(bg='black')
        
        self.canvas = tk.Canvas(self.root, bg='black', width=400, height=500)
        self.canvas.pack()
        
        self.player_x = 200
        self.bullets = []
        self.enemies = [(x, 50) for x in range(50, 350, 50)]
        self.score = 0
        
        self.root.bind("<KeyPress>", self.handle_input)
        self.update()
        self.root.mainloop()
    
    def handle_input(self, event):
        if event.keysym == "Left" and self.player_x > 0:
            self.player_x -= 20
        elif event.keysym == "Right" and self.player_x < 380:
            self.player_x += 20
        elif event.keysym == "space":
            self.bullets.append([self.player_x + 10, 450])
    
    def update(self):
        # Move bullets
        for bullet in self.bullets[:]:
            bullet[1] -= 10
            if bullet[1] < 0:
                self.bullets.remove(bullet)
        
        # Check collisions
        for bullet in self.bullets[:]:
            for enemy in self.enemies[:]:
                if (bullet[0] > enemy[0] and bullet[0] < enemy[0] + 30 and
                    bullet[1] > enemy[1] and bullet[1] < enemy[1] + 30):
                    self.bullets.remove(bullet)
                    self.enemies.remove(enemy)
                    self.score += 10
                    break
        
        self.draw()
        if self.enemies:
            self.root.after(50, self.update)
        else:
            self.canvas.create_text(200, 250, text="YOU WIN!", fill="green", font=("Arial", 24))
    
    def draw(self):
        self.canvas.delete("all")
        # Draw player
        self.canvas.create_rectangle(self.player_x, 450, self.player_x + 20, 470, fill="blue")
        # Draw bullets
        for bullet in self.bullets:
            self.canvas.create_oval(bullet[0], bullet[1], bullet[0] + 5, bullet[1] + 5, fill="yellow")
        # Draw enemies
        for enemy in self.enemies:
            self.canvas.create_rectangle(enemy[0], enemy[1], enemy[0] + 30, enemy[1] + 30, fill="red")
        # Draw score
        self.canvas.create_text(50, 20, text=f"Score: {self.score}", fill="white")

if __name__ == "__main__":
    SpaceInvaders()
'''
    
    def create_tetris_game(self):
        """Create a simple Tetris game"""
        return '''#!/usr/bin/env python3
import tkinter as tk
import random

class Tetris:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Tetris Classic")
        self.root.geometry("300x600")
        self.root.configure(bg='black')
        
        self.canvas = tk.Canvas(self.root, bg='black', width=300, height=600)
        self.canvas.pack()
        
        self.board = [[0] * 10 for _ in range(20)]
        self.current_piece = self.new_piece()
        self.score = 0
        
        self.root.bind("<KeyPress>", self.handle_input)
        self.update()
        self.root.mainloop()
    
    def new_piece(self):
        pieces = [
            [[1, 1, 1, 1]],  # I
            [[1, 1], [1, 1]],  # O
            [[1, 1, 1], [0, 1, 0]],  # T
        ]
        return {
            'shape': random.choice(pieces),
            'x': 3,
            'y': 0
        }
    
    def handle_input(self, event):
        if event.keysym == "Left" and self.can_move(self.current_piece, -1, 0):
            self.current_piece['x'] -= 1
        elif event.keysym == "Right" and self.can_move(self.current_piece, 1, 0):
            self.current_piece['x'] += 1
        elif event.keysym == "Down" and self.can_move(self.current_piece, 0, 1):
            self.current_piece['y'] += 1
    
    def can_move(self, piece, dx, dy):
        new_x = piece['x'] + dx
        new_y = piece['y'] + dy
        
        for y, row in enumerate(piece['shape']):
            for x, cell in enumerate(row):
                if cell:
                    if (new_x + x < 0 or new_x + x >= 10 or 
                        new_y + y >= 20 or 
                        (new_y + y >= 0 and self.board[new_y + y][new_x + x])):
                        return False
        return True
    
    def update(self):
        if self.can_move(self.current_piece, 0, 1):
            self.current_piece['y'] += 1
        else:
            self.place_piece()
            self.clear_lines()
            self.current_piece = self.new_piece()
            if not self.can_move(self.current_piece, 0, 0):
                self.game_over()
                return
        
        self.draw()
        self.root.after(500, self.update)
    
    def place_piece(self):
        for y, row in enumerate(self.current_piece['shape']):
            for x, cell in enumerate(row):
                if cell:
                    self.board[self.current_piece['y'] + y][self.current_piece['x'] + x] = 1
    
    def clear_lines(self):
        lines_cleared = 0
        for y in range(20):
            if all(self.board[y]):
                del self.board[y]
                self.board.insert(0, [0] * 10)
                lines_cleared += 1
        self.score += lines_cleared * 100
    
    def draw(self):
        self.canvas.delete("all")
        # Draw board
        for y in range(20):
            for x in range(10):
                if self.board[y][x]:
                    self.canvas.create_rectangle(x*30, y*30, (x+1)*30, (y+1)*30, fill="cyan")
        
        # Draw current piece
        for y, row in enumerate(self.current_piece['shape']):
            for x, cell in enumerate(row):
                if cell:
                    self.canvas.create_rectangle(
                        (self.current_piece['x'] + x) * 30,
                        (self.current_piece['y'] + y) * 30,
                        (self.current_piece['x'] + x + 1) * 30,
                        (self.current_piece['y'] + y + 1) * 30,
                        fill="yellow"
                    )
        
        # Draw score
        self.canvas.create_text(50, 20, text=f"Score: {self.score}", fill="white")
    
    def game_over(self):
        self.canvas.create_text(150, 300, text="GAME OVER", fill="red", font=("Arial", 24))

if __name__ == "__main__":
    Tetris()
'''
    
    def create_pong_game(self):
        """Create a simple Pong game"""
        return '''#!/usr/bin/env python3
import tkinter as tk
import random

class Pong:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Pong Remastered")
        self.root.geometry("400x300")
        self.root.configure(bg='black')
        
        self.canvas = tk.Canvas(self.root, bg='black', width=400, height=300)
        self.canvas.pack()
        
        self.paddle_y = 150
        self.ball_x = 200
        self.ball_y = 150
        self.ball_dx = 5
        self.ball_dy = 3
        self.score = 0
        
        self.root.bind("<KeyPress>", self.handle_input)
        self.update()
        self.root.mainloop()
    
    def handle_input(self, event):
        if event.keysym == "Up" and self.paddle_y > 0:
            self.paddle_y -= 20
        elif event.keysym == "Down" and self.paddle_y < 250:
            self.paddle_y += 20
    
    def update(self):
        # Move ball
        self.ball_x += self.ball_dx
        self.ball_y += self.ball_dy
        
        # Ball collision with walls
        if self.ball_y <= 0 or self.ball_y >= 290:
            self.ball_dy *= -1
        
        # Ball collision with paddle
        if (self.ball_x <= 30 and self.ball_x >= 20 and
            self.ball_y >= self.paddle_y and self.ball_y <= self.paddle_y + 50):
            self.ball_dx *= -1
            self.score += 1
        
        # Ball out of bounds
        if self.ball_x < 0:
            self.game_over()
            return
        
        if self.ball_x > 400:
            self.ball_dx *= -1
        
        self.draw()
        self.root.after(50, self.update)
    
    def draw(self):
        self.canvas.delete("all")
        # Draw paddle
        self.canvas.create_rectangle(20, self.paddle_y, 30, self.paddle_y + 50, fill="white")
        # Draw ball
        self.canvas.create_oval(self.ball_x, self.ball_y, self.ball_x + 10, self.ball_y + 10, fill="white")
        # Draw score
        self.canvas.create_text(50, 20, text=f"Score: {self.score}", fill="white")
    
    def game_over(self):
        self.canvas.create_text(200, 150, text="GAME OVER", fill="red", font=("Arial", 24))
        self.canvas.create_text(200, 180, text=f"Final Score: {self.score}", fill="white", font=("Arial", 16))

if __name__ == "__main__":
    Pong()
'''
    
    def create_generic_game(self, game_name):
        """Create a generic game template"""
        return f'''#!/usr/bin/env python3
import tkinter as tk
import random

class {game_name.replace(" ", "")}:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("{game_name}")
        self.root.geometry("400x400")
        self.root.configure(bg='black')
        
        self.canvas = tk.Canvas(self.root, bg='black', width=400, height=400)
        self.canvas.pack()
        
        self.score = 0
        self.targets = [(random.randint(0, 380), random.randint(0, 380)) for _ in range(5)]
        
        self.root.bind("<Button-1>", self.click_target)
        self.update()
        self.root.mainloop()
    
    def click_target(self, event):
        for target in self.targets[:]:
            if (abs(event.x - target[0]) < 20 and abs(event.y - target[1]) < 20):
                self.targets.remove(target)
                self.score += 10
                self.targets.append((random.randint(0, 380), random.randint(0, 380)))
                break
    
    def update(self):
        self.draw()
        if self.targets:
            self.root.after(100, self.update)
        else:
            self.canvas.create_text(200, 200, text="YOU WIN!", fill="green", font=("Arial", 24))
    
    def draw(self):
        self.canvas.delete("all")
        for target in self.targets:
            self.canvas.create_oval(target[0], target[1], target[0] + 40, target[1] + 40, fill="red")
        self.canvas.create_text(50, 20, text=f"Score: {{self.score}}", fill="white")

if __name__ == "__main__":
    {game_name.replace(" ", "")}()
'''
    
    def uninstall_selected_game(self):
        """Uninstall the selected game"""
        selection = self.installed_tree.selection()
        if not selection:
            messagebox.showwarning("Warning", "Please select a game to uninstall")
            return
        
        item = self.installed_tree.item(selection[0])
        game_name = item['values'][0]
        
        if messagebox.askyesno("Confirm", f"Are you sure you want to uninstall {game_name}?"):
            if game_name in self.games:
                # Remove game file if it exists
                game_path = Path(self.games[game_name]['path'])
                if game_path.exists():
                    try:
                        game_path.unlink()
                    except:
                        pass  # File might be in use
                
                # Remove from games list
                del self.games[game_name]
                self.save_games()
                self.load_games_list()
                self.load_repository_games()  # Refresh repo list
                
                self.status_var.set(f"Uninstalled: {game_name}")
    
    def add_game_dialog(self):
        """Show dialog to add a new local game"""
        dialog = tk.Toplevel(self.root)
        dialog.title("Add Local Game")
        dialog.geometry("400x300")
        dialog.configure(bg=self.colors['bg'])
        dialog.transient(self.root)
        dialog.grab_set()
        
        # Center the dialog
        dialog.geometry("+%d+%d" % (self.root.winfo_rootx() + 50,
                                   self.root.winfo_rooty() + 50))
        
        # Game name
        ttk.Label(dialog, text="Game Name:", style='Dark.TLabel').pack(pady=(20, 5))
        name_entry = tk.Entry(dialog, bg=self.colors['secondary'], fg=self.colors['fg'])
        name_entry.pack(fill=tk.X, padx=20)
        
        # Game path
        ttk.Label(dialog, text="Game Path:", style='Dark.TLabel').pack(pady=(20, 5))
        path_frame = ttk.Frame(dialog, style='Dark.TFrame')
        path_frame.pack(fill=tk.X, padx=20)
        
        path_entry = tk.Entry(path_frame, bg=self.colors['secondary'], fg=self.colors['fg'])
        path_entry.pack(side=tk.LEFT, fill=tk.X, expand=True)
        
        def browse_path():
            path = filedialog.askopenfilename(title="Select Game Executable", 
                                            filetypes=[("Executable files", "*.exe"), ("All files", "*.*")])
            if path:
                path_entry.delete(0, tk.END)
                path_entry.insert(0, path)
        
        browse_btn = ttk.Button(path_frame, text="Browse", command=browse_path, style='Dark.TButton')
        browse_btn.pack(side=tk.RIGHT, padx=(10, 0))
        
        # Add button
        def add_game():
            name = name_entry.get().strip()
            path = path_entry.get().strip()
            
            if not name or not path:
                messagebox.showerror("Error", "Please fill in all fields")
                return
            
            self.games[name] = {
                'path': path,
                'type': 'Local',
                'added_date': '2024-01-01'
            }
            self.save_games()
            self.load_games_list()
            dialog.destroy()
            self.status_var.set(f"Added game: {name}")
        
        add_btn = ttk.Button(dialog, text="Add Game", command=add_game, style='Dark.TButton')
        add_btn.pack(pady=20)
    
    def launch_selected_game(self, event=None):
        """Launch the selected game"""
        selection = self.installed_tree.selection()
        if not selection:
            return
        
        item = self.installed_tree.item(selection[0])
        game_name = item['values'][0]
        
        if game_name in self.games:
            game_path = self.games[game_name]['path']
            
            if not os.path.exists(game_path):
                messagebox.showerror("Error", f"Game executable not found: {game_path}")
                return
            
            # Launch game in background
            def launch():
                try:
                    # Check if it's a Python file and run with python
                    if game_path.endswith('.py'):
                        subprocess.Popen(['python', game_path], cwd=os.path.dirname(game_path))
                    else:
                        subprocess.Popen([game_path], cwd=os.path.dirname(game_path))
                    self.status_var.set(f"Launched: {game_name}")
                except Exception as e:
                    messagebox.showerror("Error", f"Failed to launch game: {e}")
            
            threading.Thread(target=launch, daemon=True).start()
    
    def refresh_games(self):
        """Refresh the games list"""
        self.load_games_list()
        self.status_var.set("Games list refreshed")
    
    def run(self):
        """Start the application"""
        self.root.mainloop()

if __name__ == "__main__":
    app = ModernGameLauncher()
    app.run() 