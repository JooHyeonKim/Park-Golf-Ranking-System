import React from 'react';

export default function CollabRoleSelect({ onSelectLeader, onSelectParticipant, onBack }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center p-6">
      <div className="text-center mb-12">
        <h1 className="text-2xl font-bold text-green-800 mb-2">협동 입력 모드</h1>
        <p className="text-gray-500 text-sm">역할을 선택하세요</p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <button
          onClick={onSelectLeader}
          className="w-full py-6 px-4 bg-white border-2 border-blue-600 rounded-2xl shadow-md hover:shadow-lg transition-shadow"
        >
          <div className="text-xl font-bold text-blue-700 mb-1">팀장</div>
          <div className="text-sm text-gray-500">대회를 생성하고 관리합니다</div>
        </button>

        <button
          onClick={onSelectParticipant}
          className="w-full py-6 px-4 bg-white border-2 border-green-600 rounded-2xl shadow-md hover:shadow-lg transition-shadow"
        >
          <div className="text-xl font-bold text-green-700 mb-1">참여자</div>
          <div className="text-sm text-gray-500">대회 코드를 입력하여 점수를 기록합니다</div>
        </button>
      </div>

      <button
        onClick={onBack}
        className="mt-8 text-gray-400 hover:text-gray-600 text-sm"
      >
        ← 뒤로
      </button>
    </div>
  );
}
