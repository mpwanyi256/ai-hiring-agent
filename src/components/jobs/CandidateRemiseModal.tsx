interface CandidateRemiseModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeUrl: string;
}

export const CandidateRemiseModal = ({ isOpen, onClose, resumeUrl }: CandidateRemiseModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-3 border-b">
          <div className="text-sm font-medium">Resume Preview</div>
          <div className="flex items-center gap-2">
            <a
              href={resumeUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
            >
              Open in new tab
            </a>
            <button
              type="button"
              onClick={onClose}
              className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
              aria-label="Close"
            >
              Close
            </button>
          </div>
        </div>
        <div className="flex-1">
          <iframe src={resumeUrl} className="w-full h-full" title="Candidate Resume" />
        </div>
      </div>
    </div>
  );
};
