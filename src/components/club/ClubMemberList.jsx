import { useState } from 'react';

const TEST_MEMBERS = [
  { name: '김철수', gender: '남', birthDate: '1965-03-15' },
  { name: '이영희', gender: '여', birthDate: '1970-07-22' },
  { name: '박정수', gender: '남', birthDate: '1958-11-03' },
  { name: '최미경', gender: '여', birthDate: '1972-01-10' },
  { name: '정대호', gender: '남', birthDate: '1963-09-28' },
  { name: '한순자', gender: '여', birthDate: '1968-05-17' },
  { name: '오민석', gender: '남', birthDate: '1975-12-01' },
  { name: '윤경아', gender: '여', birthDate: '1971-04-25' },
];

export default function ClubMemberList({
  clubName, members, onAddMember, onEditMember, onDeleteMember, onBack
}) {
  const [newName, setNewName] = useState('');
  const [newGender, setNewGender] = useState('');
  const [newBirthDate, setNewBirthDate] = useState('');
  const [error, setError] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingGender, setEditingGender] = useState('');
  const [editingBirthDate, setEditingBirthDate] = useState('');

  const handleAdd = async () => {
    if (!newName.trim()) {
      setError('이름을 입력해주세요');
      return;
    }
    if (!newGender) {
      setError('성별을 선택해주세요');
      return;
    }
    const success = await onAddMember(newName, newGender, clubName, newBirthDate);
    if (success) {
      setNewName('');
      setNewGender('');
      setNewBirthDate('');
      setError('');
    }
  };

  const handleEditStart = (member) => {
    setEditingId(member.id);
    setEditingName(member.name);
    setEditingGender(member.gender);
    setEditingBirthDate(member.birthDate || '');
  };

  const handleEditSave = async () => {
    if (!editingName.trim()) return;
    await onEditMember(editingId, {
      name: editingName.trim(),
      gender: editingGender,
      birthDate: editingBirthDate
    });
    setEditingId(null);
  };

  const handleEditCancel = () => {
    setEditingId(null);
  };

  const handleDelete = (member) => {
    if (confirm(`"${member.name}" 회원을 삭제하시겠습니까?`)) {
      onDeleteMember(member.id);
    }
  };

  const [isAddingTest, setIsAddingTest] = useState(false);
  const handleAddTestData = async () => {
    if (!confirm('테스트 회원 8명을 추가하시겠습니까?')) return;
    setIsAddingTest(true);
    for (const m of TEST_MEMBERS) {
      await onAddMember(m.name, m.gender, clubName, m.birthDate);
    }
    setIsAddingTest(false);
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
            &larr; 클럽 목록
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            {clubName} <span className="text-lg text-gray-500">({members.length}명)</span>
          </h1>
        </div>

        {/* 회원 추가 폼 */}
        <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-3">회원 추가</h3>
          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              value={newName}
              onChange={(e) => { setNewName(e.target.value); setError(''); }}
              placeholder="이름"
              className="flex-1 min-w-[100px] px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <select
              value={newGender}
              onChange={(e) => { setNewGender(e.target.value); setError(''); }}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">성별</option>
              <option value="남">남</option>
              <option value="여">여</option>
            </select>
            <input
              type="date"
              value={newBirthDate}
              onChange={(e) => setNewBirthDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="생년월일 (선택)"
            />
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              추가
            </button>
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          <button
            onClick={handleAddTestData}
            disabled={isAddingTest}
            className={`mt-3 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              isAddingTest
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-orange-500 text-white hover:bg-orange-600'
            }`}
          >
            {isAddingTest ? '추가 중...' : '테스트 데이터 추가 (8명)'}
          </button>
        </div>

        {/* 회원 리스트 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-bold text-gray-800">회원 목록</h3>
          </div>
          <div className="divide-y">
            {members.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                등록된 회원이 없습니다
              </div>
            ) : (
              members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4">
                  {editingId === member.id ? (
                    <div className="flex-1 flex gap-2 flex-wrap">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 min-w-[80px] px-3 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        autoFocus
                      />
                      <select
                        value={editingGender}
                        onChange={(e) => setEditingGender(e.target.value)}
                        className="px-3 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="남">남</option>
                        <option value="여">여</option>
                      </select>
                      <input
                        type="date"
                        value={editingBirthDate}
                        onChange={(e) => setEditingBirthDate(e.target.value)}
                        className="px-3 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <button
                        onClick={handleEditSave}
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
                          onClick={() => handleEditStart(member)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(member)}
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
      </div>
    </div>
  );
}
