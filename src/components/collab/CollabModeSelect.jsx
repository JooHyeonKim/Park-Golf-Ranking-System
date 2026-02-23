import React from 'react';

export default function CollabModeSelect({ onSelectSolo, onSelectCollab }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center p-6">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-green-800 mb-2">파크골프 대회 관리</h1>
        <p className="text-gray-500 text-sm">입력 모드를 선택하세요</p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <button
          onClick={onSelectSolo}
          className="w-full py-6 px-4 bg-white border-2 border-green-600 rounded-2xl shadow-md hover:shadow-lg transition-shadow"
        >
          <div className="text-xl font-bold text-green-700 mb-1">혼자 입력</div>
          <div className="text-sm text-gray-500">오프라인 환경에서도 동작하는 계산기 모드</div>
        </button>

        <button
          onClick={onSelectCollab}
          className="w-full py-6 px-4 bg-green-600 text-white rounded-2xl shadow-md hover:shadow-lg hover:bg-green-700 transition-all"
        >
          <div className="text-xl font-bold mb-1">협동 입력</div>
          <div className="text-sm text-green-100">여러 명이 함께 점수를 입력하는 온라인 모드</div>
        </button>
      </div>
    </div>
  );
}
