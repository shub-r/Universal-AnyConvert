import { create } from 'zustand';
import { FileInfo, ConversionJob, Extension, HistoryItem } from '../types';

interface AppState {
  // Current tab
  activeTab: 'convert' | 'extensions' | 'history';
  setActiveTab: (tab: 'convert' | 'extensions' | 'history') => void;
  
  // Dragged file
  droppedFile: FileInfo | null;
  setDroppedFile: (file: FileInfo | null) => void;
  
  // Available conversions
  availableFormats: string[];
  setAvailableFormats: (formats: string[]) => void;
  
  // Selected conversion
  selectedFormat: string;
  setSelectedFormat: (format: string) => void;
  
  // Conversion
  conversionJob: ConversionJob | null;
  setConversionJob: (job: ConversionJob | null) => void;
  updateProgress: (progress: number, status: ConversionJob['status']) => void;
  
  // Extensions
  extensions: Extension[];
  setExtensions: (extensions: Extension[]) => void;
  toggleExtension: (id: string) => void;
  
  // History
  history: HistoryItem[];
  addHistoryItem: (item: HistoryItem) => void;
  clearHistory: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'convert',
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  droppedFile: null,
  setDroppedFile: (file) => set({ droppedFile: file }),
  
  availableFormats: [],
  setAvailableFormats: (formats) => set({ availableFormats: formats }),
  
  selectedFormat: '',
  setSelectedFormat: (format) => set({ selectedFormat: format }),
  
  conversionJob: null,
  setConversionJob: (job) => set({ conversionJob: job }),
  updateProgress: (progress, status) => set((state) => ({
    conversionJob: state.conversionJob ? { ...state.conversionJob, progress, status } : null
  })),
  
  extensions: [],
  setExtensions: (extensions) => set({ extensions }),
  toggleExtension: (id) => set((state) => ({
    extensions: state.extensions.map(ext => 
      ext.manifest.id === id 
        ? { ...ext, manifest: { ...ext.manifest, enabled: !ext.manifest.enabled } }
        : ext
    )
  })),
  
  history: [],
  addHistoryItem: (item) => set((state) => ({ history: [item, ...state.history] })),
  clearHistory: () => set({ history: [] }),
}));
