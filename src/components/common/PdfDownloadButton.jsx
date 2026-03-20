export default function PdfDownloadButton({ isGenerating, onClick, label = 'PDF 다운로드' }) {
  return (
    <button
      onClick={onClick}
      disabled={isGenerating}
      className={`px-4 py-2 rounded-lg font-bold text-base transition-colors flex items-center gap-1 shadow ${
        isGenerating
          ? 'bg-red-400 text-white cursor-not-allowed'
          : 'bg-red-600 text-white hover:bg-red-700'
      }`}
    >
      {isGenerating ? '⏳ PDF 생성 중...' : `📄 ${label}`}
    </button>
  );
}
