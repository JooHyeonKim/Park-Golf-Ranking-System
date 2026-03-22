import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useRanking } from '../../../hooks/useRanking';
import { calculateRankings } from '../../../utils/ranking';
import { useImageCapture } from '../../../hooks/useImageCapture';
import { useSinglePdfDownload } from '../../../hooks/useSinglePdfDownload';
import ImageDownloadButton from '../../common/ImageDownloadButton';
import PdfDownloadButton from '../../common/PdfDownloadButton';
import DetailScoreModal from '../../score/DetailScoreModal';

export default function OverviewTab({ tournament }) {
  const is36Hole = (tournament.holeCount || 36) === 36;
  const clubLabel = tournament.clubType === 'affiliation' ? '소속' : '클럽';
  const [sortBy, setSortBy] = useState('rank');
  const [genderFilter, setGenderFilter] = useState('all');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [detailModalPlayer, setDetailModalPlayer] = useState(null);
  const sortMenuRef = useRef(null);
  const { tableRef, isCapturing, handleCaptureImage } = useImageCapture(tournament.name, '전체현황', 24);
  const { isGenerating, handlePdfDownload } = useSinglePdfDownload(tableRef, tournament.name, '전체현황', 24);
  const { sortedPlayers: allSortedPlayers } = useRanking(tournament.players, sortBy, true);
  // 18홀일 때 C/D 코스 선수 행 숨김
  const sortedPlayers = is36Hole
    ? allSortedPlayers
    : allSortedPlayers.filter(p => p.course.startsWith('A') || p.course.startsWith('B'));

  // 성별 필터 적용 + 순위 재계산 (A/B/C/D + 상세점수 동점 처리 포함)
  const displayPlayers = useMemo(() => {
    if (genderFilter === 'all') return sortedPlayers;
    const filteredPlayers = sortedPlayers.filter(p => p.gender === genderFilter);
    // calculateRankings으로 순위 재계산 (comparePlayers 로직 동일 적용)
    const reranked = calculateRankings(filteredPlayers);
    // 기존 정렬(조별 등) 유지하면서 순위만 매핑
    const rankMap = new Map(reranked.map(p => [p.id, p.rank]));
    return filteredPlayers.map(p => ({ ...p, rank: rankMap.get(p.id) ?? null }));
  }, [sortedPlayers, genderFilter]);

  // PDF/이미지 다운로드 시 전체 모드로 캡처
  const handlePdfDownloadAll = useCallback(async () => {
    const prev = genderFilter;
    setGenderFilter('all');
    await new Promise(r => setTimeout(r, 100));
    await handlePdfDownload();
    setGenderFilter(prev);
  }, [genderFilter, handlePdfDownload]);

  const handleCaptureImageAll = useCallback(async () => {
    const prev = genderFilter;
    setGenderFilter('all');
    await new Promise(r => setTimeout(r, 100));
    await handleCaptureImage();
    setGenderFilter(prev);
  }, [genderFilter, handleCaptureImage]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
        setIsSortMenuOpen(false);
      }
    };

    if (isSortMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSortMenuOpen]);

  return (
    <div>
      {/* 정렬 버튼 */}
      <div className="flex flex-wrap justify-end mb-2 sm:mb-3 gap-1 sm:gap-2">
        <PdfDownloadButton isGenerating={isGenerating} onClick={handlePdfDownloadAll} />
        <ImageDownloadButton isCapturing={isCapturing} onClick={handleCaptureImageAll} />
        <div className="relative" ref={sortMenuRef}>
          <button
            onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
            className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-bold text-sm sm:text-base transition-colors bg-green-600 text-white hover:bg-green-700 flex items-center gap-1 shadow"
          >
            정렬: {sortBy === 'rank' ? '순위' : '조'}
            <span className="text-xs">▼</span>
          </button>
          {isSortMenuOpen && (
            <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[120px]">
              <button
                onClick={() => {
                  setSortBy('rank');
                  setIsSortMenuOpen(false);
                }}
                className={`w-full px-4 py-2 text-left hover:bg-gray-100 rounded-t-lg ${
                  sortBy === 'rank' ? 'bg-green-50 font-semibold text-green-700' : 'text-gray-700'
                }`}
              >
                순위
              </button>
              <button
                onClick={() => {
                  setSortBy('group');
                  setIsSortMenuOpen(false);
                }}
                className={`w-full px-4 py-2 text-left hover:bg-gray-100 rounded-b-lg ${
                  sortBy === 'group' ? 'bg-green-50 font-semibold text-green-700' : 'text-gray-700'
                }`}
              >
                조
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 테이블 */}
      <div ref={tableRef} data-capture-id="전체현황" className="bg-white rounded-lg shadow-sm overflow-x-auto">
       <div className="inline-block min-w-full">
        <div className="relative flex items-center justify-end px-2 py-3 sm:px-4 sm:py-5 bg-green-50">
          <h3 className="absolute left-0 right-0 text-center font-bold text-base sm:text-2xl pointer-events-none">🏆 {tournament.name} - 전체 현황</h3>
          <div className="inline-flex rounded-lg overflow-hidden border border-gray-300">
            {[{ value: 'all', label: '전체' }, { value: '남', label: '남' }, { value: '여', label: '여' }].map(opt => (
              <button
                key={opt.value}
                onClick={() => setGenderFilter(opt.value)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  genderFilter === opt.value
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <table className="w-full text-sm sm:text-lg font-bold border-collapse whitespace-nowrap">
          <thead className="text-base sm:text-xl">
            <tr className="border-b-2">
              <th className="bg-gray-300 py-2 px-1 sm:py-3 sm:px-2 text-center border-r min-w-[40px] sm:min-w-[60px]">순위</th>
              <th className="bg-gray-300 py-2 px-1 sm:py-3 sm:px-2 text-center border-r">조</th>
              <th className="bg-gray-300 py-2 px-1 sm:py-3 sm:px-2 text-center border-r">코스</th>
              <th className="bg-gray-300 py-2 px-1 sm:py-3 sm:px-3 text-center border-r min-w-[50px] sm:min-w-[80px]">{clubLabel}</th>
              <th className="bg-gray-300 py-2 px-1 sm:py-3 sm:px-3 text-center border-r min-w-[40px] sm:min-w-[50px]">성명</th>
              <th className="bg-gray-300 py-2 px-1 sm:py-3 sm:px-2 text-center border-r min-w-[30px] sm:min-w-[50px]">성별</th>
              <th className="bg-yellow-200 py-2 px-1 sm:py-3 sm:px-2 text-center border-r whitespace-nowrap">{is36Hole ? '36홀 합계' : '18홀 합계'}</th>
              <th className="bg-sky-200 py-2 px-1 sm:py-3 sm:px-2 text-center border-r">A코스</th>
              <th className="bg-sky-200 py-2 px-1 sm:py-3 sm:px-2 text-center border-r">B코스</th>
              <th className="bg-sky-300 py-2 px-1 sm:py-3 sm:px-2 text-center border-r">총계</th>
              {is36Hole && (
                <>
                  <th className="bg-lime-200 py-2 px-1 sm:py-3 sm:px-2 text-center border-r">C코스</th>
                  <th className="bg-lime-200 py-2 px-1 sm:py-3 sm:px-2 text-center border-r">D코스</th>
                  <th className="bg-lime-300 py-2 px-1 sm:py-3 sm:px-2 text-center border-r">총계</th>
                </>
              )}
              <th className="bg-orange-200 py-2 px-1 sm:py-3 sm:px-2 text-center border-r w-10 sm:w-16">홀인원</th>
            </tr>
          </thead>
          <tbody>
            {displayPlayers.map((player, index) => (
              <tr
                key={player.id}
                className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              >
                <td className="py-1 px-1 sm:py-2 sm:px-2 text-center border-r font-bold text-red-600 text-sm sm:text-lg">
                  <div className="flex items-center justify-center gap-1">
                    <span>{player.rank ?? '-'}</span>
                    {player.detailScores && Object.keys(player.detailScores).length > 0 && (
                      <button
                        onClick={() => setDetailModalPlayer(player)}
                        className="ml-1 px-1 py-0.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        title="상세 점수 보기"
                      >
                        상세
                      </button>
                    )}
                  </div>
                </td>
                <td className="py-1 px-1 sm:py-2 sm:px-2 text-center border-r">{player.course.split('-').length >= 3 ? `${player.group}-${player.course.split('-')[2]}` : player.group}</td>
                <td className="py-1 px-1 sm:py-2 sm:px-2 text-center border-r">{player.course}</td>
                <td className="py-1 px-1 sm:py-2 sm:px-3 border-r">{player.club || '-'}</td>
                <td className="py-1 px-1 sm:py-2 sm:px-3 border-r">{player.name || '-'}</td>
                <td className="py-1 px-1 sm:py-2 sm:px-2 text-center border-r">{player.gender || '-'}</td>
                <td className="py-1 px-1 sm:py-2 sm:px-2 text-center border-r font-bold bg-yellow-50 text-base sm:text-xl text-red-600">{player.total ?? '-'}</td>
                <td className="py-1 px-1 sm:py-2 sm:px-2 text-center border-r">{player.scoreA ?? '-'}</td>
                <td className="py-1 px-1 sm:py-2 sm:px-2 text-center border-r">{player.scoreB ?? '-'}</td>
                <td className="py-1 px-1 sm:py-2 sm:px-2 text-center border-r font-bold bg-sky-50">{(player.scoreA != null && player.scoreB != null) ? player.scoreA + player.scoreB : '-'}</td>
                {is36Hole && (
                  <>
                    <td className="py-1 px-1 sm:py-2 sm:px-2 text-center border-r">{player.scoreC ?? '-'}</td>
                    <td className="py-1 px-1 sm:py-2 sm:px-2 text-center border-r">{player.scoreD ?? '-'}</td>
                    <td className="py-1 px-1 sm:py-2 sm:px-2 text-center border-r font-bold bg-lime-50">{(player.scoreC != null && player.scoreD != null) ? player.scoreC + player.scoreD : '-'}</td>
                  </>
                )}
                <td className="py-1 px-1 sm:py-2 sm:px-2 text-center border-r w-10 sm:w-16">
                  {player.holeInOne ? (
                    <span className="relative group cursor-pointer">
                      ⛳
                      {player.holeInOne !== true && (
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          {player.holeInOne}
                        </span>
                      )}
                    </span>
                  ) : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
       </div>
      </div>

      {/* 상세 점수 보기 모달 */}
      {detailModalPlayer && (
        <DetailScoreModal
          player={detailModalPlayer}
          is36Hole={is36Hole}
          readOnly
          onClose={() => setDetailModalPlayer(null)}
        />
      )}
    </div>
  );
}
