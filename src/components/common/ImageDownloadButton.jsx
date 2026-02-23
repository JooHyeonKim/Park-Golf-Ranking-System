export default function ImageDownloadButton({ isCapturing, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={isCapturing}
      className={`px-4 py-2 rounded-lg font-bold text-base transition-colors flex items-center gap-1 shadow ${
        isCapturing
          ? 'bg-blue-400 text-white cursor-not-allowed'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      }`}
    >
      {isCapturing ? '⏳ 다운로드 중...' : '📷 이미지 다운로드'}
    </button>
  );
}
