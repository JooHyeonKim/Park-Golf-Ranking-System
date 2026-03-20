import React, { useState } from 'react';
import { useTournaments } from './hooks/useTournaments';
import { useClubs } from './hooks/useClubs';
import { useMembers } from './hooks/useMembers';
import TournamentList from './components/tournament/TournamentList';
import ScoreTable from './components/score/ScoreTable';
import SummaryPage from './components/summary/SummaryPage';
import ClubManagement from './components/club/ClubManagement';

export default function App() {
  const {
    tournaments,
    currentTournament,
    addTournament,
    deleteTournament,
    updatePlayer,
    addPlayerToCourse,
    removePlayerFromCourse,
    updateGroupCount,
    setCurrentTournament
  } = useTournaments();

  const { clubs, addClub, editClub, deleteClub } = useClubs();
  const {
    members,
    addMember,
    editMember,
    deleteMember,
    searchByName,
    getMembersByClub,
    updateMembersClub
  } = useMembers();

  const [screenMode, setScreenMode] = useState('list'); // 'list' | 'score' | 'summary' | 'clubs'

  const handleAddTournament = (name, date, holeCount, groupCount) => {
    addTournament(name, date, holeCount, groupCount);
    setScreenMode('score');
  };

  const handleSelectTournament = (id) => {
    setCurrentTournament(id);
    setScreenMode('score');
  };

  const handleBackToList = () => {
    setCurrentTournament(null);
    setScreenMode('list');
  };

  const handleViewSummary = (id) => {
    if (id) {
      setCurrentTournament(id);
    }
    setScreenMode('summary');
  };

  const handleBackToScore = () => {
    setScreenMode('score');
  };

  const handleGoToClubs = () => {
    setScreenMode('clubs');
  };

  // 클럽명 변경 시 회원의 club 필드도 함께 업데이트
  const handleEditClub = async (oldName, newName) => {
    const success = await editClub(oldName, newName);
    if (success) {
      await updateMembersClub(oldName, newName.trim());
    }
    return success;
  };

  const showFooter = screenMode !== 'score';

  const footer = showFooter && (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-200 flex justify-center items-center gap-4 py-4 text-sm text-gray-500 z-50">
      <span>
        프로그램 제작문의:{' '}
        <a href="mailto:subinkim0128@gmail.com" className="text-gray-500 underline">
          subinkim0128@gmail.com
        </a>
      </span>
      <span>|</span>
      <span>개발자 품위유지비 지원: 신한 110500604303</span>
    </div>
  );

  // 화면 라우팅
  if (screenMode === 'clubs') {
    return (
      <div className="pb-16">
        <ClubManagement
          clubs={clubs}
          onAddClub={addClub}
          onEditClub={handleEditClub}
          onDeleteClub={deleteClub}
          onBack={handleBackToList}
          members={members}
          onAddMember={addMember}
          onEditMember={editMember}
          onDeleteMember={deleteMember}
          getMembersByClub={getMembersByClub}
        />
        {footer}
      </div>
    );
  }

  if (screenMode === 'list' || !currentTournament) {
    return (
      <div className="pb-16">
        <TournamentList
          tournaments={tournaments}
          onSelect={handleSelectTournament}
          onDelete={deleteTournament}
          onAdd={handleAddTournament}
          onViewSummary={handleViewSummary}
          onGoToClubs={handleGoToClubs}
        />
        {footer}
      </div>
    );
  }

  if (screenMode === 'summary') {
    return (
      <div className="pb-16">
        <SummaryPage
          tournament={currentTournament}
          onBack={handleBackToScore}
        />
        {footer}
      </div>
    );
  }

  return (
    <ScoreTable
      tournament={currentTournament}
      clubs={clubs}
      onBack={handleBackToList}
      onUpdatePlayer={updatePlayer}
      onAddPlayerToCourse={addPlayerToCourse}
      onRemovePlayerFromCourse={removePlayerFromCourse}
      onUpdateGroupCount={updateGroupCount}
      onViewSummary={handleViewSummary}
      searchByName={searchByName}
    />
  );
}

/*
=============================================================================
BACKUP: 기존 App.jsx (단순 점수판)
=============================================================================

기존 코드는 주석으로 보존됨. 필요시 참고용으로 사용 가능.

import React, { useState, useEffect, useCallback } from 'react';

// 설정값
const HOLES = 9;
const PAR = [3, 4, 3, 4, 5, 3, 4, 3, 4]; // 각 홀별 파
const TOTAL_PAR = PAR.reduce((a, b) => a + b, 0);

// 로컬 스토리지 키
const STORAGE_KEY = 'parkgolf-data';

// ... (나머지 코드 생략)

=============================================================================
*/
