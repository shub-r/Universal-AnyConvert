import { useState } from 'react';
import { useAppStore } from './stores/appStore';
import { invoke } from '@tauri-apps/api/core';
import { HistoryItem, FileInfo } from './types';

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function App() {
  const { 
    addHistoryItem,
    setActiveTab,
  } = useAppStore();
  
  const [selectedFiles, setSelectedFiles] = useState<FileInfo[]>([]);
  const [availableFormats, setAvailableFormats] = useState<string[]>([]);
  const [selectedFormat, setSelectedFormat] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [status, setStatus] = useState('Ready - Select files to convert');
  const [saveOption, setSaveOption] = useState<'copy' | 'replace' | 'custom'>('copy');
  const [customOutputPath, setCustomOutputPath] = useState('');
  const [outputFilename, setOutputFilename] = useState('');
  const [showResult, setShowResult] = useState<{success: number; failed: number; outputs: string[]} | null>(null);

  // Calculate output path based on current settings
  const getOutputPath = (): string => {
    if (selectedFiles.length === 0) return '';
    
    const firstFile = selectedFiles[0];
    const basePath = saveOption === 'custom' && customOutputPath 
      ? customOutputPath 
      : firstFile.path.substring(0, firstFile.path.lastIndexOf('/'));
    
    const filename = outputFilename || `converted_${Date.now()}`;
    return `${basePath}/${filename}.${selectedFormat}`;
  };

  const handleSelectFiles = async () => {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({ 
        multiple: true, 
        directory: false,
      });
      
      if (selected) {
        const paths = Array.isArray(selected) ? selected : [selected];
        setStatus(`Loading ${paths.length} file(s)...`);
        
        const filesInfo: FileInfo[] = [];
        let commonFormats: string[] = [];
        
        for (const path of paths) {
          try {
            const fileInfo = await invoke<{
              name: string;
              path: string;
              size: number;
              extension: string;
              mime_type: string;
            }>('get_file_info', { path });
            
            filesInfo.push({
              name: fileInfo.name,
              path: fileInfo.path,
              size: fileInfo.size,
              extension: fileInfo.extension,
              mimeType: fileInfo.mime_type,
            });
            
            const formats = await invoke<string[]>('get_available_formats', { 
              extension: fileInfo.extension 
            });
            
            if (commonFormats.length === 0) {
              commonFormats = formats;
            } else {
              commonFormats = commonFormats.filter(f => formats.includes(f));
            }
          } catch (err) {
            console.error('Error loading file:', path, err);
          }
        }
        
        setSelectedFiles(filesInfo);
        setAvailableFormats(commonFormats);
        setSelectedFormat('');
        setOutputFilename(`combined_${filesInfo.length}_files`);
        setStatus(`Loaded ${filesInfo.length} file(s) - Select output format`);
        setShowResult(null);
      }
    } catch (err) {
      console.error('Error:', err);
      setStatus('Error selecting files');
    }
  };

  const handleClearFiles = () => {
    setSelectedFiles([]);
    setSelectedFormat('');
    setAvailableFormats([]);
    setOutputFilename('');
    setShowResult(null);
    setStatus('Ready - Select files to convert');
  };

  const handleSelectOutputFolder = async () => {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({ 
        multiple: false, 
        directory: true,
      });
      
      if (selected && typeof selected === 'string') {
        setCustomOutputPath(selected);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleConvert = async () => {
    if (selectedFiles.length === 0 || !selectedFormat) return;

    setIsConverting(true);
    setIsCancelled(false);
    setProgress(0);
    setShowResult(null);
    
    const outputs: string[] = [];
    let successCount = 0;
    let failedCount = 0;
    
    try {
      // Handle merge conversion (multiple files → 1 output)
      if (selectedFormat === 'pdf' && selectedFiles.length > 1) {
        // Check if all files are images
        const allImages = selectedFiles.every(f => 
          ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp'].includes(f.extension.toLowerCase())
        );
        
        if (allImages) {
          setStatus('Merging images into single PDF...');
          setProgressText('Combining all images into one PDF');
          
          const result = await invoke<{
            success: boolean;
            output_path?: string;
            error?: string;
            converted_size?: number;
          }>('merge_images_to_pdf', {
            inputPaths: selectedFiles.map(f => f.path),
            outputPath: getOutputPath(),
          });

          if (result.success) {
            outputs.push(result.output_path || '');
            successCount = 1;
            setStatus('PDF created successfully!');
            
            const historyItem: HistoryItem = {
              id: `job_${Date.now()}`,
              fileName: `${selectedFiles.length} images → PDF`,
              originalFormat: 'multiple',
              targetFormat: 'pdf',
              originalSize: selectedFiles.reduce((acc, f) => acc + f.size, 0),
              convertedSize: result.converted_size,
              outputPath: result.output_path || '',
              timestamp: Date.now(),
              status: 'success',
            };
            addHistoryItem(historyItem);
          } else {
            failedCount = 1;
            setStatus(`Error: ${result.error}`);
          }
        }
      } else if (['docx', 'pdf'].includes(selectedFormat) && selectedFiles.length > 1) {
        // Merge multiple documents
        setStatus('Merging documents...');
        
        const result = await invoke<{
          success: boolean;
          output_path?: string;
          error?: string;
          converted_size?: number;
        }>('merge_documents', {
          inputPaths: selectedFiles.map(f => f.path),
          outputFormat: selectedFormat,
          outputPath: getOutputPath(),
        });

        if (result.success) {
          outputs.push(result.output_path || '');
          successCount = 1;
          setStatus('Documents merged successfully!');
          
          const historyItem: HistoryItem = {
            id: `job_${Date.now()}`,
            fileName: `${selectedFiles.length} docs → ${selectedFormat}`,
            originalFormat: 'multiple',
            targetFormat: selectedFormat,
            originalSize: selectedFiles.reduce((acc, f) => acc + f.size, 0),
            convertedSize: result.converted_size,
            outputPath: result.output_path || '',
            timestamp: Date.now(),
            status: 'success',
          };
          addHistoryItem(historyItem);
        } else {
          failedCount = 1;
          setStatus(`Error: ${result.error}`);
        }
      } else {
        // Regular batch conversion (one output per input)
        for (let i = 0; i < selectedFiles.length; i++) {
          if (isCancelled) break;
          
          const file = selectedFiles[i];
          setProgress(Math.round((i / selectedFiles.length) * 100));
          setProgressText(`Converting ${i + 1}/${selectedFiles.length}: ${file.name}`);
          setStatus(`Converting: ${file.name}`);
          
          try {
            const result = await invoke<{
              success: boolean;
              output_path?: string;
              error?: string;
              converted_size?: number;
            }>('convert_file', {
              inputPath: file.path,
              outputFormat: selectedFormat,
              outputPath: saveOption === 'custom' ? customOutputPath : undefined,
              saveOption: saveOption === 'replace' ? 'replace' : 'copy',
            });

            if (result.success && result.output_path) {
              outputs.push(result.output_path);
              successCount++;
              
              const historyItem: HistoryItem = {
                id: `job_${Date.now()}_${i}`,
                fileName: file.name,
                originalFormat: file.extension,
                targetFormat: selectedFormat,
                originalSize: file.size,
                convertedSize: result.converted_size,
                outputPath: result.output_path,
                timestamp: Date.now(),
                status: 'success',
              };
              addHistoryItem(historyItem);
            } else {
              failedCount++;
            }
          } catch (err) {
            failedCount++;
          }
        }
        
        if (!isCancelled) {
          setStatus(`Complete: ${successCount} succeeded, ${failedCount} failed`);
        }
      }
    } catch (err) {
      setStatus(`Error: ${err}`);
    }
    
    setShowResult({ success: successCount, failed: failedCount, outputs });
    setProgress(100);
    setIsConverting(false);
    setProgressText('');
  };

  const handleCancel = () => {
    setIsCancelled(true);
    setStatus('Cancelling...');
  };

  const handleClose = () => {
    handleClearFiles();
    setProgress(0);
    setShowResult(null);
    setCustomOutputPath('');
  };

  const outputPath = getOutputPath();
  const totalSize = selectedFiles.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="h-screen flex flex-col bg-[#F0F0F0]">
      {/* Main content area */}
      <div className="flex-1 p-4 overflow-auto">
        
        {/* Section: File Selection */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-xs font-semibold text-[#5C5C5C] uppercase">File Selection</h3>
            {selectedFiles.length > 0 && (
              <button onClick={handleClearFiles} className="text-xs text-[#D13438] hover:underline">
                Clear
              </button>
            )}
          </div>
          <hr className="border-t border-[#A0A0A0] mb-2" />
          
          <div className="flex gap-2">
            <input
              type="text"
              value={selectedFiles.length > 0 ? `${selectedFiles.length} file(s) selected` : ''}
              readOnly
              placeholder="No files selected"
              className="flex-1 h-8 px-2 border border-[#7A7A7A] bg-white text-sm"
            />
            <button onClick={handleSelectFiles} className="btn btn-secondary px-3" disabled={isConverting}>
              Browse...
            </button>
          </div>
          
          {selectedFiles.length > 0 && (
            <div className="mt-2 max-h-20 overflow-y-auto text-xs text-[#5C5C5C] bg-white border border-[#D1D1D1] p-1">
              {selectedFiles.slice(0, 5).map((f, i) => (
                <div key={i} className="truncate">{f.name} ({formatFileSize(f.size)})</div>
              ))}
              {selectedFiles.length > 5 && <div>... and {selectedFiles.length - 5} more</div>}
              <div className="mt-1 font-medium text-[#0078D4]">Total: {formatFileSize(totalSize)}</div>
            </div>
          )}
        </div>

        {/* Section: Output Settings */}
        <div className="mb-3">
          <h3 className="text-xs font-semibold text-[#5C5C5C] uppercase mb-1">Output Settings</h3>
          <hr className="border-t border-[#A0A0A0] mb-2" />
          
          <div className="mb-2">
            <label className="block text-xs text-[#5C5C5C] mb-1">Convert to:</label>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="select w-full"
              disabled={isConverting || availableFormats.length === 0}
            >
              <option value="">Select format...</option>
              {availableFormats.map((fmt: string) => (
                <option key={fmt} value={fmt}>
                  {fmt.toUpperCase()} {selectedFiles.length > 1 && fmt === 'pdf' ? '(All images → 1 PDF)' : ''}
                </option>
              ))}
            </select>
            {selectedFiles.length > 0 && availableFormats.length === 0 && (
              <p className="text-xs text-[#D13438] mt-1">No conversion available</p>
            )}
          </div>

          {/* Output filename */}
          <div className="mb-2">
            <label className="block text-xs text-[#5C5C5C] mb-1">Output filename:</label>
            <input
              type="text"
              value={outputFilename}
              onChange={(e) => setOutputFilename(e.target.value)}
              placeholder="Enter output filename"
              className="w-full h-8 px-2 border border-[#7A7A7A] bg-white text-sm"
              disabled={isConverting}
            />
          </div>

          <div className="mb-2">
            <label className="block text-xs text-[#5C5C5C] mb-1">Save option:</label>
            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="radio"
                  name="saveOption"
                  checked={saveOption === 'copy'}
                  onChange={() => setSaveOption('copy')}
                  disabled={isConverting}
                />
                Same folder as original
              </label>
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="radio"
                  name="saveOption"
                  checked={saveOption === 'replace'}
                  onChange={() => setSaveOption('replace')}
                  disabled={isConverting}
                />
                Replace originals
              </label>
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="radio"
                  name="saveOption"
                  checked={saveOption === 'custom'}
                  onChange={() => setSaveOption('custom')}
                  disabled={isConverting}
                />
                Custom folder
              </label>
            </div>
          </div>

          {saveOption === 'custom' && (
            <div className="mb-2">
              <label className="block text-xs text-[#5C5C5C] mb-1">Output folder:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customOutputPath}
                  onChange={(e) => setCustomOutputPath(e.target.value)}
                  placeholder="Select folder..."
                  className="flex-1 h-8 px-2 border border-[#7A7A7A] bg-white text-sm"
                  disabled={isConverting}
                />
                <button onClick={handleSelectOutputFolder} className="btn btn-secondary px-3" disabled={isConverting}>
                  ...
                </button>
              </div>
            </div>
          )}

          {/* Show output path preview */}
          {selectedFiles.length > 0 && selectedFormat && outputPath && (
            <div className="mt-2 p-2 bg-blue-50 border border-[#0078D4]">
              <p className="text-xs text-[#0078D4] font-medium">Output will be saved to:</p>
              <p className="text-xs text-[#0078D4] truncate mt-1">{outputPath}</p>
              {selectedFormat === 'pdf' && selectedFiles.length > 1 && (
                <p className="text-xs text-[#107C10] mt-1">✓ {selectedFiles.length} files will be merged into 1 PDF</p>
              )}
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="mb-2">
          <div className="h-6 bg-white border border-[#A0A0A0] px-2 flex items-center">
            <span className={`text-xs ${showResult?.failed ? 'text-[#D13438]' : 'text-[#5C5C5C]'}`}>
              {status}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="progress-bar">
            <div 
              className="progress-fill transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          {progressText && (
            <p className="text-xs text-[#5C5C5C] mt-1 truncate">{progressText}</p>
          )}
        </div>

        {/* Result message */}
        {showResult && (
          <div className={`mb-2 p-2 border ${showResult.failed === 0 ? 'border-[#107C10] bg-green-50' : 'border-[#D13438] bg-red-50'}`}>
            <p className={`text-xs ${showResult.failed === 0 ? 'text-[#107C10]' : 'text-[#D13438]'}`}>
              ✓ Converted: {showResult.success} | ✕ Failed: {showResult.failed}
            </p>
            {showResult.outputs.length > 0 && (
              <p className="text-xs text-[#5C5C5C] mt-1 truncate">
                📁 {showResult.outputs[0]}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="h-12 bg-[#E8E8E8] border-t border-[#A0A0A0] px-3 flex items-center justify-between">
        {/* Left - icon buttons */}
        <div className="flex gap-1">
          <button 
            onClick={() => setActiveTab('history')}
            className="w-8 h-8 flex items-center justify-center hover:bg-white border border-transparent hover:border-[#A0A0A0]"
            title="History"
          >
            <svg className="w-4 h-4 text-[#5C5C5C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>

        {/* Right - action buttons */}
        <div className="flex gap-2">
          {isConverting ? (
            <button onClick={handleCancel} className="btn btn-secondary">
              Cancel
            </button>
          ) : (
            <>
              <button 
                onClick={handleConvert}
                disabled={selectedFiles.length === 0 || !selectedFormat}
                className="btn btn-primary"
              >
                START ({selectedFiles.length})
              </button>
              <button 
                onClick={handleClose}
                className="btn btn-secondary"
              >
                CLOSE
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
