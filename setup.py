#!/usr/bin/env python3
"""
Setup script for Earth Launcher
"""

import os
import sys
import json
import subprocess

def install_dependencies():
    """Install required Python packages"""
    print("Installing dependencies...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("Dependencies installed successfully!")
    except subprocess.CalledProcessError:
        print("Error installing dependencies. Please install them manually:")
        print("pip install -r requirements.txt")
        return False
    return True

def configure_launcher():
    """Configure the launcher settings"""
    print("\n=== Earth Launcher Configuration ===")
    
    # Load existing config
    config = {}
    if os.path.exists("config.json"):
        with open("config.json", "r") as f:
            config = json.load(f)
    
    # Get GitHub repository info
    print("\nGitHub Repository Configuration:")
    repo_owner = input(f"Repository owner [{config.get('repo_owner', 'your_username')}]: ").strip()
    if not repo_owner:
        repo_owner = config.get('repo_owner', 'your_username')
    
    repo_name = input(f"Repository name [{config.get('repo_name', 'your_games_repo')}]: ").strip()
    if not repo_name:
        repo_name = config.get('repo_name', 'your_games_repo')
    
    github_token = input("GitHub token (optional, for private repos): ").strip()
    if not github_token:
        github_token = config.get('github_token')
    
    # GPIO configuration
    print("\nGPIO Pin Configuration:")
    print("Enter the GPIO pin numbers for each button (or press Enter to keep current values):")
    
    gpio_pins = config.get('gpio_pins', {})
    for button in ['UP', 'DOWN', 'LEFT', 'RIGHT', 'A', 'B', 'START', 'SELECT']:
        current_pin = gpio_pins.get(button, 0)
        pin_input = input(f"{button} button pin [{current_pin}]: ").strip()
        if pin_input:
            try:
                gpio_pins[button] = int(pin_input)
            except ValueError:
                print(f"Invalid pin number for {button}, keeping current value")
    
    # Display configuration
    print("\nDisplay Configuration:")
    display_config = config.get('display', {'width': 800, 'height': 480})
    
    width_input = input(f"Display width [{display_config.get('width', 800)}]: ").strip()
    if width_input:
        try:
            display_config['width'] = int(width_input)
        except ValueError:
            print("Invalid width, keeping current value")
    
    height_input = input(f"Display height [{display_config.get('height', 480)}]: ").strip()
    if height_input:
        try:
            display_config['height'] = int(height_input)
        except ValueError:
            print("Invalid height, keeping current value")
    
    # Save configuration
    new_config = {
        'repo_owner': repo_owner,
        'repo_name': repo_name,
        'github_token': github_token,
        'gpio_pins': gpio_pins,
        'display': display_config
    }
    
    with open("config.json", "w") as f:
        json.dump(new_config, f, indent=2)
    
    print("\nConfiguration saved to config.json")
    return True

def create_sample_games():
    """Create sample games directory with a test game"""
    games_dir = "games"
    if not os.path.exists(games_dir):
        os.makedirs(games_dir)
        print(f"Created {games_dir} directory")
    
    # Create a simple test game
    test_game_dir = os.path.join(games_dir, "test_game")
    if not os.path.exists(test_game_dir):
        os.makedirs(test_game_dir)
        
        # Create a simple Python game
        game_code = '''#!/usr/bin/env python3
import pygame
import sys

pygame.init()
screen = pygame.display.set_mode((400, 300))
pygame.display.set_caption("Test Game")

clock = pygame.time.Clock()
running = True

while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        elif event.type == pygame.KEYDOWN:
            if event.key == pygame.K_ESCAPE:
                running = False
    
    screen.fill((0, 0, 0))
    
    # Draw a simple shape
    pygame.draw.circle(screen, (255, 0, 0), (200, 150), 50)
    
    # Draw text
    font = pygame.font.Font(None, 36)
    text = font.render("Test Game Running!", True, (255, 255, 255))
    screen.blit(text, (100, 250))
    
    pygame.display.flip()
    clock.tick(60)

pygame.quit()
'''
        
        with open(os.path.join(test_game_dir, "game.py"), "w") as f:
            f.write(game_code)
        
        print("Created sample test game")

def main():
    """Main setup function"""
    print("Earth Launcher Setup")
    print("===================")
    
    # Install dependencies
    if not install_dependencies():
        return
    
    # Configure launcher
    configure_launcher()
    
    # Create sample games
    create_sample_games()
    
    print("\nSetup complete!")
    print("\nTo run the launcher:")
    print("python main.py")
    print("\nMake sure to:")
    print("1. Update config.json with your GitHub repository details")
    print("2. Adjust GPIO pin numbers to match your hardware")
    print("3. Set display resolution to match your screen")
    print("4. Add your game zip files to your GitHub repository")

if __name__ == "__main__":
    main() 