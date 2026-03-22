export default function ImageDownloadButton({ isCapturing, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={isCapturing}
      className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg font-bold text-xs sm:text-sm transition-colors flex items-center gap-1 shadow ${
        isCapturing
          ? 'bg-blue-400 text-white cursor-not-allowed'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      }`}
    >
      {isCapturing ? '⏳ 다운로드 중...' : '📷 이미지 다운로드'}
    </button>
  );
}
