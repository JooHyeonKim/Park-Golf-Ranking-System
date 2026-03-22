import { useState, useMemo } from 'react';
import { calculateRankings, calculateTotal } from '../../../utils/ranking';
import { useImageCapture } from '../../../hooks/useImageCapture';
import { useSinglePdfDownload } from '../../../hooks/useSinglePdfDownload';
import ImageDownloadButton from '../../common/ImageDownloadButton';
import PdfDownloadButton from '../../common/PdfDownloadButton';
import LoadingOverlay from '../../common/LoadingOverlay';

const RANKS = ['우승', '준우승', '3위', '4위', '5위'];

const INDIVIDUAL_TOP = 5;

export default function IndividualTab({ tournament, maleMaxRank = 10, femaleMaxRank = 10 }) {
  const clubLabel = tournament.clubType === 'affiliation' ? '소속' : '클럽';
  const [allowDuplicate, setAllowDuplicate] = useState(false);
  const { tableRef, isCapturing, handleCaptureImage } = useImageCapture(tournament.name, '개인전');
  const { isGenerating, handlePdfDownload } = useSinglePdfDownload(tableRef, tournament.name, '개인전');

  const { males, females, holeInOnePlayers, duplicateIds } = useMemo(() => {
    // 전체 순위 계산 (타수 오름차순, 동점 처리 포함)
    const ranked = calculateRankings(tournament.players);

    // 이름이 있고 점수가 있는 선수만 필터 후 성별 분리
    const withScores = ranked.filter(p => p.name && calculateTotal(p) !== null);

    const males = withScores.filter(p => p.gender === '남').slice(0, INDIVIDUAL_TOP);
    const females = withScores.filter(p => p.gender === '여').slice(0, INDIVIDUAL_TOP);

    // 개인전 + 장려상 수상자 ID Set
    const allMaleWinners = withScores.filter(p => p.gender === '남').slice(0, maleMaxRank);
    const allFemaleWinners = withScores.filter(p => p.gender === '여').slice(0, femaleMaxRank);
    const duplicateIds = new Set([
      ...allMaleWinners.map(p => p.id),
      ...allFemaleWinners.map(p => p.id),
    ]);

    // 홀인원 수상자
    const holeInOnePlayers = tournament.players.filter(p => p.holeInOne && p.name && p.name.trim());

    return { males, females, holeInOnePlayers, duplicateIds };
  }, [tournament.players, maleMaxRank, femaleMaxRank]);

  return (
    <div>
      {(isGenerating || isCapturing) && <LoadingOverlay message={isGenerating ? 'PDF 생성 중...' : '이미지 생성 중...'} />}
      <div className="flex justify-end mb-3 gap-2">
        <PdfDownloadButton isGenerating={isGenerating} onClick={handlePdfDownload} />
        <ImageDownloadButton isCapturing={isCapturing} onClick={handleCaptureImage} />
      </div>
      <div ref={tableRef} data-capture-id="개인전" className="bg-white rounded-lg shadow-sm overflow-x-auto">
        <h3 className="text-left font-bold text-base sm:text-2xl py-3 sm:py-5 bg-green-50">🏅 {tournament.name} - 개인전</h3>
        <table className="w-full text-sm sm:text-lg font-bold border-collapse">
          <thead className="text-base sm:text-xl">
            <tr className="border-b">
              <th colSpan={3} className="bg-blue-200 py-2 px-1 sm:py-3 sm:px-2 text-center border-r">
                남자
              </th>
              <th className="bg-gray-300 py-2 px-1 sm:py-3 sm:px-2 text-center border-r">
                순위
              </th>
              <th colSpan={3} className="bg-pink-200 py-2 px-1 sm:py-3 sm:px-2 text-center">
                여자
              </th>
            </tr>
            <tr className="border-b-2">
              <th className="bg-blue-100 py-1.5 px-1 sm:py-2 sm:px-3 text-center border-r min-w-[40px] sm:min-w-[80px]">{clubLabel}</th>
              <th className="bg-blue-100 py-1.5 px-1 sm:py-2 sm:px-3 text-center border-r min-w-[40px] sm:min-w-[80px]">성명</th>
              <th className="bg-blue-100 py-1.5 px-1 sm:py-2 sm:px-3 text-center border-r min-w-[35px] sm:min-w-[60px]">타수</th>
              <th className="bg-gray-200 py-1.5 px-1 sm:py-2 sm:px-3 text-center border-r min-w-[40px] sm:min-w-[70px]"></th>
              <th className="bg-pink-100 py-1.5 px-1 sm:py-2 sm:px-3 text-center border-r min-w-[40px] sm:min-w-[80px]">{clubLabel}</th>
              <th className="bg-pink-100 py-1.5 px-1 sm:py-2 sm:px-3 text-center border-r min-w-[40px] sm:min-w-[80px]">성명</th>
              <th className="bg-pink-100 py-1.5 px-1 sm:py-2 sm:px-3 text-center min-w-[35px] sm:min-w-[60px]">타수</th>
            </tr>
          </thead>
          <tbody>
            {RANKS.map((rankLabel, index) => {
              const male = males[index];
              const female = females[index];
              return (
                <tr
                  key={rankLabel}
                  className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  <td className="py-2 px-1 sm:py-3 sm:px-3 text-center border-r">
                    {male?.club || ''}
                  </td>
                  <td className="py-2 px-1 sm:py-3 sm:px-3 text-center border-r">
                    {male?.name || ''}
                  </td>
                  <td className="py-2 px-1 sm:py-3 sm:px-3 text-center border-r text-base sm:text-xl text-red-600">
                    {male ? calculateTotal(male) : ''}
                  </td>
                  <td className="py-2 px-1 sm:py-3 sm:px-3 text-center border-r font-bold text-gray-700 bg-gray-100">
                    {rankLabel}
                  </td>
                  <td className="py-2 px-1 sm:py-3 sm:px-3 text-center border-r">
                    {female?.club || ''}
                  </td>
                  <td className="py-2 px-1 sm:py-3 sm:px-3 text-center border-r">
                    {female?.name || ''}
                  </td>
                  <td className="py-2 px-1 sm:py-3 sm:px-3 text-center text-base sm:text-xl text-red-600">
                    {female ? calculateTotal(female) : ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* 홀인원 수상자 */}
        {holeInOnePlayers.length > 0 && (
        <div className="mt-8 sm:mt-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 px-2 py-2 sm:px-4 sm:py-5 bg-green-50">
            <h3 className="text-left font-bold text-sm sm:text-2xl">🎯 홀인원 수상자</h3>
            <div className="inline-flex rounded-lg overflow-hidden border border-gray-300 self-center sm:self-auto">
              <button
                onClick={() => setAllowDuplicate(false)}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium transition-colors ${
                  !allowDuplicate
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                중복수상 제외
              </button>
              <button
                onClick={() => setAllowDuplicate(true)}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium transition-colors ${
                  allowDuplicate
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                중복수상 허용
              </button>
            </div>
          </div>
          <table className="w-full text-sm sm:text-lg font-bold border-collapse">
            <thead className="text-base sm:text-xl">
              <tr className="border-b-2">
                <th className="bg-orange-200 py-1.5 px-1 sm:py-2 sm:px-3 text-center border-r min-w-[30px] sm:min-w-[50px]">번호</th>
                <th className="bg-orange-200 py-1.5 px-1 sm:py-2 sm:px-3 text-center border-r min-w-[40px] sm:min-w-[80px]">{clubLabel}</th>
                <th className="bg-orange-200 py-1.5 px-1 sm:py-2 sm:px-3 text-center border-r min-w-[40px] sm:min-w-[80px]">성명</th>
                <th className="bg-orange-200 py-1.5 px-1 sm:py-2 sm:px-3 text-center border-r min-w-[30px] sm:min-w-[50px]">성별</th>
                <th className="bg-orange-200 py-1.5 px-1 sm:py-2 sm:px-3 text-center min-w-[40px] sm:min-w-[60px]">홀 번호</th>
              </tr>
            </thead>
            <tbody>
              {holeInOnePlayers.map((player, index) => (
                <tr key={player.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="py-2 px-1 sm:py-3 sm:px-3 text-center border-r">{index + 1}</td>
                  <td className="py-2 px-1 sm:py-3 sm:px-3 text-center border-r">{player.club}</td>
                  <td className="py-2 px-1 sm:py-3 sm:px-3 text-center border-r">{player.name}</td>
                  <td className="py-2 px-1 sm:py-3 sm:px-3 text-center border-r">{player.gender}</td>
                  <td className="py-2 px-1 sm:py-3 sm:px-3 text-center">
                    {!allowDuplicate && duplicateIds.has(player.id)
                      ? <span className="text-red-600 font-bold">{player.holeInOne === true ? '-' : player.holeInOne}(중복수상 불가)</span>
                      : (player.holeInOne === true ? '-' : player.holeInOne)
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
}
