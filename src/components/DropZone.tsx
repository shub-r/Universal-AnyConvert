import { useState, useCallback } from 'react';
import { useAppStore } from '../stores/appStore';
import { invoke } from '@tauri-apps/api/core';

export function DropZone() {
  const { setDroppedFile, setAvailableFormats } = useAppStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const processFile = useCallback(async (filePath: string) => {
    setIsLoading(true);
    try {
      const fileInfo = await invoke<{
        name: string;
        path: string;
        size: number;
        extension: string;
        mime_type: string;
      }>('get_file_info', { path: filePath });

      setDroppedFile({
        name: fileInfo.name,
        path: fileInfo.path,
        size: fileInfo.size,
        extension: fileInfo.extension,
        mimeType: fileInfo.mime_type,
      });

      const formats = await invoke<string[]>('get_available_formats', { 
        extension: fileInfo.extension 
      });
      setAvailableFormats(formats);
    } catch (err) {
      console.error('Error processing file:', err);
    } finally {
      setIsLoading(false);
    }
  }, [setDroppedFile, setAvailableFormats]);

  const handleClick = useCallback(async () => {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({
        multiple: false,
        directory: false,
      });
      if (selected && typeof selected === 'string') {
        await processFile(selected);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  }, [processFile]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 bg-[#F0F0F0]">
      {/* Main drop zone - Rufus style */}
      <div 
        onClick={handleClick}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={async (e) => {
          e.preventDefault();
          setIsDragging(false);
          const files = Array.from(e.dataTransfer.files);
          if (files.length > 0) {
            const filePath = (files[0] as File & { path?: string }).path;
            if (filePath) await processFile(filePath);
          }
        }}
        className={`
          w-full h-48 border-2 border-dashed flex flex-col items-center justify-center cursor-pointer
          transition-all duration-150 bg-white
          ${isDragging ? 'border-[#0078D4] bg-blue-50' : 'border-[#A0A0A0] hover:border-[#0078D4]'}
        `}
      >
        {isLoading ? (
          <>
            <div className="w-8 h-8 border-2 border-[#0078D4] border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-sm text-[#5C5C5C]">Processing...</p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 mb-2 flex items-center justify-center">
              <svg className="w-10 h-10 text-[#5C5C5C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-sm font-medium text-[#1A1A1A]">
              {isDragging ? 'Drop file here' : 'Click to select file'}
            </p>
            <p className="text-xs text-[#5C5C5C] mt-1">or drag and drop</p>
          </>
        )}
      </div>
    </div>
  );
}
