import React, { useState } from 'react';
import { useTournaments } from './hooks/useTournaments';
import { useClubs } from './hooks/useClubs';
import { useMembers } from './hooks/useMembers';
import { useAuthContext } from './contexts/AuthContext';
import TournamentList from './components/tournament/TournamentList';
import ScoreTable from './components/score/ScoreTable';
import SummaryPage from './components/summary/SummaryPage';
import ClubManagement from './components/club/ClubManagement';
import CollabModeSelect from './components/collab/CollabModeSelect';
import CollabRoleSelect from './components/collab/CollabRoleSelect';
import CollabLeaderAction from './components/collab/CollabLeaderAction';
import CollabLeaderSetup from './components/collab/CollabLeaderSetup';
import CollabLeaderDashboard from './components/collab/CollabLeaderDashboard';
import CollabJoinScreen from './components/collab/CollabJoinScreen';
import CollabGroupSelect from './components/collab/CollabGroupSelect';
import CollabScoreCard from './components/collab/CollabScoreCard';
import CollabSubmissionStatus from './components/collab/CollabSubmissionStatus';
import AuthLoginScreen from './components/auth/AuthLoginScreen';
import AuthProfileScreen from './components/auth/AuthProfileScreen';

export default function App() {
  const {
    tournaments,
    currentTournament,
    addTournament,
    deleteTournament,
    updatePlayer,
    addPlayerToCourse,
    removePlayerFromCourse,
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

  const { user, isAuthenticated, signOut, getDisplayName } = useAuthContext();

  // 화면 모드
  // 'mode-select' | 'list' | 'score' | 'summary' | 'clubs'
  // | 'auth-login' | 'auth-profile'
  // | 'collab-role' | 'collab-leader-action' | 'collab-leader-setup' | 'collab-leader-dashboard'
  // | 'collab-score-view'
  // | 'collab-join' | 'collab-group-select' | 'collab-scorecard' | 'collab-submission-status'
  const [screenMode, setScreenMode] = useState('mode-select');

  // 협동입력 관련 state
  const [collabTournamentId, setCollabTournamentId] = useState(null);
  const [collabTournament, setCollabTournament] = useState(null);
  const [collabGroupNumber, setCollabGroupNumber] = useState(null);
  const [collabNickname, setCollabNickname] = useState('');

  // ==================== 혼자입력 핸들러 (기존 그대로) ====================
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

  const handleEditClub = async (oldName, newName) => {
    const success = await editClub(oldName, newName);
    if (success) {
      await updateMembersClub(oldName, newName.trim());
    }
    return success;
  };

  // ==================== 모드 선택 핸들러 ====================
  const handleSelectSolo = () => {
    setScreenMode('list');
  };

  const handleSelectCollab = () => {
    if (isAuthenticated) {
      setScreenMode('collab-role');
    } else {
      setScreenMode('auth-login');
    }
  };

  const handleLoginSuccess = () => {
    setScreenMode('collab-role');
  };

  const handleGoToProfile = () => {
    setScreenMode('auth-profile');
  };

  const handleLogout = async () => {
    await signOut();
    setScreenMode('mode-select');
  };

  const handleBackToModeSelect = () => {
    setCollabTournamentId(null);
    setCollabTournament(null);
    setCollabGroupNumber(null);
    setCollabNickname('');
    setScreenMode('mode-select');
  };

  // ==================== 협동입력 핸들러 ====================
  const handleSelectLeader = () => {
    setScreenMode('collab-leader-action');
  };

  const handleLeaderCreateNew = () => {
    setScreenMode('collab-leader-setup');
  };

  const handleLeaderJoinExisting = (tournamentId) => {
    setCollabTournamentId(tournamentId);
    setScreenMode('collab-leader-dashboard');
  };

  const handleSelectParticipant = () => {
    setScreenMode('collab-join');
  };

  const handleLeaderSetupComplete = (tournamentId) => {
    setCollabTournamentId(tournamentId);
    setScreenMode('collab-leader-dashboard');
  };

  const handleJoinSuccess = (tournamentId, tournament, nickname) => {
    setCollabTournamentId(tournamentId);
    setCollabTournament(tournament);
    setCollabNickname(nickname);
    setScreenMode('collab-group-select');
  };

  const handleSelectGroup = (groupNumber) => {
    setCollabGroupNumber(groupNumber);
    setScreenMode('collab-scorecard');
  };

  const handleScoreSubmitted = () => {
    setScreenMode('collab-submission-status');
  };

  const handleBackToGroupSelect = () => {
    setCollabGroupNumber(null);
    setScreenMode('collab-group-select');
  };

  const handleResubmit = () => {
    setScreenMode('collab-scorecard');
  };

  const handleCollabViewSummary = (tournamentData) => {
    setCollabTournament(tournamentData);
    setScreenMode('summary');
  };

  const handleCollabViewScoreTable = (tournamentData) => {
    setCollabTournament(tournamentData);
    setScreenMode('collab-score-view');
  };

  // 협동모드 입력현황 뷰에서 로컬 편집 (Firestore에 반영 안 됨)
  const handleCollabViewUpdatePlayer = (tournamentId, playerId, updates) => {
    setCollabTournament(prev => ({
      ...prev,
      players: prev.players.map(p => p.id === playerId ? { ...p, ...updates } : p)
    }));
  };

  const handleBackFromCollabSummary = () => {
    setCollabTournament(null);
    setScreenMode('collab-leader-dashboard');
  };

  // ==================== 화면 라우팅 ====================

  // 모드 선택 화면
  if (screenMode === 'mode-select') {
    return (
      <CollabModeSelect
        onSelectSolo={handleSelectSolo}
        onSelectCollab={handleSelectCollab}
        isAuthenticated={isAuthenticated}
        displayName={getDisplayName()}
        onGoToProfile={handleGoToProfile}
      />
    );
  }

  // 인증 - 로그인/회원가입
  if (screenMode === 'auth-login') {
    return (
      <AuthLoginScreen
        onLoginSuccess={handleLoginSuccess}
        onBack={handleBackToModeSelect}
      />
    );
  }

  // 인증 - 프로필
  if (screenMode === 'auth-profile') {
    return (
      <AuthProfileScreen
        onLogin={() => setScreenMode('auth-login')}
        onBack={handleBackToModeSelect}
      />
    );
  }

  // 협동입력 - 역할 선택
  if (screenMode === 'collab-role') {
    return (
      <CollabRoleSelect
        onSelectLeader={handleSelectLeader}
        onSelectParticipant={handleSelectParticipant}
        onBack={handleBackToModeSelect}
      />
    );
  }

  // 협동입력 - 팀장 액션 선택 (새 대회 / 기존 대회)
  if (screenMode === 'collab-leader-action') {
    return (
      <CollabLeaderAction
        onCreateNew={handleLeaderCreateNew}
        onJoinExisting={handleLeaderJoinExisting}
        onBack={() => setScreenMode('collab-role')}
      />
    );
  }

  // 협동입력 - 팀장 설정
  if (screenMode === 'collab-leader-setup') {
    return (
      <CollabLeaderSetup
        searchByName={searchByName}
        onComplete={handleLeaderSetupComplete}
        onBack={() => setScreenMode('collab-leader-action')}
      />
    );
  }

  // 협동입력 - 팀장 대시보드
  if (screenMode === 'collab-leader-dashboard') {
    return (
      <CollabLeaderDashboard
        tournamentId={collabTournamentId}
        onViewSummary={handleCollabViewSummary}
        onViewScoreTable={handleCollabViewScoreTable}
        onBack={handleBackToModeSelect}
      />
    );
  }

  // 협동입력 - 입력 현황 보기 (ScoreTable 양식)
  if (screenMode === 'collab-score-view') {
    return (
      <ScoreTable
        tournament={collabTournament}
        clubs={collabTournament?.clubs || []}
        onBack={handleBackFromCollabSummary}
        onUpdatePlayer={handleCollabViewUpdatePlayer}
        onAddPlayerToCourse={() => {}}
        onRemovePlayerFromCourse={() => {}}
        onViewSummary={() => {
          setScreenMode('summary');
        }}
        searchByName={searchByName}
      />
    );
  }

  // 협동입력 - 참여자 코드 입력
  if (screenMode === 'collab-join') {
    return (
      <CollabJoinScreen
        onJoinSuccess={handleJoinSuccess}
        onBack={() => setScreenMode('collab-role')}
      />
    );
  }

  // 협동입력 - 참여자 조 선택
  if (screenMode === 'collab-group-select') {
    return (
      <CollabGroupSelect
        tournamentId={collabTournamentId}
        onSelectGroup={handleSelectGroup}
        onBack={handleBackToModeSelect}
      />
    );
  }

  // 협동입력 - 스코어카드 입력
  if (screenMode === 'collab-scorecard') {
    return (
      <CollabScoreCard
        tournamentId={collabTournamentId}
        groupNumber={collabGroupNumber}
        nickname={collabNickname}
        onSubmitted={handleScoreSubmitted}
        onBack={handleBackToGroupSelect}
      />
    );
  }

  // 협동입력 - 제출 상태
  if (screenMode === 'collab-submission-status') {
    return (
      <CollabSubmissionStatus
        tournamentId={collabTournamentId}
        groupNumber={collabGroupNumber}
        onResubmit={handleResubmit}
        onBackToGroups={handleBackToGroupSelect}
      />
    );
  }

  // 클럽 관리 (기존)
  if (screenMode === 'clubs') {
    return (
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
    );
  }

  // 결과 보기 (혼자입력 또는 협동입력 공용)
  if (screenMode === 'summary') {
    const tournamentData = collabTournament || currentTournament;
    const backHandler = collabTournament ? handleBackFromCollabSummary : handleBackToScore;
    return (
      <SummaryPage
        tournament={tournamentData}
        onBack={backHandler}
      />
    );
  }

  // 대회 목록 (기존)
  if (screenMode === 'list' || !currentTournament) {
    return (
      <TournamentList
        tournaments={tournaments}
        onSelect={handleSelectTournament}
        onDelete={deleteTournament}
        onAdd={handleAddTournament}
        onViewSummary={handleViewSummary}
        onGoToClubs={handleGoToClubs}
        onBack={handleBackToModeSelect}
      />
    );
  }

  // 점수 입력 (기존)
  return (
    <ScoreTable
      tournament={currentTournament}
      clubs={clubs}
      onBack={handleBackToList}
      onUpdatePlayer={updatePlayer}
      onAddPlayerToCourse={addPlayerToCourse}
      onRemovePlayerFromCourse={removePlayerFromCourse}
      onViewSummary={handleViewSummary}
      searchByName={searchByName}
    />
  );
}
