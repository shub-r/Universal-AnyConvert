import { useAppStore } from '../stores/appStore';

const AVAILABLE_EXTENSIONS = [
  {
    id: 'image-pack',
    name: 'Image Converter',
    description: 'Convert between JPG, PNG, WEBP, BMP, GIF, TIFF, ICO, SVG',
    icon: '📷',
    formats: ['jpg', 'png', 'webp', 'bmp', 'gif', 'tiff', 'ico', 'svg'],
  },
  {
    id: 'document-pack',
    name: 'Document Converter',
    description: 'Convert between PDF, DOCX, TXT, HTML, MARKDOWN, RTF',
    icon: '📄',
    formats: ['pdf', 'docx', 'txt', 'html', 'markdown', 'rtf'],
  },
  {
    id: 'video-pack',
    name: 'Video Converter',
    description: 'Convert between MP4, AVI, MKV, MOV, WEBM, GIF',
    icon: '🎬',
    formats: ['mp4', 'avi', 'mkv', 'mov', 'webm', 'gif'],
  },
  {
    id: 'audio-pack',
    name: 'Audio Converter',
    description: 'Convert between MP3, WAV, FLAC, AAC, OGG, M4A',
    icon: '🎵',
    formats: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'],
  },
  {
    id: 'spreadsheet-pack',
    name: 'Spreadsheet Converter',
    description: 'Convert between XLSX, CSV, ODS, TSV',
    icon: '📊',
    formats: ['xlsx', 'csv', 'ods', 'tsv'],
  },
];

export function ExtensionsPanel() {
  const { extensions, toggleExtension, activeTab } = useAppStore();

  if (activeTab !== 'extensions') return null;

  const installedIds = extensions.map(e => e.manifest.id);

  return (
    <div className="flex-1 flex flex-col p-6 overflow-hidden">
      <h2 className="text-xl font-semibold mb-6">Extensions</h2>

      <div className="flex-1 overflow-y-auto">
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-[#A1A1AA] uppercase tracking-wider mb-4">
            Installed
          </h3>
          <div className="space-y-3">
            {extensions.map((ext) => (
              <div
                key={ext.manifest.id}
                className="bg-[#1A1A1A] rounded-xl border border-[#2D2D2D] p-4 flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-[#252525] rounded-xl flex items-center justify-center text-2xl">
                  {ext.manifest.id === 'image-pack' && '📷'}
                  {ext.manifest.id === 'document-pack' && '📄'}
                  {ext.manifest.id === 'video-pack' && '🎬'}
                  {ext.manifest.id === 'audio-pack' && '🎵'}
                  {ext.manifest.id === 'spreadsheet-pack' && '📊'}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{ext.manifest.name}</h4>
                  <p className="text-sm text-[#A1A1AA]">{ext.manifest.description}</p>
                  <p className="text-xs text-[#A1A1AA] mt-1">
                    v{ext.manifest.version} • {ext.manifest.formats.map(f => f.extension).join(', ')}
                  </p>
                </div>
                <button
                  onClick={() => toggleExtension(ext.manifest.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    ext.manifest.enabled
                      ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      : 'bg-[#252525] text-[#A1A1AA] hover:bg-[#2D2D2D]'
                  }`}
                >
                  {ext.manifest.enabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            ))}
            {extensions.length === 0 && (
              <p className="text-[#A1A1AA] text-sm">No extensions installed</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-[#A1A1AA] uppercase tracking-wider mb-4">
            Available
          </h3>
          <div className="space-y-3">
            {AVAILABLE_EXTENSIONS.filter(e => !installedIds.includes(e.id)).map((ext) => (
              <div
                key={ext.id}
                className="bg-[#1A1A1A] rounded-xl border border-[#2D2D2D] p-4 flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-[#252525] rounded-xl flex items-center justify-center text-2xl">
                  {ext.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{ext.name}</h4>
                  <p className="text-sm text-[#A1A1AA]">{ext.description}</p>
                </div>
                <button
                  className="px-4 py-2 bg-[#6366F1] hover:bg-[#818CF8] rounded-lg text-sm font-medium transition-colors"
                >
                  Install
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
