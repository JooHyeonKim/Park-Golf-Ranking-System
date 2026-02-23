import React, { useState } from 'react';
import ClubMemberList from './ClubMemberList';

export default function ClubManagement({
  clubs, onAddClub, onEditClub, onDeleteClub, onBack,
  members, onAddMember, onEditMember, onDeleteMember, getMembersByClub
}) {
  const [newClubName, setNewClubName] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [error, setError] = useState('');

  // 선택된 클럽 (회원 목록 화면 전환용)
  const [selectedClub, setSelectedClub] = useState(null);

  const handleAdd = async () => {
    if (!newClubName.trim()) return;
    const success = await onAddClub(newClubName);
    if (success) {
      setNewClubName('');
      setError('');
    } else {
      setError('이미 존재하는 클럽명입니다');
    }
  };

  const handleEditStart = (index, name) => {
    setEditingIndex(index);
    setEditingName(name);
    setError('');
  };

  const handleEditSave = async (oldName) => {
    const success = await onEditClub(oldName, editingName);
    if (success) {
      if (selectedClub === oldName) {
        setSelectedClub(editingName.trim());
      }
      setEditingIndex(null);
      setEditingName('');
      setError('');
    } else {
      setError('이미 존재하는 클럽명입니다');
    }
  };

  const handleEditCancel = () => {
    setEditingIndex(null);
    setEditingName('');
    setError('');
  };

  const handleDelete = (name) => {
    if (confirm(`"${name}" 클럽을 삭제하시겠습니까?`)) {
      onDeleteClub(name);
      if (selectedClub === name) {
        setSelectedClub(null);
      }
    }
  };

  // 회원 목록 화면
  if (selectedClub) {
    return (
      <ClubMemberList
        clubName={selectedClub}
        members={getMembersByClub(selectedClub)}
        onAddMember={onAddMember}
        onEditMember={onEditMember}
        onDeleteMember={onDeleteMember}
        onBack={() => setSelectedClub(null)}
      />
    );
  }

  // 클럽 목록 화면
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="text-gray-700 hover:text-gray-900 font-bold text-lg"
          >
            &larr; 대회 목록
          </button>
          <h1 className="text-2xl font-bold text-gray-800">클럽 관리</h1>
        </div>

        {/* 새 클럽 추가 */}
        <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-3">새 클럽 추가</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newClubName}
              onChange={(e) => { setNewClubName(e.target.value); setError(''); }}
              placeholder="클럽명 입력"
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              추가
            </button>
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>

        {/* 클럽 목록 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-bold text-gray-800">클럽 목록 ({clubs.length}개)</h3>
            <p className="text-sm text-gray-500 mt-1">클럽을 클릭하면 회원 목록을 볼 수 있습니다</p>
          </div>
          <div className="divide-y">
            {clubs.map((club, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4"
              >
                {editingIndex === index ? (
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1 px-3 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleEditSave(club);
                        if (e.key === 'Escape') handleEditCancel();
                      }}
                      autoFocus
                    />
                    <button
                      onClick={() => handleEditSave(club)}
                      className="px-3 py-1 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                    >
                      저장
                    </button>
                    <button
                      onClick={handleEditCancel}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setSelectedClub(club)}
                      className="text-left flex-1 text-gray-800 font-medium hover:text-green-700 transition-colors"
                    >
                      {club}
                      <span className="ml-2 text-sm text-gray-400">
                        ({getMembersByClub(club).length}명)
                      </span>
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditStart(index, club)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(club)}
                        className="px-3 py-1 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                      >
                        삭제
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
