import React, { useState } from 'react';

export default function ClubManagement({
  clubs, onAddClub, onEditClub, onDeleteClub, onBack,
  members, onAddMember, onEditMember, onDeleteMember, getMembersByClub
}) {
  const [newClubName, setNewClubName] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [error, setError] = useState('');

  // 선택된 클럽 (회원 목록 표시용)
  const [selectedClub, setSelectedClub] = useState(null);

  // 회원 추가 폼 상태
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberGender, setNewMemberGender] = useState('');
  const [newMemberBirthDate, setNewMemberBirthDate] = useState('');
  const [memberError, setMemberError] = useState('');

  // 회원 수정 상태
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editingMemberName, setEditingMemberName] = useState('');
  const [editingMemberGender, setEditingMemberGender] = useState('');
  const [editingMemberBirthDate, setEditingMemberBirthDate] = useState('');

  // 선택된 클럽의 회원 목록
  const clubMembers = selectedClub ? getMembersByClub(selectedClub) : [];

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
      // 선택된 클럽명도 업데이트
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

  const handleClubClick = (name) => {
    if (selectedClub === name) {
      setSelectedClub(null);
    } else {
      setSelectedClub(name);
      setMemberError('');
      setEditingMemberId(null);
    }
  };

  // 회원 추가
  const handleAddMember = async () => {
    if (!newMemberName.trim()) {
      setMemberError('이름을 입력해주세요');
      return;
    }
    if (!newMemberGender) {
      setMemberError('성별을 선택해주세요');
      return;
    }
    const success = await onAddMember(newMemberName, newMemberGender, selectedClub, newMemberBirthDate);
    if (success) {
      setNewMemberName('');
      setNewMemberGender('');
      setNewMemberBirthDate('');
      setMemberError('');
    }
  };

  // 회원 수정 시작
  const handleMemberEditStart = (member) => {
    setEditingMemberId(member.id);
    setEditingMemberName(member.name);
    setEditingMemberGender(member.gender);
    setEditingMemberBirthDate(member.birthDate || '');
  };

  // 회원 수정 저장
  const handleMemberEditSave = async () => {
    if (!editingMemberName.trim()) return;
    await onEditMember(editingMemberId, {
      name: editingMemberName.trim(),
      gender: editingMemberGender,
      birthDate: editingMemberBirthDate
    });
    setEditingMemberId(null);
  };

  // 회원 수정 취소
  const handleMemberEditCancel = () => {
    setEditingMemberId(null);
  };

  // 회원 삭제
  const handleMemberDelete = (member) => {
    if (confirm(`"${member.name}" 회원을 삭제하시겠습니까?`)) {
      onDeleteMember(member.id);
    }
  };

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
                className={`flex items-center justify-between p-4 ${
                  selectedClub === club ? 'bg-green-50 border-l-4 border-green-600' : ''
                }`}
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
                      onClick={() => handleClubClick(club)}
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

        {/* 회원 관리 섹션 (클럽 선택 시 표시) */}
        {selectedClub && (
          <div className="bg-white rounded-xl shadow-sm mt-4 overflow-hidden">
            {/* 헤더 */}
            <div className="p-4 border-b bg-green-600 text-white flex items-center justify-between">
              <h3 className="font-bold text-lg">
                {selectedClub} 회원 ({clubMembers.length}명)
              </h3>
              <button
                onClick={() => setSelectedClub(null)}
                className="text-green-100 hover:text-white font-bold text-lg"
              >
                닫기
              </button>
            </div>

            {/* 회원 추가 폼 */}
            <div className="p-4 border-b bg-green-50">
              <div className="flex gap-2 flex-wrap">
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => { setNewMemberName(e.target.value); setMemberError(''); }}
                  placeholder="이름"
                  className="flex-1 min-w-[100px] px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
                />
                <select
                  value={newMemberGender}
                  onChange={(e) => { setNewMemberGender(e.target.value); setMemberError(''); }}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">성별</option>
                  <option value="남">남</option>
                  <option value="여">여</option>
                </select>
                <input
                  type="date"
                  value={newMemberBirthDate}
                  onChange={(e) => setNewMemberBirthDate(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="생년월일 (선택)"
                />
                <button
                  onClick={handleAddMember}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  추가
                </button>
              </div>
              {memberError && <p className="text-red-500 text-sm mt-2">{memberError}</p>}
            </div>

            {/* 회원 리스트 */}
            <div className="divide-y">
              {clubMembers.length === 0 ? (
                <div className="p-6 text-center text-gray-400">
                  등록된 회원이 없습니다
                </div>
              ) : (
                clubMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4">
                    {editingMemberId === member.id ? (
                      <div className="flex-1 flex gap-2 flex-wrap">
                        <input
                          type="text"
                          value={editingMemberName}
                          onChange={(e) => setEditingMemberName(e.target.value)}
                          className="flex-1 min-w-[80px] px-3 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          autoFocus
                        />
                        <select
                          value={editingMemberGender}
                          onChange={(e) => setEditingMemberGender(e.target.value)}
                          className="px-3 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="남">남</option>
                          <option value="여">여</option>
                        </select>
                        <input
                          type="date"
                          value={editingMemberBirthDate}
                          onChange={(e) => setEditingMemberBirthDate(e.target.value)}
                          className="px-3 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <button
                          onClick={handleMemberEditSave}
                          className="px-3 py-1 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                        >
                          저장
                        </button>
                        <button
                          onClick={handleMemberEditCancel}
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800">{member.name}</span>
                          <span className={`text-sm px-1.5 py-0.5 rounded ${
                            member.gender === '남' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                          }`}>
                            {member.gender}
                          </span>
                          {member.birthDate && (
                            <span className="text-sm text-gray-400">{member.birthDate}</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleMemberEditStart(member)}
                            className="px-3 py-1 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleMemberDelete(member)}
                            className="px-3 py-1 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                          >
                            삭제
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
