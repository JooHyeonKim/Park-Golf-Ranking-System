// 순위 계산 유틸리티 함수

/**
 * 상세 점수 비교 (D9 → D8 → ... → A1 순서)
 * @param {Object} p1 - 첫 번째 선수
 * @param {Object} p2 - 두 번째 선수
 * @returns {number} - 비교 결과 (-1: p1 우선, 1: p2 우선, 0: 동점)
 */
export function compareDetailScores(p1, p2) {
  const holes = [
    'F9', 'F8', 'F7', 'F6', 'F5', 'F4', 'F3', 'F2', 'F1',
    'E9', 'E8', 'E7', 'E6', 'E5', 'E4', 'E3', 'E2', 'E1',
    'D9', 'D8', 'D7', 'D6', 'D5', 'D4', 'D3', 'D2', 'D1',
    'C9', 'C8', 'C7', 'C6', 'C5', 'C4', 'C3', 'C2', 'C1',
    'B9', 'B8', 'B7', 'B6', 'B5', 'B4', 'B3', 'B2', 'B1',
    'A9', 'A8', 'A7', 'A6', 'A5', 'A4', 'A3', 'A2', 'A1'
  ];

  for (const hole of holes) {
    const score1 = p1.detailScores?.[hole];
    const score2 = p2.detailScores?.[hole];

    // 둘 다 점수가 있고 다른 경우
    if (score1 != null && score2 != null && score1 !== score2) {
      return score1 - score2;  // 낮은 점수가 우선
    }
  }

  return 0;  // 완전 동점
}

/**
 * 두 선수 비교 함수
 * @param {Object} p1 - 첫 번째 선수
 * @param {Object} p2 - 두 번째 선수
 * @returns {number} - 비교 결과
 */
export function comparePlayers(p1, p2) {
  // 점수가 null인 경우 처리
  const total1 = calculateTotal(p1);
  const total2 = calculateTotal(p2);

  // 점수가 없는 선수는 맨 뒤로
  if (total1 === null && total2 === null) return 0;
  if (total1 === null) return 1;
  if (total2 === null) return -1;

  // 1차 정렬: 36홀 합계 (오름차순)
  if (total1 !== total2) {
    return total1 - total2;
  }

  // 2차 정렬: 동점자 처리 (F → E → D → C → B → A 순서)
  for (const key of ['scoreF', 'scoreE', 'scoreD', 'scoreC', 'scoreB', 'scoreA']) {
    const s1 = p1[key] ?? null;
    const s2 = p2[key] ?? null;
    if (s1 !== null && s2 !== null && s1 !== s2) {
      return s1 - s2;
    }
  }

  // 3차 정렬: 상세 점수 비교
  return compareDetailScores(p1, p2);
}

/**
 * 합계 계산 (18/36/54홀)
 * @param {Object} player - 선수 객체
 * @returns {number|null} - 합계 (점수가 하나라도 있으면 계산)
 */
export function calculateTotal(player) {
  const { scoreA, scoreB, scoreC, scoreD, scoreE, scoreF } = player;

  // 모든 점수가 null/undefined이면 null 반환
  if ((scoreA ?? null) === null && (scoreB ?? null) === null &&
      (scoreC ?? null) === null && (scoreD ?? null) === null &&
      (scoreE ?? null) === null && (scoreF ?? null) === null) {
    return null;
  }

  // 하나라도 있으면 합계 계산 (null/undefined은 0으로 처리)
  return (scoreA ?? 0) + (scoreB ?? 0) + (scoreC ?? 0) + (scoreD ?? 0) + (scoreE ?? 0) + (scoreF ?? 0);
}

/**
 * 선수 목록에 순위 부여
 * @param {Array} players - 선수 목록
 * @returns {Array} - 순위가 부여된 선수 목록
 */
export function calculateRankings(players) {
  // 점수가 있는 선수만 필터링하여 순위 계산
  const playersWithScores = players.filter(p => calculateTotal(p) !== null);

  // 정렬
  const sorted = [...playersWithScores].sort(comparePlayers);

  // 순위 부여
  let currentRank = 1;
  let previousTotal = null;
  let previousPlayer = null;

  const rankedPlayers = sorted.map((player, index) => {
    const total = calculateTotal(player);

    // 이전 선수와 완전히 동점인지 확인
    if (index > 0 &&
        total === previousTotal &&
        comparePlayers(player, previousPlayer) === 0) {
      // 동점이면 이전 순위 유지
      return { ...player, rank: currentRank };
    } else {
      // 다르면 새 순위
      currentRank = index + 1;
      previousTotal = total;
      previousPlayer = player;
      return { ...player, rank: currentRank };
    }
  });

  // 점수 없는 선수들 추가 (rank: null)
  const playersWithoutScores = players
    .filter(p => calculateTotal(p) === null)
    .map(p => ({ ...p, rank: null }));

  // 순위 있는 선수 + 순위 없는 선수 모두 반환
  return [...rankedPlayers, ...playersWithoutScores];
}

/**
 * 완전 동점자 감지 (상세 점수 입력 필요)
 * @param {Object} player - 선수 객체
 * @param {Array} players - 전체 선수 목록
 * @returns {boolean} - 상세 점수 입력이 필요한지 여부
 */
export function needsDetailScores(player, players) {
  const myTotal = calculateTotal(player);
  if (myTotal === null) return false;

  // 같은 합계를 가진 다른 선수 찾기
  const sameScorePlayers = players.filter(p => {
    if (p.id === player.id) return false;
    const total = calculateTotal(p);
    if (total !== myTotal) return false;

    // A, B, C, D 점수도 모두 같은지 확인
    return p.scoreA === player.scoreA &&
           p.scoreB === player.scoreB &&
           p.scoreC === player.scoreC &&
           p.scoreD === player.scoreD &&
           (p.scoreE ?? null) === (player.scoreE ?? null) &&
           (p.scoreF ?? null) === (player.scoreF ?? null);
  });

  // 완전 동점자가 있으면 상세 점수 필요
  return sameScorePlayers.length > 0;
}
