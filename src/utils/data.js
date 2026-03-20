// 데이터 초기화 및 관리 유틸리티 함수
// 클럽/회원 데이터는 IndexedDB로 이동 (src/utils/db.js 참고)

/**
 * 총 조 수를 코스별로 균등 분배하여 코스명 목록 생성
 * 예: 7조, 4코스 → A:2, B:2, C:2, D:1
 */
function distributeCourseNames(courses, groupCount) {
  const numCourses = courses.length;
  const base = Math.floor(groupCount / numCourses);
  const remainder = groupCount % numCourses;
  const courseNames = [];

  for (let c = 0; c < courses.length; c++) {
    const count = base + (c < remainder ? 1 : 0);
    for (let i = 1; i <= count; i++) {
      courseNames.push(`${courses[c]}-${i}`);
    }
  }

  return courseNames;
}

/**
 * 초기 선수 데이터 생성
 * @param {number} holeCount - 홀 수 (18 또는 36)
 * @param {number} groupCount - 총 조 수 (기본: 18홀=18, 36홀=36)
 * @returns {Array} - 선수 목록
 */
export function createInitialPlayers(holeCount = 36, groupCount = null) {
  const players = [];
  const courses = holeCount === 18 ? ['A', 'B'] : ['A', 'B', 'C', 'D'];

  if (groupCount === null) groupCount = courses.length * 9;

  const courseNames = distributeCourseNames(courses, groupCount);

  let idCounter = 1;
  let groupNumber = 1;

  for (const courseName of courseNames) {
    for (let i = 0; i < 4; i++) {
      players.push({
        id: idCounter++,
        group: groupNumber,
        course: courseName,
        name: '',
        gender: '',
        club: '',
        scoreA: null,
        scoreB: null,
        scoreC: null,
        scoreD: null,
        detailScores: null,
        holeInOne: false
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
 * @param {number} groupCount - 총 조 수 (기본: 18홀=18, 36홀=36)
 * @returns {Object} - 대회 객체
 */
export function createTournament(name, date, holeCount = 36, groupCount = null) {
  const courses = holeCount === 18 ? ['A', 'B'] : ['A', 'B', 'C', 'D'];
  if (groupCount === null) groupCount = courses.length * 9;

  return {
    id: Date.now(),
    name,
    date,
    holeCount,
    groupCount,
    createdAt: Date.now(),
    players: createInitialPlayers(holeCount, groupCount)
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

/**
 * 코스 그룹 소속 여부 판단
 * "A-1-1"은 "A-1" 그룹, "A-10"은 "A-1" 그룹 아님
 */
function belongsToCourseGroup(course, baseCourse) {
  return course === baseCourse || course.startsWith(baseCourse + '-');
}

/**
 * 특정 코스의 추가 선수 수 카운트
 * @param {Array} players - 선수 목록
 * @param {string} baseCourse - 기본 코스명 (예: "A-1")
 * @returns {number} - 추가 선수 수
 */
export function countExtraPlayers(players, baseCourse) {
  return players.filter(p =>
    p.course !== baseCourse && belongsToCourseGroup(p.course, baseCourse)
  ).length;
}

/**
 * 추가 선수를 코스 그룹에 삽입 (최대 4명)
 * 추가된 선수의 코스명은 항상 baseCourse + "-1" (예: A-1 → A-1-1)
 * @param {Array} players - 선수 목록
 * @param {string} baseCourse - 기본 코스명 (예: "A-1")
 * @param {number} group - 조 번호
 * @returns {Array} - 업데이트된 선수 목록
 */
export function addPlayerToCourse(players, baseCourse, group) {
  const extraCount = countExtraPlayers(players, baseCourse);
  if (extraCount >= 4) return players;

  const newId = Math.max(0, ...players.map(p => p.id)) + 1;
  const newPlayer = {
    id: newId,
    group,
    course: `${baseCourse}-1`,
    name: '',
    gender: '',
    club: '',
    scoreA: null,
    scoreB: null,
    scoreC: null,
    scoreD: null,
    detailScores: null,
    holeInOne: false
  };

  // 해당 코스 그룹의 마지막 위치 뒤에 삽입
  let insertIndex = -1;
  for (let i = 0; i < players.length; i++) {
    if (belongsToCourseGroup(players[i].course, baseCourse)) {
      insertIndex = i;
    }
  }

  const result = [...players];
  result.splice(insertIndex + 1, 0, newPlayer);
  return result;
}

/**
 * 총 조 수 변경 시 players 배열 재조정
 * - 줄이면: 범위 밖 그룹의 선수 제거
 * - 늘리면: 새 빈 선수 슬롯 추가
 * - 기존 데이터와 추가 선수 보존
 * @param {Array} existingPlayers - 기존 선수 목록
 * @param {number} holeCount - 홀 수 (18 또는 36)
 * @param {number} newGroupCount - 새 총 조 수
 * @returns {Array} - 재조정된 선수 목록
 */
export function adjustGroupCount(existingPlayers, holeCount, newGroupCount) {
  const courses = holeCount === 18 ? ['A', 'B'] : ['A', 'B', 'C', 'D'];

  // 기존 선수를 코스별로 분류 (기본 선수 / 추가 선수)
  const baseMap = {};  // "A-1" -> [player, ...]
  const extraMap = {}; // "A-1" -> [extra player, ...]

  for (const p of existingPlayers) {
    const parts = p.course.split('-');
    const baseCourse = `${parts[0]}-${parts[1]}`;
    const isExtra = parts.length >= 3;

    if (isExtra) {
      if (!extraMap[baseCourse]) extraMap[baseCourse] = [];
      extraMap[baseCourse].push(p);
    } else {
      if (!baseMap[baseCourse]) baseMap[baseCourse] = [];
      baseMap[baseCourse].push(p);
    }
  }

  const courseNames = distributeCourseNames(courses, newGroupCount);
  let maxId = Math.max(0, ...existingPlayers.map(p => p.id));
  const result = [];
  let groupNumber = 1;

  for (const courseName of courseNames) {
    const existingBase = baseMap[courseName] || [];

    for (let slot = 0; slot < 4; slot++) {
      if (existingBase[slot]) {
        result.push({ ...existingBase[slot], group: groupNumber });
      } else {
        result.push({
          id: ++maxId,
          group: groupNumber,
          course: courseName,
          name: '', gender: '', club: '',
          scoreA: null, scoreB: null, scoreC: null, scoreD: null,
          detailScores: null, holeInOne: false
        });
      }
    }

    // 해당 조의 추가 선수 보존
    const extras = extraMap[courseName] || [];
    for (const extra of extras) {
      result.push({ ...extra, group: groupNumber });
    }

    groupNumber++;
  }

  return result;
}

/**
 * 추가된 선수를 코스 그룹에서 제거
 * @param {Array} players - 선수 목록
 * @param {number} playerId - 제거할 선수 ID
 * @returns {Array} - 업데이트된 선수 목록
 */
export function removePlayerFromCourse(players, playerId) {
  const player = players.find(p => p.id === playerId);
  if (!player) return players;
  // 추가된 선수만 삭제 가능 (코스명에 "-"가 2개 이상, 예: A-1-1)
  if (player.course.split('-').length < 3) return players;
  return players.filter(p => p.id !== playerId);
}
