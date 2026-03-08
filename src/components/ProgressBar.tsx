import { useAppStore } from '../stores/appStore';

export function ProgressBar() {
  const { conversionJob, setConversionJob } = useAppStore();

  if (!conversionJob || conversionJob.status !== 'processing') return null;

  const handleCancel = () => {
    setConversionJob(null);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="w-full max-w-md bg-[#1A1A1A] rounded-2xl border border-[#2D2D2D] p-6">
        <h3 className="text-lg font-semibold mb-4">Converting...</h3>
        
        {/* Progress bar */}
        <div className="h-3 bg-[#252525] rounded-full overflow-hidden mb-4">
          <div 
            className="h-full progress-gradient transition-all duration-300"
            style={{ width: `${conversionJob.progress}%` }}
          />
        </div>

        <div className="flex justify-between text-sm text-[#A1A1AA] mb-4">
          <span>{conversionJob.progress}%</span>
          <span>{conversionJob.file.name}</span>
        </div>

        {/* Cancel button */}
        <button
          onClick={handleCancel}
          className="w-full py-2 bg-[#252525] hover:bg-[#2D2D2D] rounded-lg text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
