import { useState, useMemo } from 'react';
import { calculateRankings, calculateTotal } from '../../../utils/ranking';
import { useImageCapture } from '../../../hooks/useImageCapture';
import { useSinglePdfDownload } from '../../../hooks/useSinglePdfDownload';
import ImageDownloadButton from '../../common/ImageDownloadButton';
import PdfDownloadButton from '../../common/PdfDownloadButton';

const DEFAULT_MAX_RANK = 10;
const RANK_OPTIONS = [9, 10, 11, 12, 13, 14, 15];
const INDIVIDUAL_TOP = 5; // 개인전 탭에서 이미 표시한 상위 인원 수

export default function EncouragementTab({ tournament }) {
  const [maleMaxRank, setMaleMaxRank] = useState(DEFAULT_MAX_RANK);
  const [femaleMaxRank, setFemaleMaxRank] = useState(DEFAULT_MAX_RANK);
  const { tableRef, isCapturing, handleCaptureImage } = useImageCapture(tournament.name, '장려상');
  const { isGenerating, handlePdfDownload } = useSinglePdfDownload(tableRef, tournament.name, '장려상');

  const { males, females, maxDisplayCount } = useMemo(() => {
    const ranked = calculateRankings(tournament.players);
    const withScores = ranked.filter(p => p.name && calculateTotal(p) !== null);

    const maleDisplayCount = maleMaxRank - INDIVIDUAL_TOP;
    const femaleDisplayCount = femaleMaxRank - INDIVIDUAL_TOP;

    const males = withScores
      .filter(p => p.gender === '남')
      .slice(INDIVIDUAL_TOP, INDIVIDUAL_TOP + maleDisplayCount);

    const females = withScores
      .filter(p => p.gender === '여')
      .slice(INDIVIDUAL_TOP, INDIVIDUAL_TOP + femaleDisplayCount);

    const maxDisplayCount = Math.max(maleDisplayCount, femaleDisplayCount);

    return { males, females, maxDisplayCount };
  }, [tournament.players, maleMaxRank, femaleMaxRank]);

  const maleDisplayCount = maleMaxRank - INDIVIDUAL_TOP;
  const femaleDisplayCount = femaleMaxRank - INDIVIDUAL_TOP;

  return (
    <div>
      {/* 다운로드 버튼 */}
      <div className="flex justify-end mb-2 gap-2">
        <PdfDownloadButton isGenerating={isGenerating} onClick={handlePdfDownload} />
        <ImageDownloadButton isCapturing={isCapturing} onClick={handleCaptureImage} />
      </div>

      {/* 장려상 테이블 */}
      <div ref={tableRef} data-capture-id="장려상" className="bg-white rounded-lg shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between px-4 py-5 bg-green-50">
          <div></div>
          <h3 className="font-bold text-2xl">🎖️ {tournament.name} - 장려상</h3>
          <div className="flex gap-3">
            <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1.5">
              <span className="text-sm font-bold text-blue-700">남</span>
              <select
                value={maleMaxRank}
                onChange={(e) => setMaleMaxRank(parseInt(e.target.value, 10))}
                className="px-1.5 py-1 border border-blue-300 rounded text-sm font-medium bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {RANK_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}위</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1.5 bg-pink-50 border border-pink-200 rounded-lg px-2.5 py-1.5">
              <span className="text-sm font-bold text-pink-700">여</span>
              <select
                value={femaleMaxRank}
                onChange={(e) => setFemaleMaxRank(parseInt(e.target.value, 10))}
                className="px-1.5 py-1 border border-pink-300 rounded text-sm font-medium bg-white focus:outline-none focus:ring-1 focus:ring-pink-500"
              >
                {RANK_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}위</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <table className="w-full text-sm border-collapse">
          <thead>
            {/* 첫번째 줄: 남자 / 순위 / 여자 */}
            <tr className="border-b">
              <th colSpan={3} className="bg-blue-200 py-3 px-2 text-center border-r text-base font-bold">
                남자
              </th>
              <th className="bg-gray-300 py-3 px-2 text-center border-r text-base font-bold">
                순위
              </th>
              <th colSpan={3} className="bg-pink-200 py-3 px-2 text-center text-base font-bold">
                여자
              </th>
            </tr>
            {/* 두번째 줄 */}
            <tr className="border-b-2">
              <th className="bg-blue-100 py-2 px-3 text-center border-r min-w-[80px]">클럽</th>
              <th className="bg-blue-100 py-2 px-3 text-center border-r min-w-[80px]">성명</th>
              <th className="bg-blue-100 py-2 px-3 text-center border-r min-w-[60px]">타수</th>
              <th className="bg-gray-200 py-2 px-3 text-center border-r min-w-[70px]"></th>
              <th className="bg-pink-100 py-2 px-3 text-center border-r min-w-[80px]">클럽</th>
              <th className="bg-pink-100 py-2 px-3 text-center border-r min-w-[80px]">성명</th>
              <th className="bg-pink-100 py-2 px-3 text-center min-w-[60px]">타수</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: maxDisplayCount }, (_, index) => {
              const rankNumber = INDIVIDUAL_TOP + 1 + index;
              const male = index < maleDisplayCount ? males[index] : null;
              const female = index < femaleDisplayCount ? females[index] : null;
              const showMale = index < maleDisplayCount;
              const showFemale = index < femaleDisplayCount;
              return (
                <tr
                  key={rankNumber}
                  className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  <td className="py-3 px-3 text-center border-r">
                    {showMale ? (male?.club || '') : ''}
                  </td>
                  <td className="py-3 px-3 text-center border-r font-medium">
                    {showMale ? (male?.name || '') : ''}
                  </td>
                  <td className="py-3 px-3 text-center border-r font-semibold">
                    {showMale && male ? calculateTotal(male) : ''}
                  </td>
                  <td className="py-3 px-3 text-center border-r font-bold text-gray-700 bg-gray-100">
                    {rankNumber}위
                  </td>
                  <td className="py-3 px-3 text-center border-r">
                    {showFemale ? (female?.club || '') : ''}
                  </td>
                  <td className="py-3 px-3 text-center border-r font-medium">
                    {showFemale ? (female?.name || '') : ''}
                  </td>
                  <td className="py-3 px-3 text-center font-semibold">
                    {showFemale && female ? calculateTotal(female) : ''}
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
