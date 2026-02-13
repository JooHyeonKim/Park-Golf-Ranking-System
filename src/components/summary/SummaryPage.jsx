import { useState } from 'react';
import OverviewTab from './tabs/OverviewTab';
import IndividualTab from './tabs/IndividualTab';
import EncouragementTab from './tabs/EncouragementTab';

export default function SummaryPage({ tournament, onBack }) {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: '전체 현황' },
    { id: 'individual', label: '개인전' },
    { id: 'encouragement', label: '장려상' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab tournament={tournament} />;
      case 'individual':
        return <IndividualTab tournament={tournament} />;
      case 'encouragement':
        return <EncouragementTab tournament={tournament} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 pb-4">
      {/* 헤더 */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-full mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={onBack}
              className="text-gray-600 hover:text-gray-800 font-medium"
            >
              ← 점수 입력
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

      {/* 탭 컨텐츠 */}
      <div className="px-4 pt-4">
        {renderTabContent()}
      </div>
    </div>
  );
}
