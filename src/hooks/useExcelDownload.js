import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { calculateRankings, calculateTotal } from '../utils/ranking';

const INDIVIDUAL_TOP = 5;
const RANKS = ['우승', '준우승', '3위', '4위', '5위'];

function getGroupLabel(player) {
  return player.course?.split('-').length >= 3
    ? `${player.group}-${player.course.split('-')[2]}`
    : player.group;
}

function filterByCourse(players, holeCount) {
  if (holeCount === 18) return players.filter(p => p.course?.startsWith('A') || p.course?.startsWith('B'));
  if (holeCount === 27) return players.filter(p => p.course?.startsWith('A') || p.course?.startsWith('B') || p.course?.startsWith('C'));
  return players;
}

function filterByGender(players, gender) {
  const filtered = players.filter(p => p.gender === gender);
  const reranked = calculateRankings(filtered);
  const rankMap = new Map(reranked.map(p => [p.id, p.rank]));
  return filtered.map(p => ({ ...p, rank: rankMap.get(p.id) ?? null }));
}

function buildOverviewSheet(tournament, genderFilter, holeCount, clubLabel) {
  const is27Hole = holeCount === 27;
  const is54Hole = holeCount === 54;
  const hasScoreC = holeCount >= 27;
  const hasScoreD = holeCount >= 36;
  const hasScoreEF = holeCount === 54;

  const ranked = calculateRankings(tournament.players);
  const courseFiltered = filterByCourse(ranked, holeCount);
  const players = genderFilter ? filterByGender(courseFiltered, genderFilter) : courseFiltered;

  const header = [
    '순위', '조', clubLabel, '성명', '성별',
    is54Hole ? '54홀 합계' : holeCount === 36 ? '36홀 합계' : holeCount === 27 ? '27홀 합계' : '18홀 합계',
    is54Hole ? 'A1코스' : 'A코스',
    is54Hole ? 'B1코스' : 'B코스',
  ];
  if (!is27Hole) header.push('AB총계');
  if (hasScoreC) header.push(is54Hole ? 'C1코스' : 'C코스');
  if (hasScoreD) {
    header.push(is54Hole ? 'D1코스' : 'D코스');
    header.push('CD총계');
  }
  if (hasScoreEF) {
    header.push('A2코스');
    header.push('B2코스');
    header.push('EF총계');
  }
  header.push('홀인원');

  const rows = [header];

  for (const player of players) {
    const row = [
      player.rank ?? '',
      getGroupLabel(player),
      player.club || '',
      player.name || '',
      player.gender || '',
      calculateTotal(player) ?? '',
      player.scoreA ?? '',
      player.scoreB ?? '',
    ];
    if (!is27Hole) {
      row.push((player.scoreA != null && player.scoreB != null) ? player.scoreA + player.scoreB : '');
    }
    if (hasScoreC) row.push(player.scoreC ?? '');
    if (hasScoreD) {
      row.push(player.scoreD ?? '');
      row.push((player.scoreC != null && player.scoreD != null) ? player.scoreC + player.scoreD : '');
    }
    if (hasScoreEF) {
      row.push(player.scoreE ?? '');
      row.push(player.scoreF ?? '');
      row.push((player.scoreE != null && player.scoreF != null) ? player.scoreE + player.scoreF : '');
    }
    row.push(player.holeInOne ? 'O' : '');
    rows.push(row);
  }

  return XLSX.utils.aoa_to_sheet(rows);
}

function buildIndividualSheet(tournament, clubLabel) {
  const ranked = calculateRankings(tournament.players);
  const withScores = ranked.filter(p => p.name && calculateTotal(p) !== null);
  const males = withScores.filter(p => p.gender === '남').slice(0, INDIVIDUAL_TOP);
  const females = withScores.filter(p => p.gender === '여').slice(0, INDIVIDUAL_TOP);
  const holeInOnePlayers = tournament.players.filter(p => p.holeInOne && p.name && p.name.trim());

  const header = [`남자_${clubLabel}`, '남자_성명', '남자_타수', '순위', `여자_${clubLabel}`, '여자_성명', '여자_타수'];
  const rows = [header];

  RANKS.forEach((rankLabel, i) => {
    const male = males[i];
    const female = females[i];
    rows.push([
      male?.club || '',
      male?.name || '',
      male ? calculateTotal(male) : '',
      rankLabel,
      female?.club || '',
      female?.name || '',
      female ? calculateTotal(female) : '',
    ]);
  });

  if (holeInOnePlayers.length > 0) {
    rows.push([]);
    rows.push([]);
    rows.push(['번호', clubLabel, '성명', '성별', '홀 번호']);
    holeInOnePlayers.forEach((player, index) => {
      rows.push([
        index + 1,
        player.club,
        player.name,
        player.gender,
        player.holeInOne === true ? '-' : player.holeInOne,
      ]);
    });
  }

  return XLSX.utils.aoa_to_sheet(rows);
}

function buildEncouragementSheet(tournament, maleMaxRank, femaleMaxRank, clubLabel) {
  const ranked = calculateRankings(tournament.players);
  const withScores = ranked.filter(p => p.name && calculateTotal(p) !== null);

  const maleDisplayCount = maleMaxRank - INDIVIDUAL_TOP;
  const femaleDisplayCount = femaleMaxRank - INDIVIDUAL_TOP;
  const males = withScores.filter(p => p.gender === '남').slice(INDIVIDUAL_TOP, INDIVIDUAL_TOP + maleDisplayCount);
  const females = withScores.filter(p => p.gender === '여').slice(INDIVIDUAL_TOP, INDIVIDUAL_TOP + femaleDisplayCount);
  const maxDisplayCount = Math.max(maleDisplayCount, femaleDisplayCount);

  const header = [`남자_${clubLabel}`, '남자_성명', '남자_타수', '순위', `여자_${clubLabel}`, '여자_성명', '여자_타수'];
  const rows = [header];

  Array.from({ length: maxDisplayCount }, (_, index) => {
    const rankNumber = INDIVIDUAL_TOP + 1 + index;
    const showMale = index < maleDisplayCount;
    const showFemale = index < femaleDisplayCount;
    const male = showMale ? males[index] : null;
    const female = showFemale ? females[index] : null;
    rows.push([
      showMale ? (male?.club || '') : '',
      showMale ? (male?.name || '') : '',
      showMale && male ? calculateTotal(male) : '',
      `${rankNumber}위`,
      showFemale ? (female?.club || '') : '',
      showFemale ? (female?.name || '') : '',
      showFemale && female ? calculateTotal(female) : '',
    ]);
  });

  return XLSX.utils.aoa_to_sheet(rows);
}

function buildTeamSheet(tournament, clubLabel) {
  const excludeCount = 5;
  const ranked = calculateRankings(tournament.players);
  const withScores = ranked.filter(p => p.name && calculateTotal(p) !== null);

  const topMales = withScores.filter(p => p.gender === '남').slice(0, excludeCount);
  const topFemales = withScores.filter(p => p.gender === '여').slice(0, excludeCount);
  const excludedIds = new Set([...topMales.map(p => p.id), ...topFemales.map(p => p.id)]);
  const eligible = withScores.filter(p => !excludedIds.has(p.id));

  const clubMap = new Map();
  eligible.forEach(player => {
    const clubName = player.club?.trim();
    if (!clubName || clubName === '본부') return;
    if (!clubMap.has(clubName)) clubMap.set(clubName, []);
    clubMap.get(clubName).push(player);
  });

  const clubResults = [];
  clubMap.forEach((players, clubName) => {
    const top4 = players.slice(0, 4);
    if (!top4.length) return;
    const clubTotal = top4.reduce((sum, p) => sum + calculateTotal(p), 0);
    clubResults.push({ clubName, players: top4, total: clubTotal });
  });
  clubResults.sort((a, b) => a.total - b.total);

  let currentRank = 1;
  let previousTotal = null;
  const teamRankings = clubResults.map((club, index) => {
    if (club.total !== previousTotal) {
      currentRank = index + 1;
      previousTotal = club.total;
    }
    return { ...club, rank: currentRank };
  });

  const header = ['순위', `${clubLabel}명`, '합계', '1성명', '1타수', '2성명', '2타수', '3성명', '3타수', '4성명', '4타수'];
  const rows = [header];

  teamRankings.forEach(club => {
    rows.push([
      club.rank,
      club.clubName,
      club.total,
      club.players[0]?.name || '',
      club.players[0] ? calculateTotal(club.players[0]) : '',
      club.players[1]?.name || '',
      club.players[1] ? calculateTotal(club.players[1]) : '',
      club.players[2]?.name || '',
      club.players[2] ? calculateTotal(club.players[2]) : '',
      club.players[3]?.name || '',
      club.players[3] ? calculateTotal(club.players[3]) : '',
    ]);
  });

  return XLSX.utils.aoa_to_sheet(rows);
}

export function useExcelDownload(tournament, maleMaxRank = 10, femaleMaxRank = 10) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExcelDownload = useCallback(async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const holeCount = tournament.holeCount || 36;
      const clubLabel = tournament.clubType === 'affiliation' ? '소속' : '클럽';
      const wb = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(wb, buildOverviewSheet(tournament, null, holeCount, clubLabel), '전체현황');
      XLSX.utils.book_append_sheet(wb, buildOverviewSheet(tournament, '남', holeCount, clubLabel), '전체현황_남');
      XLSX.utils.book_append_sheet(wb, buildOverviewSheet(tournament, '여', holeCount, clubLabel), '전체현황_여');
      XLSX.utils.book_append_sheet(wb, buildIndividualSheet(tournament, clubLabel), '개인전');
      XLSX.utils.book_append_sheet(wb, buildEncouragementSheet(tournament, maleMaxRank, femaleMaxRank, clubLabel), '장려상');
      XLSX.utils.book_append_sheet(wb, buildTeamSheet(tournament, clubLabel), '단체전');

      const name = (tournament.name || '대회').replace(/[/\\?%*:|"<>]/g, '_');
      XLSX.writeFile(wb, `${name}_집계.xlsx`);
    } catch (error) {
      console.error('Excel 생성 실패:', error);
      alert('Excel 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsGenerating(false);
    }
  }, [tournament, maleMaxRank, femaleMaxRank, isGenerating]);

  return { isGenerating, handleExcelDownload };
}
