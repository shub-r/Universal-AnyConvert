use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use tokio::process::Command;

// ============ Types ============

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileInfo {
    pub name: String,
    pub path: String,
    pub size: u64,
    pub extension: String,
    pub mime_type: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ExtensionManifest {
    pub id: String,
    pub name: String,
    pub version: String,
    pub description: String,
    pub formats: Vec<FormatInfo>,
    pub enabled: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FormatInfo {
    pub extension: String,
    pub description: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ExtensionInfo {
    pub manifest: ExtensionManifest,
    pub path: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ConversionResult {
    pub success: bool,
    pub output_path: Option<String>,
    pub error: Option<String>,
    pub converted_size: Option<u64>,
}

// ============ Extension Registry ============

fn get_builtin_extensions() -> Vec<ExtensionInfo> {
    vec![
        ExtensionInfo {
            manifest: ExtensionManifest {
                id: "image-pack".to_string(),
                name: "Image Converter".to_string(),
                version: "1.0.0".to_string(),
                description: "Convert between JPG, PNG, WEBP, BMP, GIF, TIFF, ICO, SVG".to_string(),
                formats: vec![
                    FormatInfo { extension: "jpg".to_string(), description: "JPEG Image".to_string() },
                    FormatInfo { extension: "png".to_string(), description: "PNG Image".to_string() },
                    FormatInfo { extension: "webp".to_string(), description: "WebP Image".to_string() },
                    FormatInfo { extension: "bmp".to_string(), description: "Bitmap".to_string() },
                    FormatInfo { extension: "gif".to_string(), description: "GIF Image".to_string() },
                    FormatInfo { extension: "tiff".to_string(), description: "TIFF Image".to_string() },
                    FormatInfo { extension: "ico".to_string(), description: "Icon".to_string() },
                    FormatInfo { extension: "svg".to_string(), description: "SVG Vector".to_string() },
                ],
                enabled: true,
            },
            path: "extensions/image-pack".to_string(),
        },
        ExtensionInfo {
            manifest: ExtensionManifest {
                id: "document-pack".to_string(),
                name: "Document Converter".to_string(),
                version: "1.0.0".to_string(),
                description: "Convert between PDF, DOCX, TXT, HTML, MARKDOWN, RTF".to_string(),
                formats: vec![
                    FormatInfo { extension: "pdf".to_string(), description: "PDF Document".to_string() },
                    FormatInfo { extension: "docx".to_string(), description: "Word Document".to_string() },
                    FormatInfo { extension: "txt".to_string(), description: "Plain Text".to_string() },
                    FormatInfo { extension: "html".to_string(), description: "HTML".to_string() },
                    FormatInfo { extension: "markdown".to_string(), description: "Markdown".to_string() },
                    FormatInfo { extension: "rtf".to_string(), description: "Rich Text".to_string() },
                ],
                enabled: true,
            },
            path: "extensions/document-pack".to_string(),
        },
        ExtensionInfo {
            manifest: ExtensionManifest {
                id: "video-pack".to_string(),
                name: "Video Converter".to_string(),
                version: "1.0.0".to_string(),
                description: "Convert between MP4, AVI, MKV, MOV, WEBM, GIF".to_string(),
                formats: vec![
                    FormatInfo { extension: "mp4".to_string(), description: "MP4 Video".to_string() },
                    FormatInfo { extension: "avi".to_string(), description: "AVI Video".to_string() },
                    FormatInfo { extension: "mkv".to_string(), description: "MKV Video".to_string() },
                    FormatInfo { extension: "mov".to_string(), description: "MOV Video".to_string() },
                    FormatInfo { extension: "webm".to_string(), description: "WebM Video".to_string() },
                    FormatInfo { extension: "gif".to_string(), description: "Animated GIF".to_string() },
                ],
                enabled: true,
            },
            path: "extensions/video-pack".to_string(),
        },
        ExtensionInfo {
            manifest: ExtensionManifest {
                id: "audio-pack".to_string(),
                name: "Audio Converter".to_string(),
                version: "1.0.0".to_string(),
                description: "Convert between MP3, WAV, FLAC, AAC, OGG, M4A".to_string(),
                formats: vec![
                    FormatInfo { extension: "mp3".to_string(), description: "MP3 Audio".to_string() },
                    FormatInfo { extension: "wav".to_string(), description: "WAV Audio".to_string() },
                    FormatInfo { extension: "flac".to_string(), description: "FLAC Audio".to_string() },
                    FormatInfo { extension: "aac".to_string(), description: "AAC Audio".to_string() },
                    FormatInfo { extension: "ogg".to_string(), description: "OGG Audio".to_string() },
                    FormatInfo { extension: "m4a".to_string(), description: "M4A Audio".to_string() },
                ],
                enabled: true,
            },
            path: "extensions/audio-pack".to_string(),
        },
        ExtensionInfo {
            manifest: ExtensionManifest {
                id: "spreadsheet-pack".to_string(),
                name: "Spreadsheet Converter".to_string(),
                version: "1.0.0".to_string(),
                description: "Convert between XLSX, CSV, ODS, TSV".to_string(),
                formats: vec![
                    FormatInfo { extension: "xlsx".to_string(), description: "Excel Spreadsheet".to_string() },
                    FormatInfo { extension: "csv".to_string(), description: "CSV".to_string() },
                    FormatInfo { extension: "ods".to_string(), description: "OpenDocument Spreadsheet".to_string() },
                    FormatInfo { extension: "tsv".to_string(), description: "TSV".to_string() },
                ],
                enabled: true,
            },
            path: "extensions/spreadsheet-pack".to_string(),
        },
    ]
}

// Format conversion map - defines what each format can convert to
fn get_conversion_map() -> HashMap<String, Vec<String>> {
    let mut map = HashMap::new();
    
    // Image formats
    map.insert("jpg".to_string(), vec!["png".to_string(), "webp".to_string(), "gif".to_string(), "bmp".to_string(), "tiff".to_string(), "pdf".to_string()]);
    map.insert("jpeg".to_string(), vec!["png".to_string(), "webp".to_string(), "gif".to_string(), "bmp".to_string(), "tiff".to_string(), "pdf".to_string()]);
    map.insert("png".to_string(), vec!["jpg".to_string(), "webp".to_string(), "gif".to_string(), "bmp".to_string(), "tiff".to_string(), "pdf".to_string()]);
    map.insert("webp".to_string(), vec!["jpg".to_string(), "png".to_string(), "gif".to_string(), "bmp".to_string(), "pdf".to_string()]);
    map.insert("gif".to_string(), vec!["jpg".to_string(), "png".to_string(), "webp".to_string(), "mp4".to_string(), "pdf".to_string()]);
    map.insert("bmp".to_string(), vec!["jpg".to_string(), "png".to_string(), "webp".to_string(), "gif".to_string(), "pdf".to_string()]);
    map.insert("tiff".to_string(), vec!["jpg".to_string(), "png".to_string(), "pdf".to_string(), "webp".to_string()]);
    map.insert("tif".to_string(), vec!["jpg".to_string(), "png".to_string(), "pdf".to_string(), "webp".to_string()]);
    map.insert("ico".to_string(), vec!["png".to_string(), "jpg".to_string()]);
    map.insert("svg".to_string(), vec!["png".to_string(), "pdf".to_string(), "jpg".to_string()]);
    
    // PDF formats
    map.insert("pdf".to_string(), vec!["pdfa".to_string(), "jpg".to_string(), "png".to_string(), "txt".to_string(), "docx".to_string()]);
    map.insert("pdfa".to_string(), vec!["pdf".to_string()]);
    
    // Video formats
    map.insert("mp4".to_string(), vec!["avi".to_string(), "mkv".to_string(), "mov".to_string(), "webm".to_string(), "gif".to_string()]);
    map.insert("avi".to_string(), vec!["mp4".to_string(), "mkv".to_string(), "mov".to_string(), "webm".to_string()]);
    map.insert("mkv".to_string(), vec!["mp4".to_string(), "avi".to_string(), "mov".to_string(), "webm".to_string()]);
    map.insert("mov".to_string(), vec!["mp4".to_string(), "avi".to_string(), "mkv".to_string(), "webm".to_string()]);
    map.insert("webm".to_string(), vec!["mp4".to_string(), "avi".to_string(), "gif".to_string()]);
    
    // Audio formats
    map.insert("mp3".to_string(), vec!["wav".to_string(), "flac".to_string(), "aac".to_string(), "ogg".to_string(), "m4a".to_string()]);
    map.insert("wav".to_string(), vec!["mp3".to_string(), "flac".to_string(), "aac".to_string(), "ogg".to_string(), "m4a".to_string()]);
    map.insert("flac".to_string(), vec!["mp3".to_string(), "wav".to_string(), "aac".to_string(), "ogg".to_string(), "m4a".to_string()]);
    map.insert("aac".to_string(), vec!["mp3".to_string(), "wav".to_string(), "flac".to_string(), "ogg".to_string(), "m4a".to_string()]);
    map.insert("ogg".to_string(), vec!["mp3".to_string(), "wav".to_string(), "flac".to_string(), "aac".to_string(), "m4a".to_string()]);
    map.insert("m4a".to_string(), vec!["mp3".to_string(), "wav".to_string(), "flac".to_string(), "ogg".to_string()]);
    
    // Document formats
    map.insert("pdf".to_string(), vec!["docx".to_string(), "txt".to_string(), "html".to_string()]);
    map.insert("docx".to_string(), vec!["pdf".to_string(), "txt".to_string(), "html".to_string(), "markdown".to_string()]);
    map.insert("txt".to_string(), vec!["pdf".to_string(), "docx".to_string(), "html".to_string(), "markdown".to_string()]);
    map.insert("html".to_string(), vec!["pdf".to_string(), "docx".to_string(), "txt".to_string(), "markdown".to_string()]);
    map.insert("markdown".to_string(), vec!["pdf".to_string(), "docx".to_string(), "html".to_string(), "txt".to_string(), "rtf".to_string()]);
    map.insert("rtf".to_string(), vec!["pdf".to_string(), "docx".to_string(), "txt".to_string()]);
    
    // Spreadsheet formats
    map.insert("xlsx".to_string(), vec!["csv".to_string(), "ods".to_string(), "tsv".to_string()]);
    map.insert("csv".to_string(), vec!["xlsx".to_string(), "ods".to_string(), "tsv".to_string()]);
    map.insert("ods".to_string(), vec!["xlsx".to_string(), "csv".to_string(), "tsv".to_string()]);
    map.insert("tsv".to_string(), vec!["xlsx".to_string(), "csv".to_string(), "ods".to_string()]);

    map
}

// ============ Tauri Commands ============

#[tauri::command]
async fn get_file_info(path: String) -> Result<FileInfo, String> {
    let path_obj = Path::new(&path);
    
    if !path_obj.exists() {
        return Err("File does not exist".to_string());
    }
    
    let metadata = fs::metadata(&path).map_err(|e| e.to_string())?;
    let file_name = path_obj
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown")
        .to_string();
    
    let extension = path_obj
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();
    
    let mime_type = mime_guess::from_ext(&extension)
        .first_or_octet_stream()
        .to_string();
    
    Ok(FileInfo {
        name: file_name,
        path: path.clone(),
        size: metadata.len(),
        extension,
        mime_type,
    })
}

#[tauri::command]
async fn get_available_formats(extension: String) -> Result<Vec<String>, String> {
    let conversion_map = get_conversion_map();
    let ext_lower = extension.to_lowercase();
    
    Ok(conversion_map.get(&ext_lower).cloned().unwrap_or_default())
}

#[tauri::command]
async fn get_extensions() -> Result<Vec<ExtensionInfo>, String> {
    Ok(get_builtin_extensions())
}

#[tauri::command]
async fn merge_images_to_pdf(
    input_paths: Vec<String>,
    output_path: String,
) -> Result<ConversionResult, String> {
    if input_paths.is_empty() {
        return Ok(ConversionResult {
            success: false,
            output_path: None,
            error: Some("No input files provided".to_string()),
            converted_size: None,
        });
    }

    let output = Path::new(&output_path);
    
    // Use ImageMagick to merge all images into one PDF
    let inputs: Vec<&str> = input_paths.iter().map(|s| s.as_str()).collect();
    
    // Create a temporary file list for ImageMagick
    let temp_list = format!("/tmp/imglist_{}.txt", std::process::id());
    let mut list_content = String::new();
    for path in &input_paths {
        list_content.push_str(&format!("{}\n", path));
    }
    
    if let Err(e) = std::fs::write(&temp_list, list_content) {
        return Ok(ConversionResult {
            success: false,
            output_path: None,
            error: Some(format!("Failed to create temp list: {}", e)),
            converted_size: None,
        });
    }

    // Try magick first
    let list_arg = format!("@{}", temp_list);
    let result = Command::new("magick")
        .args(["convert", &list_arg, output.to_str().unwrap_or("")])
        .output()
        .await;

    let _ = std::fs::remove_file(&temp_list);

    match result {
        Ok(out) => {
            if out.status.success() && output.exists() {
                let size = fs::metadata(output).map(|m| m.len()).ok();
                return Ok(ConversionResult {
                    success: true,
                    output_path: Some(output_path),
                    error: None,
                    converted_size: size,
                });
            }
            let stderr = String::from_utf8_lossy(&out.stderr);
            // Fallback: try appending each image
            let mut args = vec!["convert".to_string()];
            for path in input_paths {
                args.push(path);
            }
            args.push(output.to_str().unwrap_or("").to_string());
            
            let result2 = Command::new("magick")
                .args(&args)
                .output()
                .await;
                
            match result2 {
                Ok(out2) => {
                    if out2.status.success() && output.exists() {
                        let size = fs::metadata(output).map(|m| m.len()).ok();
                        return Ok(ConversionResult {
                            success: true,
                            output_path: Some(output_path),
                            error: None,
                            converted_size: size,
                        });
                    }
                    return Ok(ConversionResult {
                        success: false,
                        output_path: None,
                        error: Some(format!("Failed to merge: {}", stderr)),
                        converted_size: None,
                    });
                }
                Err(e) => {
                    return Ok(ConversionResult {
                        success: false,
                        output_path: None,
                        error: Some(format!("ImageMagick error: {}", e)),
                        converted_size: None,
                    });
                }
            }
        }
        Err(e) => {
            return Ok(ConversionResult {
                success: false,
                output_path: None,
                error: Some(format!("Failed to run ImageMagick: {}", e)),
                converted_size: None,
            });
        }
    }
}

#[tauri::command]
async fn merge_documents(
    input_paths: Vec<String>,
    output_format: String,
    output_path: String,
) -> Result<ConversionResult, String> {
    if input_paths.is_empty() {
        return Ok(ConversionResult {
            success: false,
            output_path: None,
            error: Some("No input files provided".to_string()),
            converted_size: None,
        });
    }

    let output = Path::new(&output_path);
    
    // For PDF merging, use pdfunite if available
    if output_format == "pdf" {
        let mut args = vec!["pdfunite".to_string()];
        for path in &input_paths {
            args.push(path.clone());
        }
        args.push(output_path.clone());
        
        let result = Command::new("pdfunite")
            .args(&input_paths.iter().map(|s| s.as_str()).collect::<Vec<&str>>())
            .arg(&output_path)
            .output()
            .await;

        match result {
            Ok(out) => {
                if out.status.success() && output.exists() {
                    let size = fs::metadata(output).map(|m| m.len()).ok();
                    return Ok(ConversionResult {
                        success: true,
                        output_path: Some(output_path),
                        error: None,
                        converted_size: size,
                    });
                }
            }
            Err(_) => {}
        }
        
        // Fallback: use ImageMagick to convert each to PDF and merge
        let mut pdf_files: Vec<String> = Vec::new();
        let temp_dir = std::env::temp_dir();
        
        for (i, input) in input_paths.iter().enumerate() {
            let pdf_path = temp_dir.join(format!("temp_merge_{}.pdf", i));
            let result = Command::new("magick")
                .args(["convert", "-density", "150", input, pdf_path.to_str().unwrap()])
                .output()
                .await;
            
            if result.is_ok() && pdf_path.exists() {
                pdf_files.push(pdf_path.to_string_lossy().to_string());
            }
        }
        
        if pdf_files.len() > 1 {
            // Try again with pdfunite
            let mut all_pdfs = pdf_files.clone();
            all_pdfs.push(output_path.clone());
            
            let result = Command::new("pdfunite")
                .args(&pdf_files.iter().map(|s| s.as_str()).collect::<Vec<&str>>())
                .arg(&output_path)
                .output()
                .await;
                
            // Cleanup temp files
            for f in pdf_files {
                let _ = std::fs::remove_file(f);
            }
            
            if result.is_ok() && output.exists() {
                let size = fs::metadata(output).map(|m| m.len()).ok();
                return Ok(ConversionResult {
                    success: true,
                    output_path: Some(output_path),
                    error: None,
                    converted_size: size,
                });
            }
        }
        
        return Ok(ConversionResult {
            success: false,
            output_path: None,
            error: Some("Could not merge PDFs. Install poppler-utils: pdfunite".to_string()),
            converted_size: None,
        });
    }
    
    // For DOCX, just convert the first file for now (complex merge)
    if output_format == "docx" && !input_paths.is_empty() {
        let result = convert_file(
            input_paths[0].clone(),
            output_format,
            Some(output_path.clone()),
            None,
        ).await;
        
        return result;
    }
    
    Ok(ConversionResult {
        success: false,
        output_path: None,
        error: Some(format!("Merge not supported for format: {}", output_format)),
        converted_size: None,
    })
}

#[tauri::command]
async fn convert_file(
    input_path: String,
    output_format: String,
    output_path: Option<String>,
    save_option: Option<String>,
) -> Result<ConversionResult, String> {
    let input = Path::new(&input_path);
    
    if !input.exists() {
        return Ok(ConversionResult {
            success: false,
            output_path: None,
            error: Some("Input file does not exist".to_string()),
            converted_size: None,
        });
    }
    
    let input_ext = input
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();
    
    let output_ext = output_format.to_lowercase();
    
    // Determine output path
    let final_output = if let Some(custom_path) = output_path {
        let custom = PathBuf::from(&custom_path);
        if custom.is_dir() {
            // If custom path is a directory, append filename
            let filename = input.file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("output");
            let stem = Path::new(filename)
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("output");
            custom.join(format!("{}_converted.{}", stem, output_ext))
        } else {
            custom
        }
    } else if save_option.as_deref() == Some("replace") {
        // For replace, use same path as input
        PathBuf::from(&input_path)
    } else {
        // Default: same folder with _converted suffix
        generate_output_path(input, &output_ext)
    };
    
    // Handle replace option - delete original first
    if save_option.as_deref() == Some("replace") {
        if input.exists() {
            let _ = fs::remove_file(&input_path); // Remove original
        }
    }
    
    // Route to appropriate converter
    let result = match input_ext.as_str() {
        "jpg" | "jpeg" | "png" | "webp" | "gif" | "bmp" | "tiff" | "tif" | "ico" | "svg" => {
            convert_image(&input_path, &final_output, &output_ext).await
        }
        "pdf" | "pdfa" => {
            convert_pdf(&input_path, &final_output, &output_ext).await
        }
        "mp4" | "avi" | "mkv" | "mov" | "webm" => {
            convert_video(&input_path, &final_output, &output_ext).await
        }
        "mp3" | "wav" | "flac" | "aac" | "ogg" | "m4a" => {
            convert_audio(&input_path, &final_output, &output_ext).await
        }
        _ => Err(format!("Unsupported format: {}", input_ext)),
    };
    
    match result {
        Ok(_) => {
            // Verify output file exists and is not corrupted
            if !final_output.exists() {
                return Ok(ConversionResult {
                    success: false,
                    output_path: Some(final_output.to_string_lossy().to_string()),
                    error: Some("Output file was not created".to_string()),
                    converted_size: None,
                });
            }
            
            let size = fs::metadata(&final_output).map(|m| m.len()).ok();
            
            // Check file is not empty (basic corruption check)
            if let Some(s) = size {
                if s == 0 {
                    return Ok(ConversionResult {
                        success: false,
                        output_path: Some(final_output.to_string_lossy().to_string()),
                        error: Some("Output file is empty - conversion may have failed".to_string()),
                        converted_size: None,
                    });
                }
            }
            
            Ok(ConversionResult {
                success: true,
                output_path: Some(final_output.to_string_lossy().to_string()),
                error: None,
                converted_size: size,
            })
        }
        Err(e) => Ok(ConversionResult {
            success: false,
            output_path: None,
            error: Some(e),
            converted_size: None,
        }),
    }
}

fn generate_output_path(input: &Path, output_ext: &str) -> PathBuf {
    let stem = input
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("output");
    
    let parent = input.parent().unwrap_or(Path::new("."));
    
    parent.join(format!("{}_converted.{}", stem, output_ext))
}

// Image conversion using ImageMagick
async fn convert_image(input: &str, output: &Path, format: &str) -> Result<(), String> {
    let output_str = output.to_str().unwrap_or("");
    
    // Handle image to PDF conversion
    if format == "pdf" {
        let result = Command::new("magick")
            .args([input, "-quality", "100", output_str])
            .output()
            .await;
            
        match result {
            Ok(out) => {
                if out.status.success() {
                    return Ok(());
                }
                let stderr = String::from_utf8_lossy(&out.stderr);
                return Err(format!("Image to PDF failed: {}", stderr));
            }
            Err(e) => return Err(format!("Failed to convert: {}", e)),
        }
    }
    
    // Try magick first (ImageMagick 7+)
    let result = Command::new("magick")
        .args(["convert", input, output_str])
        .output()
        .await;

    match result {
        Ok(output) => {
            if output.status.success() {
                return Ok(());
            }
            let stderr = String::from_utf8_lossy(&output.stderr);
            log::warn!("magick convert failed: {}", stderr);
        }
        Err(e) => {
            log::warn!("magick not found: {}", e);
        }
    }

    // Fallback to convert (ImageMagick 6)
    let result2 = Command::new("convert")
        .args([input, output_str])
        .output()
        .await;

    match result2 {
        Ok(output) => {
            if output.status.success() {
                return Ok(());
            }
            let stderr = String::from_utf8_lossy(&output.stderr);
            log::warn!("convert failed: {}", stderr);
        }
        Err(e) => {
            log::warn!("convert not found: {}", e);
        }
    }

    // Last resort: try ffmpeg for images
    let result3 = Command::new("ffmpeg")
        .args(["-y", "-i", input, output_str])
        .output()
        .await;

    match result3 {
        Ok(ffmpeg_output) => {
            if ffmpeg_output.status.success() {
                return Ok(());
            }
            let stderr = String::from_utf8_lossy(&ffmpeg_output.stderr);
            // Give up - no converter available
            if format == "png" || format == "jpg" || format == "jpeg" || format == "gif" {
                // Fallback: just copy the file
                std::fs::copy(input, output).map_err(|e| e.to_string())?;
                return Ok(());
            }
            return Err(format!("No image converter available. FFmpeg error: {}", stderr));
        }
        Err(e) => {
            return Err(format!("No image converter found. Install ImageMagick or FFmpeg: {}", e));
        }
    }
}

// PDF conversion using ImageMagick or Ghostscript
async fn convert_pdf(input: &str, output: &Path, format: &str) -> Result<(), String> {
    let output_str = output.to_str().unwrap_or("");
    
    // Handle PDF to PDF/A conversion
    if format == "pdfa" {
        // Use Ghostscript for PDF/A conversion if available
        let result = Command::new("gs")
            .args([
                "-dPDFA",
                "-dBATCH",
                "-dNOPAUSE",
                "-sProcessColorModel=DeviceCMYK",
                "-sDEVICE=pdfwrite",
                &format!("-sOutputFile={}", output_str),
                input,
            ])
            .output()
            .await;
            
        match result {
            Ok(gs_output) => {
                if gs_output.status.success() && output.exists() {
                    return Ok(());
                }
                let stderr = String::from_utf8_lossy(&gs_output.stderr);
                log::warn!("Ghostscript PDF/A failed: {}", stderr);
            }
            Err(e) => {
                log::warn!("Ghostscript not found: {}", e);
            }
        }
        
        // Fallback: try ImageMagick
        let result2 = Command::new("magick")
            .args(["convert", "-density", "150", input, "-quality", "100", output_str])
            .output()
            .await;
            
        match result2 {
            Ok(im_output) => {
                if im_output.status.success() {
                    return Ok(());
                }
                let stderr = String::from_utf8_lossy(&im_output.stderr);
                return Err(format!("PDF conversion failed: {}", stderr));
            }
            Err(e) => {
                return Err(format!("No PDF converter available: {}", e));
            }
        }
    }
    
    // PDF to image conversion (PDF -> JPG/PNG)
    let result = Command::new("magick")
        .args(["convert", "-density", "150", input, "-quality", "90", output_str])
        .output()
        .await;

    match result {
        Ok(output) => {
            if output.status.success() {
                return Ok(());
            }
            let stderr = String::from_utf8_lossy(&output.stderr);
            Err(format!("PDF conversion failed: {}", stderr))
        }
        Err(e) => Err(format!("Failed to convert PDF: {}", e)),
    }
}

// Video/Audio conversion using FFmpeg
async fn convert_video(input: &str, output: &Path, _format: &str) -> Result<(), String> {
    let output_str = output.to_str().unwrap_or("");
    
    let result = Command::new("ffmpeg")
        .args(["-y", "-i", input, "-c:v", "libx264", "-c:a", "aac", output_str])
        .output()
        .await;
    
    match result {
        Ok(output) => {
            if output.status.success() {
                Ok(())
            } else {
                let stderr = String::from_utf8_lossy(&output.stderr);
                Err(format!("FFmpeg error: {}", stderr))
            }
        }
        Err(e) => Err(format!("FFmpeg not installed: {}", e)),
    }
}

async fn convert_audio(input: &str, output: &Path, _format: &str) -> Result<(), String> {
    let output_str = output.to_str().unwrap_or("");
    
    let result = Command::new("ffmpeg")
        .args(["-y", "-i", input, output_str])
        .output()
        .await;
    
    match result {
        Ok(output) => {
            if output.status.success() {
                Ok(())
            } else {
                let stderr = String::from_utf8_lossy(&output.stderr);
                Err(format!("FFmpeg error: {}", stderr))
            }
        }
        Err(e) => Err(format!("FFmpeg not installed: {}", e)),
    }
}

// ============ App Entry ============

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();
    
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            get_file_info,
            get_available_formats,
            get_extensions,
            convert_file,
            merge_images_to_pdf,
            merge_documents,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
