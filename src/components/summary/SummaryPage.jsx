import { useState } from 'react';
import { usePdfDownload } from '../../hooks/usePdfDownload';
import OverviewTab from './tabs/OverviewTab';
import IndividualTab from './tabs/IndividualTab';
import EncouragementTab from './tabs/EncouragementTab';
import TeamTab from './tabs/TeamTab';

export default function SummaryPage({ tournament, onBack }) {
  const [activeTab, setActiveTab] = useState('overview');
  const { isGenerating, handlePdfDownload } = usePdfDownload(tournament.name);

  const tabs = [
    { id: 'overview', label: '전체 현황' },
    { id: 'individual', label: '개인전' },
    { id: 'encouragement', label: '장려상' },
    { id: 'team', label: '단체전' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 pb-4">
      {/* 헤더 */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-full mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={onBack}
              className="text-gray-700 hover:text-gray-900 font-bold text-lg"
            >
              ← 점수 입력
            </button>
            <button
              onClick={handlePdfDownload}
              disabled={isGenerating}
              className={`px-4 py-2 rounded-lg font-bold text-base transition-colors flex items-center gap-1 shadow ${
                isGenerating
                  ? 'bg-red-400 text-white cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {isGenerating ? '⏳ PDF 생성 중...' : '📄 PDF 전체 다운로드'}
            </button>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">{tournament.name} - 집계</h2>
            <p className="text-sm text-gray-500">{tournament.date}</p>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex border-t border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-6 py-3 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 탭 컨텐츠 - 모든 탭 렌더링, 비활성 탭 숨김 (PDF 캡쳐용) */}
      <div className="px-4 pt-4">
        <div style={{ display: activeTab === 'overview' ? 'block' : 'none' }}>
          <OverviewTab tournament={tournament} />
        </div>
        <div style={{ display: activeTab === 'individual' ? 'block' : 'none' }}>
          <IndividualTab tournament={tournament} />
        </div>
        <div style={{ display: activeTab === 'encouragement' ? 'block' : 'none' }}>
          <EncouragementTab tournament={tournament} />
        </div>
        <div style={{ display: activeTab === 'team' ? 'block' : 'none' }}>
          <TeamTab tournament={tournament} />
        </div>
      </div>
    </div>
  );
}
