import { useState, useMemo, useRef, useEffect } from 'react';
import { calculateRankings, calculateTotal } from '../../../utils/ranking';
import { useImageCapture } from '../../../hooks/useImageCapture';
import { useSinglePdfDownload } from '../../../hooks/useSinglePdfDownload';
import ImageDownloadButton from '../../common/ImageDownloadButton';
import PdfDownloadButton from '../../common/PdfDownloadButton';

const DEFAULT_MAX_RANK = 10;
const RANK_OPTIONS = [10, 11, 12, 13, 14, 15];
const INDIVIDUAL_TOP = 5; // 개인전 탭에서 이미 표시한 상위 인원 수

export default function EncouragementTab({ tournament }) {
  const [maxRank, setMaxRank] = useState(DEFAULT_MAX_RANK);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { tableRef, isCapturing, handleCaptureImage } = useImageCapture(tournament.name, '장려상');
  const { isGenerating, handlePdfDownload } = useSinglePdfDownload(tableRef, tournament.name, '장려상');

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const { males, females, rankLabels } = useMemo(() => {
    const ranked = calculateRankings(tournament.players);
    const withScores = ranked.filter(p => p.name && calculateTotal(p) !== null);

    const displayCount = maxRank - INDIVIDUAL_TOP;

    const males = withScores
      .filter(p => p.gender === '남')
      .slice(INDIVIDUAL_TOP, INDIVIDUAL_TOP + displayCount);

    const females = withScores
      .filter(p => p.gender === '여')
      .slice(INDIVIDUAL_TOP, INDIVIDUAL_TOP + displayCount);

    const rankLabels = Array.from(
      { length: displayCount },
      (_, i) => `${INDIVIDUAL_TOP + 1 + i}위`
    );

    return { males, females, rankLabels };
  }, [tournament.players, maxRank]);

  return (
    <div>
      {/* 순위 범위 선택 드롭다운 */}
      <div className="flex justify-end mb-3 gap-2">
        <PdfDownloadButton isGenerating={isGenerating} onClick={handlePdfDownload} />
        <ImageDownloadButton isCapturing={isCapturing} onClick={handleCaptureImage} />
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="px-4 py-2 rounded-lg font-bold text-base transition-colors bg-green-600 text-white hover:bg-green-700 flex items-center gap-1 shadow"
          >
            {maxRank}위까지
            <span className="text-xs">▼</span>
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[120px]">
              {RANK_OPTIONS.map((option, idx) => (
                <button
                  key={option}
                  onClick={() => {
                    setMaxRank(option);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${
                    idx === 0 ? 'rounded-t-lg' : ''
                  } ${
                    idx === RANK_OPTIONS.length - 1 ? 'rounded-b-lg' : ''
                  } ${
                    maxRank === option
                      ? 'bg-green-50 font-semibold text-green-700'
                      : 'text-gray-700'
                  }`}
                >
                  {option}위까지
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 장려상 테이블 */}
      <div ref={tableRef} data-capture-id="장려상" className="bg-white rounded-lg shadow-sm overflow-x-auto">
        <h3 className="text-center font-bold text-2xl py-5 bg-white">🎖️ {tournament.name} - 장려상</h3>
        <table className="w-full text-sm border-collapse">
          <thead>
            {/* 첫번째 줄: 남자 / 순위 / 여자 */}
            <tr className="border-b">
              <th colSpan={2} className="bg-blue-200 py-3 px-2 text-center border-r text-base font-bold">
                남자
              </th>
              <th className="bg-gray-300 py-3 px-2 text-center border-r text-base font-bold">
                순위
              </th>
              <th colSpan={2} className="bg-pink-200 py-3 px-2 text-center text-base font-bold">
                여자
              </th>
            </tr>
            {/* 두번째 줄: 성명, 타수 / (빈칸) / 성명, 타수 */}
            <tr className="border-b-2">
              <th className="bg-blue-100 py-2 px-3 text-center border-r min-w-[80px]">성명</th>
              <th className="bg-blue-100 py-2 px-3 text-center border-r min-w-[60px]">타수</th>
              <th className="bg-gray-200 py-2 px-3 text-center border-r min-w-[70px]"></th>
              <th className="bg-pink-100 py-2 px-3 text-center border-r min-w-[80px]">성명</th>
              <th className="bg-pink-100 py-2 px-3 text-center min-w-[60px]">타수</th>
            </tr>
          </thead>
          <tbody>
            {rankLabels.map((rankLabel, index) => {
              const male = males[index];
              const female = females[index];
              return (
                <tr
                  key={rankLabel}
                  className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  <td className="py-3 px-3 text-center border-r font-medium">
                    {male?.name || ''}
                  </td>
                  <td className="py-3 px-3 text-center border-r font-semibold">
                    {male ? calculateTotal(male) : ''}
                  </td>
                  <td className="py-3 px-3 text-center border-r font-bold text-gray-700 bg-gray-100">
                    {rankLabel}
                  </td>
                  <td className="py-3 px-3 text-center border-r font-medium">
                    {female?.name || ''}
                  </td>
                  <td className="py-3 px-3 text-center font-semibold">
                    {female ? calculateTotal(female) : ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
