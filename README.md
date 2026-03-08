# Universal AnyConvert

<p align="center">
  <img src="https://raw.githubusercontent.com/shub-r/Universal-AnyConvert/main/icon.png" alt="Universal AnyConvert Logo" width="128" height="128"/>
</p>

<p align="center">
  A powerful, cross-platform file converter built with Tauri
  <br>
  <a href="https://github.com/shub-r/Universal-AnyConvert/releases/latest">
    <img src="https://img.shields.io/github/v/release/shub-r/Universal-AnyConvert?include_prereleases&style=flat" alt="GitHub release">
  </a>
  <a href="https://github.com/shub-r/Universal-AnyConvert/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/shub-r/Universal-AnyConvert" alt="License">
  </a>
</p>

---

## About

**Universal AnyConvert** is a fast, secure, and feature-rich file converter that works completely offline. Your files never leave your device.

Built with ❤️ using [Tauri](https://tauri.app/) (Rust + React)

---

## Features

### 🎯 Core Features
- **Batch Conversion** - Convert 50+ files at once
- **Merge to PDF** - Combine multiple images into a single PDF
- **Custom Output** - Choose where to save converted files
- **Format Detection** - Automatically shows available conversion formats

### 📁 Supported Formats

| Category | Formats |
|----------|---------|
| **Images** | JPG, PNG, WebP, GIF, BMP, TIFF, ICO, SVG → PDF |
| **PDF** | PDF → PDF/A, JPG, PNG, TXT, DOCX |
| **Video** | MP4, AVI, MKV, MOV, WEBM, GIF |
| **Audio** | MP3, WAV, FLAC, AAC, OGG, M4A |
| **Documents** | PDF, DOCX, TXT, HTML, MARKDOWN, RTF |
| **Spreadsheets** | XLSX, CSV, ODS, TSV |

### 🔒 Privacy First
- **100% Offline** - No internet required
- **Local Processing** - Files never leave your device
- **Open Source** - Transparent and verifiable

---

## Screenshots

### Main Interface
<p align="center">
  <img src="https://raw.githubusercontent.com/shub-r/Universal-AnyConvert/main/screenshots/main.png" alt="Main Interface" width="400"/>
</p>

### File Selection
<p align="center">
  <img src="https://raw.githubusercontent.com/shub-r/Universal-AnyConvert/main/screenshots/file-selection.png" alt="File Selection" width="400"/>
</p>

### Conversion Progress
<p align="center">
  <img src="https://raw.githubusercontent.com/shub-r/Universal-AnyConvert/main/screenshots/converting.png" alt="Converting" width="400"/>
</p>

---

## Installation

### Windows
- **MSI Installer**: Download from [Releases](https://github.com/shub-r/Universal-AnyConvert/releases)
- **Portable**: Use the `.exe` directly

### Linux
- **AppImage**: Run directly without installation
- **DEB Package**: For Debian/Ubuntu-based systems

### macOS
- **DMG Image**: Drag to Applications folder

---

## Development

### Prerequisites
- [Rust](https://rustup.rs/)
- [Node.js](https://nodejs.org/)
- [FFmpeg](https://ffmpeg.org/)
- [ImageMagick](https://imagemagick.org/)

### Build from Source

```bash
# Clone the repository
git clone https://github.com/shub-r/Universal-AnyConvert.git
cd Universal-AnyConvert

# Install dependencies
npm install

# Build
npm run tauri build
```

---

## Technologies Used

- **Frontend**: React + TypeScript + TailwindCSS
- **Backend**: Rust (Tauri)
- **Image Processing**: ImageMagick
- **Video/Audio Processing**: FFmpeg
- **PDF Processing**: Ghostscript, Poppler

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## Author

**shub-r** - [GitHub](https://github.com/shub-r)

---

<p align="center">
  Made with ❤️ for open source community
</p>
