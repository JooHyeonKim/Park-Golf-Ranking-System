import { useState, useMemo, Fragment } from 'react';
import { calculateRankings, calculateTotal } from '../../../utils/ranking';
import { useImageCapture } from '../../../hooks/useImageCapture';
import { useSinglePdfDownload } from '../../../hooks/useSinglePdfDownload';
import ImageDownloadButton from '../../common/ImageDownloadButton';
import PdfDownloadButton from '../../common/PdfDownloadButton';
import LoadingOverlay from '../../common/LoadingOverlay';

const INDIVIDUAL_TOP = 5;

export default function TeamTab({ tournament }) {
  const clubLabel = tournament.clubType === 'affiliation' ? '소속' : '클럽';
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
        <p className="text-sm text-gray-400 mt-2">{clubLabel}이(가) 등록된 선수가 없습니다</p>
      </div>
    );
  }

  return (
    <div>
      {(isGenerating || isCapturing) && <LoadingOverlay message={isGenerating ? 'PDF 생성 중...' : '이미지 생성 중...'} />}
      <div className="flex justify-end mb-2 gap-2">
        <PdfDownloadButton isGenerating={isGenerating} onClick={handlePdfDownload} />
        <ImageDownloadButton isCapturing={isCapturing} onClick={handleCaptureImage} />
      </div>
      <div ref={tableRef} data-capture-id="단체전" className="bg-white rounded-lg shadow-sm overflow-x-auto">
       <div className="inline-block min-w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 px-2 py-2 sm:px-4 sm:py-5 bg-green-50">
          <h3 className="text-left font-bold text-sm sm:text-2xl">👥 {tournament.name} - 단체전</h3>
          <div className="inline-flex rounded-lg overflow-hidden border border-gray-300 self-center sm:self-auto">
            <button
              onClick={() => setExcludeTop(false)}
              className={`px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium transition-colors ${
                !excludeTop
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              전체 포함
            </button>
            <button
              onClick={() => setExcludeTop(true)}
              className={`px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium transition-colors ${
                excludeTop
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              수상자 제외
            </button>
          </div>
        </div>
        <table className="w-full text-sm sm:text-lg font-bold border-collapse whitespace-nowrap">
          <thead className="text-base sm:text-xl">
            <tr className="border-b">
              <th rowSpan={2} className="bg-gray-200 py-2 px-1 sm:py-3 sm:px-2 text-center border-r min-w-[35px] sm:min-w-[50px]">
                순위
              </th>
              <th rowSpan={2} className="bg-gray-200 py-2 px-1 sm:py-3 sm:px-2 text-center border-r min-w-[50px] sm:min-w-[80px]">
                {clubLabel}명
              </th>
              <th rowSpan={2} className="bg-yellow-200 py-2 px-1 sm:py-3 sm:px-2 text-center border-r min-w-[40px] sm:min-w-[60px]">
                합계
              </th>
              {[1, 2, 3, 4].map(n => (
                <th key={n} colSpan={2} className="bg-green-200 py-2 px-1 sm:py-3 sm:px-2 text-center border-r last:border-r-0 min-w-[70px] sm:min-w-[120px]">
                  {n}
                </th>
              ))}
            </tr>
            <tr className="border-b-2">
              {[1, 2, 3, 4].map(n => (
                <Fragment key={n}>
                  <th className="bg-green-100 py-1.5 px-1 sm:py-2 sm:px-2 text-center border-r min-w-[35px] sm:min-w-[60px]">성명</th>
                  <th className={`bg-green-100 py-1.5 px-1 sm:py-2 sm:px-2 text-center min-w-[30px] sm:min-w-[50px] ${n < 4 ? 'border-r' : ''}`}>타수</th>
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {teamRankings.flatMap((club, index) => {
              const nextClub = teamRankings[index + 1];
              const showDivider = club.rank <= 5 && nextClub && nextClub.rank > 5;
              return [
              <tr key={club.clubName} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="py-2 px-1 sm:py-3 sm:px-2 text-center border-r font-bold text-gray-700">
                  {club.rank}
                </td>
                <td className="py-2 px-1 sm:py-3 sm:px-2 text-center border-r">
                  {club.clubName}
                </td>
                <td className="py-2 px-1 sm:py-3 sm:px-2 text-center border-r font-bold text-red-600 bg-yellow-50 text-base sm:text-xl">
                  {club.total}
                </td>
                {[0, 1, 2, 3].map(i => (
                  <Fragment key={i}>
                    <td className="py-2 px-1 sm:py-3 sm:px-2 text-center border-r">
                      {club.players[i]?.name || ''}
                    </td>
                    <td className={`py-2 px-1 sm:py-3 sm:px-2 text-center text-base sm:text-xl text-blue-600 ${i < 3 ? 'border-r' : ''}`}>
                      {club.players[i] ? calculateTotal(club.players[i]) : ''}
                    </td>
                  </Fragment>
                ))}
              </tr>,
              showDivider && (
                <tr key="divider">
                  <td colSpan={11} className="border-b-[4px] border-[#7ba882] p-0"></td>
                </tr>
              )
              ];
            })}
          </tbody>
        </table>
       </div>
      </div>
    </div>
  );
}
