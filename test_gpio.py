#!/usr/bin/env python3
"""
GPIO Test Script for Earth Launcher
Use this to test your button connections and verify GPIO pin assignments
"""

import RPi.GPIO as GPIO
import time
import json

# Load GPIO configuration
try:
    with open('config.json', 'r') as f:
        config = json.load(f)
        GPIO_PINS = config.get('gpio_pins', {})
except:
    # Default pins if config not found
    GPIO_PINS = {
        'UP': 17,
        'DOWN': 18,
        'LEFT': 27,
        'RIGHT': 22,
        'A': 23,
        'B': 24,
        'START': 25,
        'SELECT': 26
    }

def setup_gpio():
    """Set up GPIO pins for testing"""
    GPIO.setmode(GPIO.BCM)
    GPIO.setwarnings(False)
    
    for button, pin in GPIO_PINS.items():
        GPIO.setup(pin, GPIO.IN, pull_up_down=GPIO.PUD_UP)
        print(f"Set up {button} button on GPIO {pin}")

def test_buttons():
    """Test button presses"""
    print("\nGPIO Button Test")
    print("===============")
    print("Press buttons to test. Press Ctrl+C to exit.")
    print()
    
    # Print current pin assignments
    print("Current pin assignments:")
    for button, pin in GPIO_PINS.items():
        print(f"  {button}: GPIO {pin}")
    print()
    
    try:
        while True:
            for button, pin in GPIO_PINS.items():
                if GPIO.input(pin) == GPIO.LOW:
                    print(f"Button pressed: {button} (GPIO {pin})")
                    time.sleep(0.2)  # Debounce
            
            time.sleep(0.01)  # Small delay to prevent high CPU usage
            
    except KeyboardInterrupt:
        print("\nTest completed.")
    finally:
        GPIO.cleanup()

def test_single_pin(pin_number):
    """Test a single GPIO pin"""
    print(f"\nTesting GPIO pin {pin_number}")
    print("Press the button connected to this pin. Press Ctrl+C to exit.")
    
    GPIO.setmode(GPIO.BCM)
    GPIO.setwarnings(False)
    GPIO.setup(pin_number, GPIO.IN, pull_up_down=GPIO.PUD_UP)
    
    try:
        while True:
            if GPIO.input(pin_number) == GPIO.LOW:
                print(f"Button on GPIO {pin_number} pressed!")
                time.sleep(0.2)
            time.sleep(0.01)
    except KeyboardInterrupt:
        print("Test completed.")
    finally:
        GPIO.cleanup()

def main():
    """Main function"""
    print("Earth Launcher GPIO Test")
    print("=======================")
    
    if len(sys.argv) > 1:
        try:
            pin = int(sys.argv[1])
            test_single_pin(pin)
        except ValueError:
            print("Invalid pin number. Usage: python test_gpio.py [pin_number]")
    else:
        setup_gpio()
        test_buttons()

if __name__ == "__main__":
    import sys
    main() 