import React from 'react';
import { useTournaments } from './hooks/useTournaments';
import TournamentList from './components/tournament/TournamentList';
import ScoreTable from './components/score/ScoreTable';

export default function App() {
  const {
    tournaments,
    currentTournament,
    addTournament,
    deleteTournament,
    updatePlayer,
    setCurrentTournament
  } = useTournaments();

  const handleAddTournament = (name, date) => {
    addTournament(name, date);
  };

  const handleSelectTournament = (id) => {
    setCurrentTournament(id);
  };

  const handleBackToList = () => {
    setCurrentTournament(null);
  };

  // 대회 목록 화면 또는 점수 입력 화면
  if (!currentTournament) {
    return (
      <TournamentList
        tournaments={tournaments}
        onSelect={handleSelectTournament}
        onDelete={deleteTournament}
        onAdd={handleAddTournament}
      />
    );
  }

  return (
    <ScoreTable
      tournament={currentTournament}
      onBack={handleBackToList}
      onUpdatePlayer={updatePlayer}
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
