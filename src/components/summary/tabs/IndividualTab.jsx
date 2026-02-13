import { useMemo } from 'react';
import { calculateRankings, calculateTotal } from '../../../utils/ranking';

const RANKS = ['우승', '준우승', '3위', '4위', '5위'];

export default function IndividualTab({ tournament }) {
  const { males, females } = useMemo(() => {
    // 전체 순위 계산 (타수 오름차순, 동점 처리 포함)
    const ranked = calculateRankings(tournament.players);

    // 이름이 있고 점수가 있는 선수만 필터 후 성별 분리
    const withScores = ranked.filter(p => p.name && calculateTotal(p) !== null);

    const males = withScores.filter(p => p.gender === '남').slice(0, 5);
    const females = withScores.filter(p => p.gender === '여').slice(0, 5);

    return { males, females };
  }, [tournament.players]);

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
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
          {RANKS.map((rankLabel, index) => {
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
  );
}
