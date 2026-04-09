import { useState, useCallback } from 'react';
import { calculateRankings, calculateTotal } from '../utils/ranking';

const INDIVIDUAL_TOP = 5;
const RANKS = ['우승', '준우승', '3위', '4위', '5위'];

// ARGB 색상 상수
const C = {
  white:      'FFFFFFFF',
  rowOdd:     'FFF3F4F6', // gray-100
  textDark:   'FF111827',
  textRed:    'FFDC2626', // red-600
  textWhite:  'FFFFFFFF',
  textGray:   'FF374151',
  // 헤더
  hGray:      'FF9CA3AF', // gray-400 (기본 컬럼)
  hRed:       'FFEF4444', // 합계
  hPink3:     'FFF9A8D4', // A/B코스
  hPink4:     'FFF472B6', // AB총계
  hBlue3:     'FF93C5FD', // C/D코스
  hBlue4:     'FF60A5FA', // CD총계
  hViolet3:   'FFC4B5FD', // E/F코스
  hViolet4:   'FFA78BFA', // EF총계
  hOrange:    'FFFED7AA', // 홀인원
  hMale:      'FF3B82F6', // 남자
  hFemale:    'FFEC4899', // 여자
  hYellow4:   'FFFBBF24', // 단체전 합계
  hGreen5:    'FF22C55E', // 단체전 선수
  hGreen3:    'FF86EFAC', // 단체전 선수 서브
  // 데이터셀 배경
  dYellow:    'FFFEF9C3', // 합계열
  dPink:      'FFFCE7F3', // AB소계
  dBlue:      'FFDBEAFE', // CD소계
  dViolet:    'FFEDE9FE', // EF소계
};

function border() {
  const s = { style: 'thin', color: { argb: 'FFD1D5DB' } };
  return { top: s, bottom: s, left: s, right: s };
}

function styleHeader(cell, bg, fontColor = C.textWhite, fontSize = 15) {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
  cell.font = { bold: true, color: { argb: fontColor }, size: fontSize };
  cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: false };
  cell.border = border();
}

function addTitle(ws, title, colSpan) {
  const tRow = ws.addRow([title]);
  tRow.height = 38;
  ws.mergeCells(tRow.number, 1, tRow.number, colSpan);
  const cell = ws.getCell(tRow.number, 1);
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF166534' } };
  cell.font = { bold: true, color: { argb: C.textWhite }, size: 20 };
  cell.alignment = { horizontal: 'center', vertical: 'middle' };
}

function styleData(cell, bg, fontColor = C.textDark, bold = false) {
  if (bg) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
  cell.font = { bold, color: { argb: fontColor }, size: 14 };
  cell.alignment = { horizontal: 'center', vertical: 'middle' };
  cell.border = border();
}

function getGroupLabel(player) {
  return player.course?.split('-').length >= 3
    ? `${player.group}-${player.course.split('-')[2]}`
    : player.group;
}

function filterByCourse(players, holeCount) {
  if (holeCount === 18) return players.filter(p => p.course?.startsWith('A') || p.course?.startsWith('B'));
  if (holeCount === 27) return players.filter(p => ['A','B','C'].some(x => p.course?.startsWith(x)));
  return players;
}

function filterByGender(players, gender) {
  const filtered = players.filter(p => p.gender === gender);
  const reranked = calculateRankings(filtered);
  const rankMap = new Map(reranked.map(p => [p.id, p.rank]));
  return filtered.map(p => ({ ...p, rank: rankMap.get(p.id) ?? null }));
}

// ─── 전체현황 시트 ───
function addOverviewSheet(wb, tournament, genderFilter, holeCount, clubLabel, sheetName) {
  const is27Hole = holeCount === 27;
  const is54Hole = holeCount === 54;
  const hasScoreC = holeCount >= 27;
  const hasScoreD = holeCount >= 36;
  const hasScoreEF = holeCount === 54;

  const ranked = calculateRankings(tournament.players);
  const courseFiltered = filterByCourse(ranked, holeCount);
  const players = genderFilter ? filterByGender(courseFiltered, genderFilter) : courseFiltered;

  const ws = wb.addWorksheet(sheetName);

  // 헤더 컬럼 정의 (label, headerBg, dataBg, fontColor, bold)
  const cols = [
    { label: '순위',       hBg: C.hGray,    dBg: null,     dFont: C.textRed,  bold: true,  width: 6  },
    { label: '조',         hBg: C.hGray,    dBg: null,     dFont: C.textDark, bold: false, width: 10 },
    { label: clubLabel,    hBg: C.hGray,    dBg: null,     dFont: C.textDark, bold: false, width: 12 },
    { label: '성명',       hBg: C.hGray,    dBg: null,     dFont: C.textDark, bold: false, width: 10 },
    { label: '성별',       hBg: C.hGray,    dBg: null,     dFont: C.textDark, bold: false, width: 6  },
    { label: is54Hole ? '54홀 합계' : holeCount === 36 ? '36홀 합계' : is27Hole ? '27홀 합계' : '18홀 합계',
                           hBg: C.hRed,     dBg: C.dYellow, dFont: C.textRed,  bold: true,  width: 14 },
    { label: is54Hole ? 'A1코스' : 'A코스', hBg: C.hPink3, dBg: null,     dFont: C.textDark, bold: false, width: 10  },
    { label: is54Hole ? 'B1코스' : 'B코스', hBg: C.hPink3, dBg: null,     dFont: C.textDark, bold: false, width: 10  },
  ];
  if (!is27Hole) cols.push({ label: 'AB총계', hBg: C.hPink4, dBg: C.dPink, dFont: C.textDark, bold: true, width: 12 });
  if (hasScoreC) cols.push({ label: is54Hole ? 'C1코스' : 'C코스', hBg: C.hBlue3, dBg: null, dFont: C.textDark, bold: false, width: 10 });
  if (hasScoreD) {
    cols.push({ label: is54Hole ? 'D1코스' : 'D코스', hBg: C.hBlue3, dBg: null, dFont: C.textDark, bold: false, width: 10 });
    cols.push({ label: 'CD총계', hBg: C.hBlue4, dBg: C.dBlue, dFont: C.textDark, bold: true, width: 12 });
  }
  if (hasScoreEF) {
    cols.push({ label: 'A2코스', hBg: C.hViolet3, dBg: null, dFont: C.textDark, bold: false, width: 10 });
    cols.push({ label: 'B2코스', hBg: C.hViolet3, dBg: null, dFont: C.textDark, bold: false, width: 10 });
    cols.push({ label: 'EF총계', hBg: C.hViolet4, dBg: C.dViolet, dFont: C.textDark, bold: true, width: 12 });
  }
  cols.push({ label: '홀인원', hBg: C.hOrange, dBg: null, dFont: C.textDark, bold: false, width: 8, hFont: C.textDark });

  ws.columns = cols.map(c => ({ width: c.width }));

  // 제목 행
  const genderSuffix = genderFilter === '남' ? ' (남자)' : genderFilter === '여' ? ' (여자)' : '';
  addTitle(ws, `${tournament.name} 전체현황${genderSuffix}`, cols.length);

  // 헤더 행
  const hRow = ws.addRow(cols.map(c => c.label));
  hRow.height = 30;
  hRow.eachCell((cell, colNum) => {
    const col = cols[colNum - 1];
    styleHeader(cell, col.hBg, col.hFont || C.textWhite);
  });

  // 데이터 행
  players.forEach((player, idx) => {
    const rowBg = idx % 2 === 0 ? C.white : C.rowOdd;
    const abTotal = (player.scoreA != null && player.scoreB != null) ? player.scoreA + player.scoreB : '';
    const cdTotal = (player.scoreC != null && player.scoreD != null) ? player.scoreC + player.scoreD : '';
    const efTotal = (player.scoreE != null && player.scoreF != null) ? player.scoreE + player.scoreF : '';

    const values = [
      player.rank ?? '',
      getGroupLabel(player),
      player.club || '',
      player.name || '',
      player.gender || '',
      calculateTotal(player) ?? '',
      player.scoreA ?? '',
      player.scoreB ?? '',
    ];
    if (!is27Hole) values.push(abTotal);
    if (hasScoreC) values.push(player.scoreC ?? '');
    if (hasScoreD) { values.push(player.scoreD ?? ''); values.push(cdTotal); }
    if (hasScoreEF) { values.push(player.scoreE ?? ''); values.push(player.scoreF ?? ''); values.push(efTotal); }
    values.push(player.holeInOne ? 'O' : '');

    const dRow = ws.addRow(values);
    dRow.height = 26;
    dRow.eachCell((cell, colNum) => {
      const col = cols[colNum - 1];
      const bg = col.dBg || rowBg;
      styleData(cell, bg, col.dFont, col.bold);
    });
  });
}

// ─── 개인전 시트 ───
function addIndividualSheet(wb, tournament, clubLabel) {
  const ranked = calculateRankings(tournament.players);
  const withScores = ranked.filter(p => p.name && calculateTotal(p) !== null);
  const males = withScores.filter(p => p.gender === '남').slice(0, INDIVIDUAL_TOP);
  const females = withScores.filter(p => p.gender === '여').slice(0, INDIVIDUAL_TOP);
  const holeInOnePlayers = tournament.players.filter(p => p.holeInOne && p.name?.trim());

  const ws = wb.addWorksheet('개인전');
  ws.columns = [
    { width: 12 }, { width: 12 }, { width: 8 },
    { width: 8 },
    { width: 12 }, { width: 12 }, { width: 8 },
  ];

  addTitle(ws, `${tournament.name} 개인전`, 7);

  // 행1: 남자 / 순위 / 여자
  const r1 = ws.addRow([`남자`, '', '', '순위', `여자`, '', '']);
  r1.height = 30;
  ws.mergeCells(r1.number, 1, r1.number, 3);
  ws.mergeCells(r1.number, 5, r1.number, 7);
  styleHeader(ws.getCell(r1.number, 1), C.hMale);
  styleHeader(ws.getCell(r1.number, 4), 'FF6B7280');
  styleHeader(ws.getCell(r1.number, 5), C.hFemale);

  // 행2: 서브 헤더
  const r2 = ws.addRow([clubLabel, '성명', '타수', '', clubLabel, '성명', '타수']);
  r2.height = 28;
  [1,2,3].forEach(c => styleHeader(ws.getCell(r2.number, c), 'FF93C5FD', C.textDark));
  styleHeader(ws.getCell(r2.number, 4), 'FFD1D5DB', C.textDark);
  [5,6,7].forEach(c => styleHeader(ws.getCell(r2.number, c), 'FFFBCFE8', C.textDark));

  // 데이터
  RANKS.forEach((rankLabel, i) => {
    const male = males[i];
    const female = females[i];
    const bg = i % 2 === 0 ? C.white : C.rowOdd;
    const dRow = ws.addRow([
      male?.club || '', male?.name || '', male ? calculateTotal(male) : '',
      rankLabel,
      female?.club || '', female?.name || '', female ? calculateTotal(female) : '',
    ]);
    dRow.height = 26;
    [1,2].forEach(c => styleData(ws.getCell(dRow.number, c), bg));
    styleData(ws.getCell(dRow.number, 3), bg, C.textRed, true);
    styleData(ws.getCell(dRow.number, 4), 'FFF3F4F6', C.textGray, true);
    [5,6].forEach(c => styleData(ws.getCell(dRow.number, c), bg));
    styleData(ws.getCell(dRow.number, 7), bg, C.textRed, true);
  });

  // 홀인원 섹션
  if (holeInOnePlayers.length > 0) {
    ws.addRow([]);
    const hTitle = ws.addRow(['🎯 홀인원 수상자']);
    ws.mergeCells(hTitle.number, 1, hTitle.number, 5);
    styleHeader(ws.getCell(hTitle.number, 1), 'FFFED7AA', C.textDark);

    const hiHeader = ws.addRow(['번호', clubLabel, '성명', '성별', '홀 번호']);
    hiHeader.eachCell((cell) => styleHeader(cell, 'FFFED7AA', C.textDark));

    holeInOnePlayers.forEach((player, i) => {
      const bg = i % 2 === 0 ? C.white : C.rowOdd;
      const r = ws.addRow([i + 1, player.club, player.name, player.gender, player.holeInOne === true ? '-' : player.holeInOne]);
      r.eachCell(cell => styleData(cell, bg));
    });
  }
}

// ─── 장려상 시트 ───
function addEncouragementSheet(wb, tournament, maleMaxRank, femaleMaxRank, clubLabel) {
  const ranked = calculateRankings(tournament.players);
  const withScores = ranked.filter(p => p.name && calculateTotal(p) !== null);
  const maleDisplayCount = maleMaxRank - INDIVIDUAL_TOP;
  const femaleDisplayCount = femaleMaxRank - INDIVIDUAL_TOP;
  const males = withScores.filter(p => p.gender === '남').slice(INDIVIDUAL_TOP, INDIVIDUAL_TOP + maleDisplayCount);
  const females = withScores.filter(p => p.gender === '여').slice(INDIVIDUAL_TOP, INDIVIDUAL_TOP + femaleDisplayCount);
  const maxDisplayCount = Math.max(maleDisplayCount, femaleDisplayCount);

  const ws = wb.addWorksheet('장려상');
  ws.columns = [
    { width: 12 }, { width: 12 }, { width: 8 },
    { width: 8 },
    { width: 12 }, { width: 12 }, { width: 8 },
  ];

  addTitle(ws, `${tournament.name} 장려상`, 7);

  const r1 = ws.addRow(['남자', '', '', '순위', '여자', '', '']);
  r1.height = 30;
  ws.mergeCells(r1.number, 1, r1.number, 3);
  ws.mergeCells(r1.number, 5, r1.number, 7);
  styleHeader(ws.getCell(r1.number, 1), C.hMale);
  styleHeader(ws.getCell(r1.number, 4), 'FF6B7280');
  styleHeader(ws.getCell(r1.number, 5), C.hFemale);

  const r2 = ws.addRow([clubLabel, '성명', '타수', '', clubLabel, '성명', '타수']);
  r2.height = 28;
  [1,2,3].forEach(c => styleHeader(ws.getCell(r2.number, c), 'FF93C5FD', C.textDark));
  styleHeader(ws.getCell(r2.number, 4), 'FFD1D5DB', C.textDark);
  [5,6,7].forEach(c => styleHeader(ws.getCell(r2.number, c), 'FFFBCFE8', C.textDark));

  Array.from({ length: maxDisplayCount }, (_, index) => {
    const rankNumber = INDIVIDUAL_TOP + 1 + index;
    const showMale = index < maleDisplayCount;
    const showFemale = index < femaleDisplayCount;
    const male = showMale ? males[index] : null;
    const female = showFemale ? females[index] : null;
    const bg = index % 2 === 0 ? C.white : C.rowOdd;
    const dRow = ws.addRow([
      showMale ? (male?.club || '') : '', showMale ? (male?.name || '') : '', showMale && male ? calculateTotal(male) : '',
      `${rankNumber}위`,
      showFemale ? (female?.club || '') : '', showFemale ? (female?.name || '') : '', showFemale && female ? calculateTotal(female) : '',
    ]);
    dRow.height = 26;
    [1,2].forEach(c => styleData(ws.getCell(dRow.number, c), bg));
    styleData(ws.getCell(dRow.number, 3), bg, C.textRed, true);
    styleData(ws.getCell(dRow.number, 4), 'FFF3F4F6', C.textGray, true);
    [5,6].forEach(c => styleData(ws.getCell(dRow.number, c), bg));
    styleData(ws.getCell(dRow.number, 7), bg, C.textRed, true);
  });
}

// ─── 단체전 시트 ───
function addTeamSheet(wb, tournament, clubLabel) {
  const ranked = calculateRankings(tournament.players);
  const withScores = ranked.filter(p => p.name && calculateTotal(p) !== null);
  const excludedIds = new Set([
    ...withScores.filter(p => p.gender === '남').slice(0, 5).map(p => p.id),
    ...withScores.filter(p => p.gender === '여').slice(0, 5).map(p => p.id),
  ]);
  const eligible = withScores.filter(p => !excludedIds.has(p.id));
  const clubMap = new Map();
  eligible.forEach(player => {
    const name = player.club?.trim();
    if (!name || name === '본부') return;
    if (!clubMap.has(name)) clubMap.set(name, []);
    clubMap.get(name).push(player);
  });
  const clubResults = [];
  clubMap.forEach((players, clubName) => {
    const top4 = players.slice(0, 4);
    if (!top4.length) return;
    clubResults.push({ clubName, players: top4, total: top4.reduce((sum, p) => sum + calculateTotal(p), 0) });
  });
  clubResults.sort((a, b) => a.total - b.total);
  let currentRank = 1, previousTotal = null;
  const teamRankings = clubResults.map((club, i) => {
    if (club.total !== previousTotal) { currentRank = i + 1; previousTotal = club.total; }
    return { ...club, rank: currentRank };
  });

  const ws = wb.addWorksheet('단체전');
  ws.columns = [
    { width: 6 }, { width: 14 }, { width: 8 },
    { width: 12 }, { width: 8 },
    { width: 12 }, { width: 8 },
    { width: 12 }, { width: 8 },
    { width: 12 }, { width: 8 },
  ];

  addTitle(ws, `${tournament.name} 단체전`, 11);

  // 헤더 행1
  const r1 = ws.addRow(['순위', `${clubLabel}명`, '합계', '1번', '', '2번', '', '3번', '', '4번', '']);
  r1.height = 30;
  ws.mergeCells(r1.number, 4, r1.number, 5);
  ws.mergeCells(r1.number, 6, r1.number, 7);
  ws.mergeCells(r1.number, 8, r1.number, 9);
  ws.mergeCells(r1.number, 10, r1.number, 11);
  styleHeader(ws.getCell(r1.number, 1), 'FF6B7280');
  styleHeader(ws.getCell(r1.number, 2), 'FF6B7280');
  styleHeader(ws.getCell(r1.number, 3), C.hYellow4, C.textDark);
  [4,6,8,10].forEach(c => styleHeader(ws.getCell(r1.number, c), C.hGreen5));

  // 헤더 행2
  const r2 = ws.addRow(['', '', '', '성명', '타수', '성명', '타수', '성명', '타수', '성명', '타수']);
  r2.height = 28;
  styleHeader(ws.getCell(r2.number, 1), 'FF6B7280');
  styleHeader(ws.getCell(r2.number, 2), 'FF6B7280');
  styleHeader(ws.getCell(r2.number, 3), C.hYellow4, C.textDark);
  [4,5,6,7,8,9,10,11].forEach(c => styleHeader(ws.getCell(r2.number, c), C.hGreen3, C.textDark));

  // 데이터
  teamRankings.forEach((club, idx) => {
    const bg = idx % 2 === 0 ? C.white : C.rowOdd;
    const dRow = ws.addRow([
      club.rank, club.clubName, club.total,
      club.players[0]?.name || '', club.players[0] ? calculateTotal(club.players[0]) : '',
      club.players[1]?.name || '', club.players[1] ? calculateTotal(club.players[1]) : '',
      club.players[2]?.name || '', club.players[2] ? calculateTotal(club.players[2]) : '',
      club.players[3]?.name || '', club.players[3] ? calculateTotal(club.players[3]) : '',
    ]);
    dRow.height = 26;
    styleData(ws.getCell(dRow.number, 1), bg, C.textDark, true);
    styleData(ws.getCell(dRow.number, 2), bg);
    styleData(ws.getCell(dRow.number, 3), C.dYellow, C.textRed, true);
    [4,5,6,7,8,9,10,11].forEach((c, i) => {
      styleData(ws.getCell(dRow.number, c), bg, i % 2 === 1 ? C.textRed : C.textDark, i % 2 === 1);
    });
  });
}

// ─── 훅 ───
export function useExcelDownload(tournament, maleMaxRank = 10, femaleMaxRank = 10) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExcelDownload = useCallback(async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const ExcelJS = (await import('exceljs')).default;
      const wb = new ExcelJS.Workbook();
      wb.creator = 'ParkGolf';

      const holeCount = tournament.holeCount || 36;
      const clubLabel = tournament.clubType === 'affiliation' ? '소속' : '클럽';

      addOverviewSheet(wb, tournament, null, holeCount, clubLabel, '전체현황');
      addOverviewSheet(wb, tournament, '남', holeCount, clubLabel, '전체현황_남');
      addOverviewSheet(wb, tournament, '여', holeCount, clubLabel, '전체현황_여');
      addIndividualSheet(wb, tournament, clubLabel);
      addEncouragementSheet(wb, tournament, maleMaxRank, femaleMaxRank, clubLabel);
      addTeamSheet(wb, tournament, clubLabel);

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const name = (tournament.name || '대회').replace(/[/\\?%*:|"<>]/g, '_');
      a.href = url;
      a.download = `${name}_집계.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Excel 생성 실패:', error);
      alert('Excel 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsGenerating(false);
    }
  }, [tournament, maleMaxRank, femaleMaxRank, isGenerating]);

  return { isGenerating, handleExcelDownload };
}
