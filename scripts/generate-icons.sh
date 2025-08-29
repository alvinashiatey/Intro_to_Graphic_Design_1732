#!/bin/bash

# Script to generate PWA icons from PNG using ImageMagick
# This script requires ImageMagick to be installed
# You can install it via: brew install imagemagick

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "Error: ImageMagick is not installed. Please install it first:"
    echo "  brew install imagemagick"
    exit 1
fi

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# Get the project root directory (parent of scripts)
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Source and destination paths
SOURCE_ICON="$PROJECT_ROOT/public/icon.png"
ICONS_DIR="$PROJECT_ROOT/public/icons"

# Create icons directory if it doesn't exist
mkdir -p "$ICONS_DIR"

# Check if source PNG exists
if [ ! -f "$SOURCE_ICON" ]; then
    echo "Error: Source PNG file not found at $SOURCE_ICON"
    exit 1
fi

# Icon sizes to generate
sizes=(72 96 128 144 152 192 384 512)

echo "Generating PWA icons from $SOURCE_ICON..."

# Generate icons for each size
for size in "${sizes[@]}"; do
    output_file="$ICONS_DIR/icon-${size}x${size}.png"
    
    # High quality conversion with sharpening for better clarity
    # -strip removes any problematic color profiles
    # -colorspace sRGB ensures correct color space
    # -density increases the resolution for sharper output
    convert "$SOURCE_ICON" \
            -strip \
            -colorspace sRGB \
            -density 300 \
            -filter Lanczos \
            -resize ${size}x${size} \
            -unsharp 0x1.5+1.0+0.05 \
            -quality 100 \
            "$output_file"
    
    echo "Generated: $output_file"
done

echo "All icons have been generated successfully!"
echo "You can now use these icons in your PWA manifest."
