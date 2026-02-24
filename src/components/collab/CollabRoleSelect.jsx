export default function CollabRoleSelect({ onSelectLeader, onSelectParticipant, onBack }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center p-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-green-800 mb-3">협동 입력 모드</h1>
        <p className="text-gray-500">역할을 선택하세요</p>
      </div>

      <div className="flex gap-6 max-w-3xl w-full">
        <button
          onClick={onSelectLeader}
          className="flex-1 py-10 px-8 bg-white border-2 border-blue-600 rounded-xl shadow-md hover:shadow-lg hover:border-blue-700 transition-all group"
        >
          <div className="text-5xl mb-4">👑</div>
          <div className="text-2xl font-bold text-blue-700 mb-2 group-hover:text-blue-800">팀장</div>
          <div className="text-gray-500">대회를 생성하고 관리합니다</div>
        </button>

        <button
          onClick={onSelectParticipant}
          className="flex-1 py-10 px-8 bg-white border-2 border-green-600 rounded-xl shadow-md hover:shadow-lg hover:border-green-700 transition-all group"
        >
          <div className="text-5xl mb-4">📝</div>
          <div className="text-2xl font-bold text-green-700 mb-2 group-hover:text-green-800">참여자</div>
          <div className="text-gray-500">대회 코드를 입력하여 점수를 기록합니다</div>
        </button>
      </div>

      <button
        onClick={onBack}
        className="mt-10 text-gray-400 hover:text-gray-600 text-base"
      >
        ← 모드 선택으로 돌아가기
      </button>
    </div>
  );
}
