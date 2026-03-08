import { useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { invoke } from '@tauri-apps/api/core';
import { HistoryItem } from '../types';

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function FileCard() {
  const { 
    droppedFile, 
    setDroppedFile, 
    availableFormats, 
    selectedFormat, 
    setSelectedFormat,
    setConversionJob,
    addHistoryItem,
  } = useAppStore();
  
  const [isConverting, setIsConverting] = useState(false);
  const [saveOption, setSaveOption] = useState<'copy' | 'replace'>('copy');
  const [customPath, setCustomPath] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [outputPath, setOutputPath] = useState('');

  if (!droppedFile) return null;

  const handleConvert = async () => {
    if (!selectedFormat) return;

    setIsConverting(true);
    const jobId = `job_${Date.now()}`;
    
    setConversionJob({
      id: jobId,
      file: droppedFile,
      targetFormat: selectedFormat,
      status: 'processing',
      progress: 0,
    });

    try {
      const result = await invoke<{
        success: boolean;
        output_path?: string;
        error?: string;
        converted_size?: number;
      }>('convert_file', {
        inputPath: droppedFile.path,
        outputFormat: selectedFormat,
        outputPath: customPath || undefined,
        saveOption: saveOption,
      });

      const finalOutputPath = result.output_path || '';
      setOutputPath(finalOutputPath);
      setShowSuccess(result.success);

      const historyItem: HistoryItem = {
        id: jobId,
        fileName: droppedFile.name,
        originalFormat: droppedFile.extension,
        targetFormat: selectedFormat,
        originalSize: droppedFile.size,
        convertedSize: result.converted_size,
        outputPath: finalOutputPath,
        timestamp: Date.now(),
        status: result.success ? 'success' : 'failed',
        error: result.error,
      };

      addHistoryItem(historyItem);
      setConversionJob({
        id: jobId,
        file: droppedFile,
        targetFormat: selectedFormat,
        status: result.success ? 'completed' : 'failed',
        progress: 100,
        result: {
          success: result.success,
          outputPath: finalOutputPath,
          error: result.error,
          originalSize: droppedFile.size,
          convertedSize: result.converted_size,
        },
      });
    } catch (err) {
      console.error('Conversion error:', err);
      setConversionJob({
        id: jobId,
        file: droppedFile,
        targetFormat: selectedFormat,
        status: 'failed',
        progress: 0,
        result: {
          success: false,
          error: String(err),
          originalSize: droppedFile.size,
        },
      });
    } finally {
      setIsConverting(false);
    }
  };

  const handleClear = () => {
    setDroppedFile(null);
    setSelectedFormat('');
    setConversionJob(null);
    setShowSuccess(false);
    setOutputPath('');
    setCustomPath('');
  };

  const handleOpenFolder = async () => {
    if (outputPath) {
      try {
        const { revealItemInDir } = await import('@tauri-apps/plugin-opener');
        await revealItemInDir(outputPath);
      } catch (err) {
        console.error('Error opening folder:', err);
      }
    }
  };

  // Show success state
  if (showSuccess && outputPath) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="card w-full max-w-lg animate-fade-in">
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Conversion Complete!</h3>
            <p className="text-gray-400">Your file has been converted successfully</p>
          </div>

          {/* Output info */}
          <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{outputPath.split('/').pop()}</p>
                <p className="text-sm text-gray-400">{formatFileSize(droppedFile.size)} → {selectedFormat.toUpperCase()}</p>
              </div>
            </div>
            
            {/* Output path */}
            <div className="text-xs text-gray-500 break-all bg-gray-900/50 rounded-lg p-2">
              {outputPath}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleOpenFolder}
              className="btn-secondary flex-1 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              Open Folder
            </button>
            <button
              onClick={handleClear}
              className="btn-primary flex-1"
            >
              Convert Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="card w-full max-w-lg animate-fade-in">
        {/* File Info Header */}
        <div className="flex items-start gap-4 mb-6 pb-6 border-b border-gray-700">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
            <svg className="w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate text-white">{droppedFile.name}</h3>
            <p className="text-sm text-gray-400">
              {formatFileSize(droppedFile.size)} • {droppedFile.extension.toUpperCase()}
            </p>
          </div>
          <button
            onClick={handleClear}
            className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Convert to format */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Convert to
          </label>
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="select"
          >
            <option value="">Select output format...</option>
            {availableFormats.map((format) => (
              <option key={format} value={format}>
                {format.toUpperCase()} ({format})
              </option>
            ))}
          </select>
        </div>

        {/* Save Option */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Save option
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSaveOption('copy')}
              className={`
                p-3 rounded-xl border-2 transition-all text-left
                ${saveOption === 'copy' 
                  ? 'border-indigo-500 bg-indigo-500/10' 
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }
              `}
            >
              <div className="flex items-center gap-2 mb-1">
                <svg className={`w-4 h-4 ${saveOption === 'copy' ? 'text-indigo-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
                <span className={`font-medium ${saveOption === 'copy' ? 'text-white' : 'text-gray-400'}`}>Save as Copy</span>
              </div>
              <p className="text-xs text-gray-500">Keep original file, create new one</p>
            </button>
            
            <button
              type="button"
              onClick={() => setSaveOption('replace')}
              className={`
                p-3 rounded-xl border-2 transition-all text-left
                ${saveOption === 'replace' 
                  ? 'border-indigo-500 bg-indigo-500/10' 
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }
              `}
            >
              <div className="flex items-center gap-2 mb-1">
                <svg className={`w-4 h-4 ${saveOption === 'replace' ? 'text-indigo-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span className={`font-medium ${saveOption === 'replace' ? 'text-white' : 'text-gray-400'}`}>Replace</span>
              </div>
              <p className="text-xs text-gray-500">Overwrite original file</p>
            </button>
          </div>
        </div>

        {/* Custom output path (optional) */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Output location <span className="text-gray-500">(optional)</span>
          </label>
          <input
            type="text"
            value={customPath}
            onChange={(e) => setCustomPath(e.target.value)}
            placeholder="Default: same folder as original"
            className="input"
          />
        </div>

        {/* Convert button */}
        <button
          onClick={handleConvert}
          disabled={!selectedFormat || isConverting}
          className="btn-primary w-full flex items-center justify-center gap-2 py-4"
        >
          {isConverting ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Converting...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Convert to {selectedFormat.toUpperCase()}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
