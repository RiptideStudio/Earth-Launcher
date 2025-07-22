#!/bin/bash

# Create a simple icon for Earth Launcher
# This creates a basic SVG icon that can be converted to PNG

cat > icon.svg << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <!-- Background circle -->
  <circle cx="256" cy="256" r="240" fill="#1a1a2e" stroke="#16213e" stroke-width="8"/>
  
  <!-- Earth globe -->
  <circle cx="256" cy="256" r="120" fill="#0f3460" stroke="#e94560" stroke-width="4"/>
  
  <!-- Continents -->
  <path d="M 180 200 Q 200 180 220 190 Q 240 200 260 190 Q 280 180 300 190 Q 320 200 340 190" 
        stroke="#e94560" stroke-width="3" fill="none"/>
  <path d="M 160 240 Q 180 220 200 230 Q 220 240 240 230 Q 260 220 280 230 Q 300 240 320 230 Q 340 220 360 230" 
        stroke="#e94560" stroke-width="3" fill="none"/>
  <path d="M 140 280 Q 160 260 180 270 Q 200 280 220 270 Q 240 260 260 270 Q 280 280 300 270 Q 320 260 340 270 Q 360 280 380 270" 
        stroke="#e94560" stroke-width="3" fill="none"/>
  
  <!-- Game controller elements -->
  <circle cx="200" cy="350" r="15" fill="#e94560"/>
  <circle cx="312" cy="350" r="15" fill="#e94560"/>
  <rect x="240" y="340" width="32" height="20" rx="10" fill="#e94560"/>
  
  <!-- Stars -->
  <circle cx="100" cy="100" r="2" fill="#e94560"/>
  <circle cx="400" cy="120" r="1.5" fill="#e94560"/>
  <circle cx="120" cy="400" r="1.5" fill="#e94560"/>
  <circle cx="380" cy="380" r="2" fill="#e94560"/>
  <circle cx="80" cy="300" r="1" fill="#e94560"/>
  <circle cx="420" cy="200" r="1" fill="#e94560"/>
</svg>
EOF

# Convert SVG to PNG using ImageMagick if available
if command -v convert >/dev/null 2>&1; then
    echo "Converting SVG to PNG..."
    convert icon.svg -resize 512x512 icon.png
    convert icon.svg -resize 256x256 icon-256.png
    convert icon.svg -resize 128x128 icon-128.png
    convert icon.svg -resize 64x64 icon-64.png
    convert icon.svg -resize 32x32 icon-32.png
    echo "Icons created successfully!"
else
    echo "ImageMagick not found. SVG icon created. Install ImageMagick to convert to PNG:"
    echo "sudo apt install imagemagick"
fi

# Create ICO file for Windows compatibility
if command -v convert >/dev/null 2>&1; then
    convert icon.svg -resize 256x256 icon.ico
    echo "ICO file created for Windows compatibility"
fi 