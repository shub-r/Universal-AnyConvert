# Universal AnyConvert - Specification

## Project Overview

**Project Name:** Universal AnyConvert  
**Type:** Cross-platform Desktop Application  
**Core Functionality:** A universal file converter supporting images, documents, videos, audio, and spreadsheets with an extensible plugin architecture.  
**Target Users:** General users needing offline file conversion without technical knowledge.

---

## Tech Stack

- **Framework:** Tauri 2.x (Rust backend + React frontend)
- **Image Conversion:** ImageMagick (via Rust bindings)
- **Video/Audio Conversion:** FFmpeg (via Rust command execution)
- **Document Conversion:** Pandoc
- **Office Files:** LibreOffice headless
- **UI:** React + TypeScript + TailwindCSS
- **State Management:** Zustand

---

## UI/UX Specification

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  Top Bar: Logo | Tab: Convert | Extensions | History   │
│          Settings (gear) | About (?)                    │
├──────────┬──────────────────────────────────────────────┤
│          │                                              │
│ Sidebar  │              Main Content Area              │
│ (Extens- │                                              │
│  ions)   │     ┌────────────────────────────┐          │
│          │     │                            │          │
│          │     │    Drag & Drop Zone        │          │
│          │     │                            │          │
│          │     └────────────────────────────┘          │
│          │                                              │
└──────────┴──────────────────────────────────────────────┘
```

### Visual Design

**Color Palette:**
- Background Primary: `#0F0F0F` (near black)
- Background Secondary: `#1A1A1A` (dark gray)
- Background Tertiary: `#252525` (lighter gray)
- Accent Primary: `#6366F1` (indigo)
- Accent Hover: `#818CF8` (light indigo)
- Success: `#22C55E` (green)
- Error: `#EF4444` (red)
- Warning: `#F59E0B` (amber)
- Text Primary: `#FFFFFF` (white)
- Text Secondary: `#A1A1AA` (gray)
- Border: `#2D2D2D` (dark border)

**Typography:**
- Font Family: `Inter, system-ui, sans-serif`
- Heading Large: 24px, font-weight 700
- Heading Medium: 18px, font-weight 600
- Body: 14px, font-weight 400
- Small/Caption: 12px, font-weight 400

**Spacing:**
- Base unit: 4px
- Padding small: 8px
- Padding medium: 16px
- Padding large: 24px
- Border radius: 8px (cards), 12px (buttons), 16px (main drop zone)

**Visual Effects:**
- Drop zone border: 2px dashed `#6366F1` (idle), solid (hover/active)
- Cards: subtle shadow `0 4px 6px rgba(0,0,0,0.3)`
- Transitions: 150ms ease for hover states
- Progress bar: gradient from `#6366F1` to `#818CF8`

### Components

1. **Top Bar**
   - Logo + App name (left)
   - Tab buttons: Convert, Extensions, History (center)
   - Settings icon, About icon (right)

2. **Sidebar** (Extensions)
   - List of installed extension packs
   - Toggle to enable/disable each
   - Install new button

3. **Drag & Drop Zone**
   - Large centered area (min 300x300)
   - Dashed border, icon in center
   - Text: "Drop files here or click to browse"
   - States: idle, hover (border highlight), active (file over)

4. **File Info Card** (after drop)
   - File name
   - File size (original)
   - Detected format
   - "Convert to" dropdown
   - Output format options
   - Estimated output size
   - Convert button

5. **Progress Indicator**
   - Progress bar with percentage
   - Current operation text
   - Cancel button

6. **Conversion History**
   - List of past conversions
   - File name, format, date, status
   - "Open folder" button

---

## Functionality Specification

### Core Features

1. **Drag & Drop File Input**
   - Accept single file via drag or file picker
   - Validate file exists and is readable
   - Detect file type by extension and magic bytes

2. **Format Detection**
   - Scan file extension
   - Check magic bytes for confirmation
   - Query available extensions for compatible outputs

3. **Conversion Options**
   - Display all possible output formats
   - Show quality/size estimate
   - Allow custom output filename

4. **Conversion Process**
   - Show real-time progress
   - Execute conversion via backend
   - Handle errors with user-friendly messages

5. **Output Management**
   - Save to same folder as source (default)
   - Allow custom output path
   - Show before/after file sizes

### Extension System

**Extension Structure:**
```
extensions/
├── image-pack/
│   ├── manifest.json
│   ├── converter.js (or rust binary)
│   └── icon.png
├── video-pack/
│   ├── manifest.json
│   └── converter
└── ...
```

**manifest.json Schema:**
```json
{
  "id": "image-pack",
  "name": "Image Converter",
  "version": "1.0.0",
  "description": "Convert between image formats",
  "icon": "icon.png",
  "formats": ["jpg", "png", "webp", "bmp", "gif", "tiff", "ico", "svg"],
  "converter": {
    "type": "imagemagick",
    "command": "convert {input} {output}"
  }
}
```

**Built-in Extensions:**
- 📷 Image Pack: JPG, PNG, WEBP, BMP, GIF, TIFF, ICO, SVG
- 📄 Document Pack: PDF, DOCX, TXT, HTML, MARKDOWN, RTF
- 🎬 Video Pack: MP4, AVI, MKV, MOV, WEBM, GIF
- 🎵 Audio Pack: MP3, WAV, FLAC, AAC, OGG, M4A
- 📊 Spreadsheet Pack: XLSX, CSV, ODS, TSV

### User Flows

1. **Basic Conversion:**
   - User drags file → App detects format
   - App shows available output formats
   - User selects format → clicks Convert
   - Progress bar shows → Complete
   - File saved, shown in history

2. **Extension Management:**
   - User clicks Extensions tab
   - Sees installed packs with toggles
   - Clicks "Browse Marketplace" → sees available
   - Clicks Install → downloads and enables

---

## Acceptance Criteria

1. ✅ App launches without errors on Linux
2. ✅ Drag & drop zone accepts files and shows file info
3. ✅ Format detection works for common image types
4. ✅ Image conversion works (test: PNG ↔ JPG)
5. ✅ Progress bar shows during conversion
6. ✅ Converted file is saved in correct location
7. ✅ Error messages are user-friendly
8. ✅ Extension system loads built-in packs
9. ✅ History tab shows past conversions
10. ✅ Dark theme renders correctly

---

## File Structure

```
universal-anyconvert/
├── src/                    # React frontend
│   ├── components/
│   │   ├── TopBar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── DropZone.tsx
│   │   ├── FileCard.tsx
│   │   ├── ProgressBar.tsx
│   │   └── HistoryList.tsx
│   ├── hooks/
│   ├── stores/
│   ├── types/
│   ├── App.tsx
│   └── main.tsx
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── main.rs
│   │   ├── commands.rs
│   │   ├── converter.rs
│   │   └── extensions.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── extensions/            # Built-in converters
│   ├── image-pack/
│   ├── document-pack/
│   ├── video-pack/
│   ├── audio-pack/
│   └── spreadsheet-pack/
├── SPEC.md
└── README.md
```
