import { useState, useMemo, Fragment } from 'react';
import { calculateRankings, calculateTotal } from '../../../utils/ranking';
import { useImageCapture } from '../../../hooks/useImageCapture';
import { useSinglePdfDownload } from '../../../hooks/useSinglePdfDownload';
import ImageDownloadButton from '../../common/ImageDownloadButton';
import PdfDownloadButton from '../../common/PdfDownloadButton';

const INDIVIDUAL_TOP = 5;

export default function TeamTab({ tournament }) {
  const [excludeTop, setExcludeTop] = useState(true);
  const { tableRef, isCapturing, handleCaptureImage } = useImageCapture(tournament.name, '단체전');
  const { isGenerating, handlePdfDownload } = useSinglePdfDownload(tableRef, tournament.name, '단체전');

  const teamRankings = useMemo(() => {
    const ranked = calculateRankings(tournament.players);
    const withScores = ranked.filter(p => p.name && calculateTotal(p) !== null);

    let eligible;
    if (excludeTop) {
      // 개인전 수상자 제외 대상 (남녀 각 상위 5명)
      const topMales = withScores.filter(p => p.gender === '남').slice(0, INDIVIDUAL_TOP);
      const topFemales = withScores.filter(p => p.gender === '여').slice(0, INDIVIDUAL_TOP);
      const excludedIds = new Set([
        ...topMales.map(p => p.id),
        ...topFemales.map(p => p.id)
      ]);
      eligible = withScores.filter(p => !excludedIds.has(p.id));
    } else {
      eligible = withScores;
    }

    // 클럽별 그룹화
    const clubMap = new Map();
    eligible.forEach(player => {
      const clubName = player.club?.trim();
      if (!clubName || clubName === '본부') return;
      if (!clubMap.has(clubName)) {
        clubMap.set(clubName, []);
      }
      clubMap.get(clubName).push(player);
    });

    // 각 클럽: 상위 4명 선택, 합계 계산
    const clubResults = [];
    clubMap.forEach((players, clubName) => {
      const top4 = players.slice(0, 4);
      if (top4.length === 0) return;
      const clubTotal = top4.reduce((sum, p) => sum + calculateTotal(p), 0);
      clubResults.push({ clubName, players: top4, total: clubTotal });
    });

    // 합계 오름차순 정렬
    clubResults.sort((a, b) => a.total - b.total);

    // 순위 부여 (동점 시 동일 순위)
    let currentRank = 1;
    let previousTotal = null;
    return clubResults.map((club, index) => {
      if (club.total !== previousTotal) {
        currentRank = index + 1;
        previousTotal = club.total;
      }
      return { ...club, rank: currentRank };
    });
  }, [tournament.players, excludeTop]);

  if (teamRankings.length === 0) {
    return (
      <div className="bg-white rounded-lg p-12 text-center shadow-sm">
        <p className="text-xl text-gray-600">단체전 집계</p>
        <p className="text-sm text-gray-400 mt-2">클럽이 등록된 선수가 없습니다</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-2 gap-2">
        <PdfDownloadButton isGenerating={isGenerating} onClick={handlePdfDownload} />
        <ImageDownloadButton isCapturing={isCapturing} onClick={handleCaptureImage} />
        <div className="inline-flex rounded-lg overflow-hidden border border-gray-300">
          <button
            onClick={() => setExcludeTop(false)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              !excludeTop
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            전체 포함
          </button>
          <button
            onClick={() => setExcludeTop(true)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              excludeTop
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            수상자 제외
          </button>
        </div>
      </div>
      <div ref={tableRef} data-capture-id="단체전" className="bg-white rounded-lg shadow-sm overflow-x-auto">
        <h3 className="text-center font-bold text-2xl py-5 bg-white">👥 {tournament.name} - 단체전</h3>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b">
              <th rowSpan={2} className="bg-gray-200 py-3 px-2 text-center border-r min-w-[50px]">
                순위
              </th>
              <th rowSpan={2} className="bg-gray-200 py-3 px-2 text-center border-r min-w-[80px]">
                클럽명
              </th>
              <th rowSpan={2} className="bg-yellow-200 py-3 px-2 text-center border-r min-w-[60px] font-bold">
                합계
              </th>
              {[1, 2, 3, 4].map(n => (
                <th key={n} colSpan={2} className="bg-green-200 py-3 px-2 text-center border-r last:border-r-0 min-w-[120px]">
                  {n}
                </th>
              ))}
            </tr>
            <tr className="border-b-2">
              {[1, 2, 3, 4].map(n => (
                <Fragment key={n}>
                  <th className="bg-green-100 py-2 px-2 text-center border-r min-w-[60px]">성명</th>
                  <th className={`bg-green-100 py-2 px-2 text-center min-w-[50px] ${n < 4 ? 'border-r' : ''}`}>타수</th>
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {teamRankings.map((club, index) => (
              <tr key={club.clubName} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="py-3 px-2 text-center border-r font-bold text-gray-700">
                  {club.rank}
                </td>
                <td className="py-3 px-2 text-center border-r font-medium">
                  {club.clubName}
                </td>
                <td className="py-3 px-2 text-center border-r font-bold text-yellow-700 bg-yellow-50">
                  {club.total}
                </td>
                {[0, 1, 2, 3].map(i => (
                  <Fragment key={i}>
                    <td className="py-3 px-2 text-center border-r">
                      {club.players[i]?.name || ''}
                    </td>
                    <td className={`py-3 px-2 text-center font-semibold ${i < 3 ? 'border-r' : ''}`}>
                      {club.players[i] ? calculateTotal(club.players[i]) : ''}
                    </td>
                  </Fragment>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
