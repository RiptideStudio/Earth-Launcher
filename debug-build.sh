#!/bin/bash

echo "=== Debug Build Process ==="
echo ""

echo "1. Checking current directory:"
pwd
echo ""

echo "2. Checking if index.html exists:"
ls -la index.html
echo ""

echo "3. Checking if src/renderer/main.tsx exists:"
ls -la src/renderer/main.tsx
echo ""

echo "4. Cleaning dist directory:"
rm -rf dist/
echo ""

echo "5. Building renderer:"
npm run build:renderer
echo ""

echo "6. Checking what was built:"
ls -la dist/
echo ""

echo "7. Checking renderer directory:"
ls -la dist/renderer/
echo ""

echo "8. Checking if index.html was created:"
ls -la dist/renderer/index.html
echo ""

echo "9. Building main process:"
npm run build:main
echo ""

echo "10. Final dist contents:"
find dist/ -type f
echo ""

echo "=== Debug Complete ===" 