export default function PdfDownloadButton({ isGenerating, onClick, label = 'PDF 다운로드' }) {
  return (
    <button
      onClick={onClick}
      disabled={isGenerating}
      className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg font-bold text-xs sm:text-sm transition-colors flex items-center gap-1 shadow ${
        isGenerating
          ? 'bg-red-400 text-white cursor-not-allowed'
          : 'bg-red-600 text-white hover:bg-red-700'
      }`}
    >
      {isGenerating ? '⏳ PDF 생성 중...' : `📄 ${label}`}
    </button>
  );
}
