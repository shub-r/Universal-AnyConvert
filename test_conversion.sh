#!/bin/bash

# Universal AnyConvert - Test Script
# This tests the conversion functionality without the full GUI

echo "=========================================="
echo "Universal AnyConvert - Conversion Test"
echo "=========================================="
echo ""

# Check dependencies
echo "📋 Checking dependencies..."

if ! command -v ffmpeg &> /dev/null; then
    echo "❌ FFmpeg not found. Please install: sudo apt install ffmpeg"
    exit 1
fi
echo "✅ FFmpeg found: $(ffmpeg -version | head -1)"

if ! command -v convert &> /dev/null; then
    echo "⚠️  ImageMagick (convert) not found. Image conversion may not work."
else
    echo "✅ ImageMagick found: $(convert --version | head -1)"
fi
echo ""

# Create test directory
TEST_DIR="$HOME/anyconvert_test"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

# Create test image (PNG)
echo "🖼️  Creating test PNG image..."
if [ ! -f "test_image.png" ]; then
    # Create a simple PNG using ImageMagick or fallback
    if command -v convert &> /dev/null; then
        convert -size 200x200 xc:blue -fill white -draw "circle 100,100 100,50" test_image.png
    elif command -v ffmpeg &> /dev/null; then
        # Create using FFmpeg
        ffmpeg -f lavfi -i "color=c=blue:s=200x200:d=1" -frames:v 1 test_image.png -y 2>/dev/null || \
        echo "blue" | base64 -d > test_image.png 2>/dev/null || \
        touch test_image.png
    fi
fi

# Create test audio
echo "🎵 Creating test audio file..."
if [ ! -f "test_audio.mp3" ]; then
    # Generate a simple tone
    if command -v ffmpeg &> /dev/null; then
        ffmpeg -f lavfi -i "sine=frequency=440:duration=2" -ac 2 test_audio.mp3 -y 2>/dev/null || touch test_audio.mp3
    else
        touch test_audio.mp3
    fi
fi

# Create test video
echo "🎬 Creating test video file..."
if [ ! -f "test_video.mp4" ]; then
    if command -v ffmpeg &> /dev/null; then
        ffmpeg -f lavfi -i "color=c=blue:s=320x240:d=2" -c:v libx264 -pix_fmt yuv420p test_video.mp4 -y 2>/dev/null || touch test_video.mp4
    else
        touch test_video.mp4
    fi
fi

echo ""
echo "📁 Test files created in: $TEST_DIR"
ls -la
echo ""

# Test conversions
echo "=========================================="
echo "🔄 Testing Conversions"
echo "=========================================="
echo ""

# Test 1: Image conversion (PNG -> JPG)
echo "Test 1: Converting PNG → JPG..."
if [ -f "test_image.png" ]; then
    if command -v convert &> /dev/null; then
        if convert test_image.png test_image_converted.jpg 2>/dev/null; then
            if [ -f "test_image_converted.jpg" ] && [ -s "test_image_converted.jpg" ]; then
                echo "✅ PNG → JPG conversion: SUCCESS"
                echo "   Output: test_image_converted.jpg ($(stat -c%s test_image_converted.jpg) bytes)"
            else
                echo "❌ PNG → JPG conversion: FAILED (empty file)"
            fi
        else
            echo "❌ PNG → JPG conversion: FAILED"
        fi
    else
        echo "⚠️  ImageMagick not available, skipping image test"
    fi
fi
echo ""

# Test 2: Image conversion (PNG -> WebP)
echo "Test 2: Converting PNG → WebP..."
if [ -f "test_image.png" ]; then
    if command -v convert &> /dev/null; then
        if convert test_image.png test_image_converted.webp 2>/dev/null; then
            if [ -f "test_image_converted.webp" ] && [ -s "test_image_converted.webp" ]; then
                echo "✅ PNG → WebP conversion: SUCCESS"
                echo "   Output: test_image_converted.webp ($(stat -c%s test_image_converted.webp) bytes)"
            else
                echo "❌ PNG → WebP conversion: FAILED"
            fi
        else
            echo "❌ PNG → WebP conversion: FAILED"
        fi
    fi
fi
echo ""

# Test 3: Video conversion (MP4 -> AVI)
echo "Test 3: Converting MP4 → AVI..."
if [ -f "test_video.mp4" ]; then
    if ffmpeg -i test_video.mp4 -c:v mpeg4 -c:a mp3 test_video_converted.avi -y 2>/dev/null; then
        if [ -f "test_video_converted.avi" ] && [ -s "test_video_converted.avi" ]; then
            echo "✅ MP4 → AVI conversion: SUCCESS"
            echo "   Output: test_video_converted.avi ($(stat -c%s test_video_converted.avi) bytes)"
        else
            echo "❌ MP4 → AVI conversion: FAILED"
        fi
    else
        echo "❌ MP4 → AVI conversion: FAILED"
    fi
fi
echo ""

# Test 4: Audio conversion (MP3 -> WAV)
echo "Test 4: Converting MP3 → WAV..."
if [ -f "test_audio.mp3" ]; then
    if ffmpeg -i test_audio.mp3 test_audio_converted.wav -y 2>/dev/null; then
        if [ -f "test_audio_converted.wav" ] && [ -s "test_audio_converted.wav" ]; then
            echo "✅ MP3 → WAV conversion: SUCCESS"
            echo "   Output: test_audio_converted.wav ($(stat -c%s test_audio_converted.wav) bytes)"
        else
            echo "❌ MP3 → WAV conversion: FAILED"
        fi
    else
        echo "❌ MP3 → WAV conversion: FAILED"
    fi
fi
echo ""

# Test 5: Video to GIF
echo "Test 5: Converting MP4 → GIF..."
if [ -f "test_video.mp4" ]; then
    if ffmpeg -i test_video.mp4 -vf "fps=10,scale=320:-1:flags=lanczos" test_video_converted.gif -y 2>/dev/null; then
        if [ -f "test_video_converted.gif" ] && [ -s "test_video_converted.gif" ]; then
            echo "✅ MP4 → GIF conversion: SUCCESS"
            echo "   Output: test_video_converted.gif ($(stat -c%s test_video_converted.gif) bytes)"
        else
            echo "❌ MP4 → GIF conversion: FAILED"
        fi
    else
        echo "❌ MP4 → GIF conversion: FAILED"
    fi
fi
echo ""

# Summary
echo "=========================================="
echo "📊 Test Summary"
echo "=========================================="
CONVERTED_COUNT=$(ls *_converted.* 2>/dev/null | wc -l)
echo "Converted files: $CONVERTED_COUNT"
echo ""
echo "Test directory: $TEST_DIR"
echo ""

# Verify file integrity
echo "🔍 Verifying converted files..."
for f in *_converted.*; do
    if [ -f "$f" ]; then
        SIZE=$(stat -c%s "$f")
        if [ "$SIZE" -gt 0 ]; then
            echo "✅ $f ($SIZE bytes) - OK"
        else
            echo "❌ $f - EMPTY OR CORRUPTED"
        fi
    fi
done
echo ""

echo "=========================================="
echo "✨ Test Complete!"
echo "=========================================="
echo ""
echo "If all tests passed, the conversion engine is working correctly."
echo "You can now build and run the full Universal AnyConvert application."
echo ""
echo "To build the app:"
echo "  cd ~/universal-anyconvert"
echo "  npm run tauri build"
