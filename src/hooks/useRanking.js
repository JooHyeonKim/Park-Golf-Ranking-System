import { useMemo } from 'react';
import {
  calculateRankings,
  calculateTotal,
  needsDetailScores
} from '../utils/ranking';

/**
 * 순위 계산 커스텀 훅
 * @param {Array} players - 선수 목록
 * @param {string} sortBy - 정렬 방식 ('rank' | 'group')
 * @param {boolean} isRankingCalculated - 순위 계산 여부
 */
export function useRanking(players, sortBy = 'rank', isRankingCalculated = false) {
  // 순위가 부여된 선수 목록
  const rankedPlayers = useMemo(() => {
    if (!isRankingCalculated) {
      // 순위 미계산 상태: 모든 선수의 rank를 null로 설정
      return players.map(p => ({ ...p, rank: null }));
    }
    return calculateRankings(players);
  }, [players, isRankingCalculated]);

  // 정렬된 선수 목록
  const sortedPlayers = useMemo(() => {
    // rankedPlayers에 이미 모든 선수가 포함되어 있으므로
    // 별도로 playersWithoutRank를 추가할 필요 없음
    const allPlayers = rankedPlayers.map(p => ({
      ...p,
      total: calculateTotal(p),
      needsDetail: needsDetailScores(p, players)
    }));

    if (sortBy === 'rank') {
      // 순위순 정렬 (순위 없는 선수는 뒤로)
      return allPlayers.sort((a, b) => {
        if (a.rank === null && b.rank === null) return 0;
        if (a.rank === null) return 1;
        if (b.rank === null) return -1;
        return a.rank - b.rank;
      });
    } else {
      // 조순 정렬 (1 ~ 36)
      return allPlayers.sort((a, b) => {
        // group은 이미 숫자이므로 직접 비교
        if (a.group !== b.group) {
          return a.group - b.group;
        }
        // 같은 조 내에서는 id 순서로 정렬
        return a.id - b.id;
      });
    }
  }, [rankedPlayers, players, sortBy]);

  return {
    sortedPlayers,
    rankedPlayers
  };
}
