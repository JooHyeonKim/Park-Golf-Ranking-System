import React, { useState } from 'react';
import { useTournaments } from './hooks/useTournaments';
import { useClubs } from './hooks/useClubs';
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
    setCurrentTournament
  } = useTournaments();

  const { clubs, addClub, editClub, deleteClub } = useClubs();

  const [screenMode, setScreenMode] = useState('list'); // 'list' | 'score' | 'summary' | 'clubs'

  const handleAddTournament = (name, date, holeCount) => {
    addTournament(name, date, holeCount);
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

  // 화면 라우팅
  if (screenMode === 'clubs') {
    return (
      <ClubManagement
        clubs={clubs}
        onAddClub={addClub}
        onEditClub={editClub}
        onDeleteClub={deleteClub}
        onBack={handleBackToList}
      />
    );
  }

  if (screenMode === 'list' || !currentTournament) {
    return (
      <TournamentList
        tournaments={tournaments}
        onSelect={handleSelectTournament}
        onDelete={deleteTournament}
        onAdd={handleAddTournament}
        onViewSummary={handleViewSummary}
        onGoToClubs={handleGoToClubs}
      />
    );
  }

  if (screenMode === 'summary') {
    return (
      <SummaryPage
        tournament={currentTournament}
        onBack={handleBackToScore}
      />
    );
  }

  return (
    <ScoreTable
      tournament={currentTournament}
      clubs={clubs}
      onBack={handleBackToList}
      onUpdatePlayer={updatePlayer}
      onAddPlayerToCourse={addPlayerToCourse}
      onViewSummary={handleViewSummary}
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
