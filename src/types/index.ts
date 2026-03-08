export interface FileInfo {
  name: string;
  path: string;
  size: number;
  extension: string;
  mimeType: string;
}

export interface ConversionResult {
  success: boolean;
  outputPath?: string;
  error?: string;
  originalSize: number;
  convertedSize?: number;
}

export interface ConversionJob {
  id: string;
  file: FileInfo;
  targetFormat: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: ConversionResult;
}

export interface ExtensionFormat {
  extension: string;
  description: string;
}

export interface ExtensionManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  icon: string;
  formats: ExtensionFormat[];
  converter: {
    type: 'imagemagick' | 'ffmpeg' | 'pandoc' | 'libreoffice' | 'custom';
    command: string;
  };
  enabled: boolean;
}

export interface Extension {
  manifest: ExtensionManifest;
  path: string;
  installed: boolean;
}

export interface HistoryItem {
  id: string;
  fileName: string;
  originalFormat: string;
  targetFormat: string;
  originalSize: number;
  convertedSize?: number;
  outputPath: string;
  timestamp: number;
  status: 'success' | 'failed';
  error?: string;
}
