import { useAppStore } from '../stores/appStore';

export function Sidebar() {
  const { extensions, toggleExtension, activeTab, setActiveTab } = useAppStore();

  if (activeTab !== 'convert') return null;

  const installedExtensions = extensions.filter(e => e.manifest.enabled);

  const getIcon = (id: string) => {
    switch (id) {
      case 'image-pack': return '🖼️';
      case 'document-pack': return '📄';
      case 'video-pack': return '🎬';
      case 'audio-pack': return '🎵';
      case 'spreadsheet-pack': return '📊';
      default: return '📦';
    }
  };

  return (
    <div className="w-64 bg-[#1A1A1A] border-r border-[#3F3F46] flex flex-col">
      <div className="p-5 border-b border-[#3F3F46]">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Active Extensions
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {installedExtensions.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gray-800 flex items-center justify-center">
              <span className="text-3xl">📦</span>
            </div>
            <p className="text-gray-500 text-sm">No extensions installed</p>
            <p className="text-gray-600 text-xs mt-1">Go to Extensions tab to add</p>
          </div>
        ) : (
          <div className="space-y-2">
            {installedExtensions.map((ext) => (
              <div
                key={ext.manifest.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-[#252525] hover:bg-[#2D2D2D] transition-colors cursor-pointer group"
                onClick={() => toggleExtension(ext.manifest.id)}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg flex items-center justify-center text-xl">
                  {getIcon(ext.manifest.id)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{ext.manifest.name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {ext.manifest.formats.slice(0, 4).map(f => f.extension).join(', ')}
                    {ext.manifest.formats.length > 4 && '...'}
                  </p>
                </div>
                <div className={`w-2 h-2 rounded-full ${ext.manifest.enabled ? 'bg-green-500' : 'bg-gray-500'} group-hover:scale-125 transition-transform`} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-[#3F3F46]">
        <button
          onClick={() => setActiveTab('extensions')}
          className="w-full py-3 px-4 bg-[#252525] hover:bg-[#2D2D2D] rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 border border-[#3F3F46] hover:border-indigo-500/50"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Manage Extensions
        </button>
      </div>
    </div>
  );
}
