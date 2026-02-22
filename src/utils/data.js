// 데이터 초기화 및 관리 유틸리티 함수

export const CLUBS = [
  '방배', '양재', '잠원', '반포', '서리풀',
  '서래', '우면', '서초', '내곡', '청계',
  '이수', '매헌', '향목'
];

/**
 * 초기 선수 데이터 생성 (18홀: 72명, 36홀: 144명)
 * @param {number} holeCount - 홀 수 (18 또는 36)
 * @returns {Array} - 선수 목록
 */
export function createInitialPlayers(holeCount = 36) {
  const players = [];
  const courses = holeCount === 18 ? ['A', 'B'] : ['A', 'B', 'C', 'D'];
  const courseNames = [];

  // 36개 코스명 생성 (A-1 ~ D-9)
  for (const course of courses) {
    for (let i = 1; i <= 9; i++) {
      courseNames.push(`${course}-${i}`);
    }
  }

  // 각 코스마다 4명씩 생성 (총 144명)
  let idCounter = 1;
  let groupNumber = 1;

  for (const courseName of courseNames) {
    for (let i = 0; i < 4; i++) {
      players.push({
        id: idCounter++,
        group: groupNumber,        // 조 번호 (1 ~ 36)
        course: courseName,        // 코스명 (A-1 ~ D-9)
        name: '',
        gender: '',                // 성별 (남/여)
        club: '',
        scoreA: null,
        scoreB: null,
        scoreC: null,
        scoreD: null,
        detailScores: null
      });
    }
    groupNumber++;
  }

  return players;
}

/**
 * 새 대회 생성
 * @param {string} name - 대회명
 * @param {string} date - 날짜 (YYYY-MM-DD)
 * @param {number} holeCount - 홀 수 (18 또는 36)
 * @returns {Object} - 대회 객체
 */
export function createTournament(name, date, holeCount = 36) {
  return {
    id: Date.now(),
    name,
    date,
    holeCount,
    createdAt: Date.now(),
    players: createInitialPlayers(holeCount)
  };
}

/**
 * localStorage에서 대회 목록 로드
 * @returns {Array} - 대회 목록
 */
export function loadTournaments() {
  try {
    const data = localStorage.getItem('parkgolf-tournaments');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load tournaments:', error);
    return [];
  }
}

/**
 * localStorage에 대회 목록 저장
 * @param {Array} tournaments - 대회 목록
 */
export function saveTournaments(tournaments) {
  try {
    localStorage.setItem('parkgolf-tournaments', JSON.stringify(tournaments));
  } catch (error) {
    console.error('Failed to save tournaments:', error);
  }
}

/**
 * 현재 선택된 대회 ID 로드
 * @returns {number|null} - 대회 ID
 */
export function loadCurrentTournamentId() {
  try {
    const id = localStorage.getItem('parkgolf-current-tournament');
    return id ? parseInt(id, 10) : null;
  } catch (error) {
    console.error('Failed to load current tournament ID:', error);
    return null;
  }
}

/**
 * 현재 선택된 대회 ID 저장
 * @param {number} id - 대회 ID
 */
export function saveCurrentTournamentId(id) {
  try {
    localStorage.setItem('parkgolf-current-tournament', id.toString());
  } catch (error) {
    console.error('Failed to save current tournament ID:', error);
  }
}

/**
 * 특정 대회 찾기
 * @param {Array} tournaments - 대회 목록
 * @param {number} id - 대회 ID
 * @returns {Object|null} - 대회 객체
 */
export function findTournament(tournaments, id) {
  return tournaments.find(t => t.id === id) || null;
}

/**
 * 대회 업데이트
 * @param {Array} tournaments - 대회 목록
 * @param {number} id - 대회 ID
 * @param {Object} updates - 업데이트할 내용
 * @returns {Array} - 업데이트된 대회 목록
 */
export function updateTournament(tournaments, id, updates) {
  return tournaments.map(t =>
    t.id === id ? { ...t, ...updates } : t
  );
}

/**
 * 대회 삭제
 * @param {Array} tournaments - 대회 목록
 * @param {number} id - 대회 ID
 * @returns {Array} - 업데이트된 대회 목록
 */
export function deleteTournament(tournaments, id) {
  return tournaments.filter(t => t.id !== id);
}

/**
 * 선수 업데이트
 * @param {Array} players - 선수 목록
 * @param {number} id - 선수 ID
 * @param {Object} updates - 업데이트할 내용
 * @returns {Array} - 업데이트된 선수 목록
 */
export function updatePlayer(players, id, updates) {
  return players.map(p =>
    p.id === id ? { ...p, ...updates } : p
  );
}

/**
 * 참가자 수 계산
 * @param {Array} players - 선수 목록
 * @returns {number} - 이름이 입력된 선수 수
 */
export function countParticipants(players) {
  return players.filter(p => p.name && p.name.trim() !== '').length;
}
