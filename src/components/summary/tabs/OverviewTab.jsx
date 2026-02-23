import { useState, useRef, useEffect, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { useRanking } from '../../../hooks/useRanking';
import DetailScoreModal from '../../score/DetailScoreModal';

export default function OverviewTab({ tournament }) {
  const is36Hole = (tournament.holeCount || 36) === 36;
  const [sortBy, setSortBy] = useState('rank');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [detailModalPlayer, setDetailModalPlayer] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const sortMenuRef = useRef(null);
  const tableRef = useRef(null);
  const { sortedPlayers: allSortedPlayers } = useRanking(tournament.players, sortBy, true);
  // 18홀일 때 C/D 코스 선수 행 숨김
  const sortedPlayers = is36Hole
    ? allSortedPlayers
    : allSortedPlayers.filter(p => p.course.startsWith('A') || p.course.startsWith('B'));

  const handleCaptureImage = useCallback(async () => {
    if (!tableRef.current || isCapturing) return;
    setIsCapturing(true);
    const tableElement = tableRef.current;
    const originalOverflow = tableElement.style.overflow;
    const originalWidth = tableElement.style.width;
    try {
      tableElement.style.overflow = 'visible';
      tableElement.style.width = 'auto';
      const canvas = await html2canvas(tableElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        windowWidth: tableElement.scrollWidth,
      });
      const sanitizedName = (tournament.name || '대회').replace(/[/\\?%*:|"<>]/g, '_');
      const link = document.createElement('a');
      link.download = `${sanitizedName}_전체현황.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('이미지 캡쳐 실패:', error);
      alert('이미지 캡쳐에 실패했습니다. 다시 시도해주세요.');
    } finally {
      tableElement.style.overflow = originalOverflow;
      tableElement.style.width = originalWidth;
      setIsCapturing(false);
    }
  }, [tournament.name, isCapturing]);

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
      <div className="flex justify-end mb-3 gap-2">
        <button
          onClick={handleCaptureImage}
          disabled={isCapturing}
          className={`px-4 py-2 rounded-lg font-bold text-base transition-colors flex items-center gap-1 shadow ${
            isCapturing
              ? 'bg-blue-400 text-white cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isCapturing ? '⏳ 다운로드 중...' : '📷 이미지 다운로드'}
        </button>
        <div className="relative" ref={sortMenuRef}>
          <button
            onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
            className="px-4 py-2 rounded-lg font-bold text-base transition-colors bg-green-600 text-white hover:bg-green-700 flex items-center gap-1 shadow"
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
      <div ref={tableRef} className="bg-white rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2">
              <th className="bg-gray-300 py-3 px-2 text-center border-r">조</th>
              <th className="bg-gray-300 py-3 px-2 text-center border-r">코스</th>
              <th className="bg-gray-300 py-3 px-3 text-center border-r min-w-[50px]">성명</th>
              <th className="bg-gray-300 py-3 px-2 text-center border-r min-w-[50px]">성별</th>
              <th className="bg-gray-300 py-3 px-3 text-center border-r min-w-[80px]">클럽</th>
              <th className="bg-sky-200 py-3 px-2 text-center border-r">A코스</th>
              <th className="bg-sky-200 py-3 px-2 text-center border-r">B코스</th>
              <th className="bg-sky-300 py-3 px-2 text-center border-r">A+B</th>
              {is36Hole && (
                <>
                  <th className="bg-lime-200 py-3 px-2 text-center border-r">C코스</th>
                  <th className="bg-lime-200 py-3 px-2 text-center border-r">D코스</th>
                  <th className="bg-lime-300 py-3 px-2 text-center border-r">C+D</th>
                </>
              )}
              <th className="bg-yellow-200 py-3 px-2 text-center border-r">{is36Hole ? '36홀 합계' : '18홀 합계'}</th>
              <th className="bg-gray-300 py-3 px-2 text-center min-w-[60px]">순위</th>
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map((player, index) => (
              <tr
                key={player.id}
                className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              >
                <td className="py-2 px-2 text-center border-r font-medium">{player.group}</td>
                <td className="py-2 px-2 text-center border-r">{player.course}</td>
                <td className="py-2 px-3 border-r font-medium">{player.name || '-'}</td>
                <td className="py-2 px-2 text-center border-r">{player.gender || '-'}</td>
                <td className="py-2 px-3 border-r">{player.club || '-'}</td>
                <td className="py-2 px-2 text-center border-r">{player.scoreA ?? '-'}</td>
                <td className="py-2 px-2 text-center border-r">{player.scoreB ?? '-'}</td>
                <td className="py-2 px-2 text-center border-r font-semibold bg-sky-50">{player.ab ?? '-'}</td>
                {is36Hole && (
                  <>
                    <td className="py-2 px-2 text-center border-r">{player.scoreC ?? '-'}</td>
                    <td className="py-2 px-2 text-center border-r">{player.scoreD ?? '-'}</td>
                    <td className="py-2 px-2 text-center border-r font-semibold bg-lime-50">{player.cd ?? '-'}</td>
                  </>
                )}
                <td className="py-2 px-2 text-center border-r font-bold bg-yellow-50 text-lg">{player.total ?? '-'}</td>
                <td className="py-2 px-2 text-center font-bold text-red-600 text-lg">
                  <div className="flex items-center justify-center gap-1">
                    <span>{player.rank ?? '-'}</span>
                    {player.detailScores && Object.keys(player.detailScores).length > 0 && (
                      <button
                        onClick={() => setDetailModalPlayer(player)}
                        className="ml-1 px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        title="상세 점수 보기"
                      >
                        상세
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
