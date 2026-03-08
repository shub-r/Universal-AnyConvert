import { useAppStore } from '../stores/appStore';

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '-';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function HistoryList() {
  const { history, clearHistory, activeTab } = useAppStore();

  if (activeTab !== 'history') return null;

  return (
    <div className="flex-1 flex flex-col p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Conversion History</h2>
        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="px-4 py-2 bg-[#252525] hover:bg-[#2D2D2D] rounded-lg text-sm transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[#A1A1AA]">
            <div className="w-20 h-20 bg-[#1A1A1A] rounded-2xl flex items-center justify-center text-4xl mb-4">
              📋
            </div>
            <p>No conversions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="bg-[#1A1A1A] rounded-xl border border-[#2D2D2D] p-4"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    item.status === 'success' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                  }`}>
                    {item.status === 'success' ? '✓' : '✕'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{item.fileName}</h4>
                    <p className="text-sm text-[#A1A1AA]">
                      {item.originalFormat.toUpperCase()} → {item.targetFormat.toUpperCase()}
                    </p>
                    <div className="flex gap-4 mt-2 text-xs text-[#A1A1AA]">
                      <span>{formatFileSize(item.originalSize)} → {formatFileSize(item.convertedSize)}</span>
                      <span>{formatDate(item.timestamp)}</span>
                    </div>
                    {item.error && (
                      <p className="text-sm text-red-400 mt-2">{item.error}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
