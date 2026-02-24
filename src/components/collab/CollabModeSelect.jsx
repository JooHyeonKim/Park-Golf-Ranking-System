export default function CollabModeSelect({ onSelectSolo, onSelectCollab }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center p-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-green-800 mb-3">파크골프 대회 관리</h1>
        <p className="text-gray-500">입력 모드를 선택하세요</p>
      </div>

      <div className="flex gap-6 max-w-3xl w-full">
        <button
          onClick={onSelectSolo}
          className="flex-1 py-10 px-8 bg-white border-2 border-green-600 rounded-xl shadow-md hover:shadow-lg hover:border-green-700 transition-all group"
        >
          <div className="text-5xl mb-4">💻</div>
          <div className="text-2xl font-bold text-green-700 mb-2 group-hover:text-green-800">혼자 입력</div>
          <div className="text-gray-500">오프라인 환경에서도 동작하는 계산기 모드</div>
        </button>

        <button
          onClick={onSelectCollab}
          className="flex-1 py-10 px-8 bg-green-600 text-white rounded-xl shadow-md hover:shadow-lg hover:bg-green-700 transition-all group"
        >
          <div className="text-5xl mb-4">👥</div>
          <div className="text-2xl font-bold mb-2">협동 입력</div>
          <div className="text-green-100">여러 명이 함께 점수를 입력하는 온라인 모드</div>
        </button>
      </div>
    </div>
  );
}
