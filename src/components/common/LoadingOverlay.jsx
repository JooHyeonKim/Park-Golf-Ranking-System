export default function LoadingOverlay({ message = '다운로드 준비 중...' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl px-8 py-6 shadow-xl flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
        <p className="text-base font-bold text-gray-700">{message}</p>
      </div>
    </div>
  );
}
