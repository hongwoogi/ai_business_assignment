import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import FilterAccordion from './FilterAccordion';
import AddGrantModal from './AddGrantModal';
import { Grant } from '../types';
import { getGrants, addLocalGrant } from '../services/grantService';

const Sidebar: React.FC = () => {
  const { grantId } = useParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  useEffect(() => {
    loadGrants();
  }, [isAddModalOpen]); // Reload when modal closes to catch new additions

  const loadGrants = async () => {
    setIsLoading(true);
    try {
      const data = await getGrants();
      setGrants(data);
    } catch (error) {
      console.error('Failed to load grants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGrantAdded = (grant: Grant) => {
    // Optimistically update or reload
    setGrants(prev => [grant, ...prev]);
  };

  const toggleFilter = (
    currentList: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    option: string
  ) => {
    if (currentList.includes(option)) {
      setList(currentList.filter(item => item !== option));
    } else {
      setList([...currentList, option]);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Open': return '접수중';
      case 'Closed': return '접수마감';
      case 'Reviewing': return '심사중';
      case 'Upcoming': return '접수전';
      default: return status;
    }
  };

  const filteredGrants = grants.filter(g => {
    const matchesSearch = g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRegion = selectedRegions.length === 0 || (g.region && selectedRegions.includes(g.region));
    const matchesIndustry = selectedIndustries.length === 0 || (g.industry && selectedIndustries.includes(g.industry));

    const statusLabel = getStatusLabel(g.status || '');
    const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(statusLabel);

    return matchesSearch && matchesRegion && matchesIndustry && matchesStatus;
  });

  return (
    <>
      <aside className="flex h-full w-80 shrink-0 flex-col border-r border-slate-200 bg-neutral-white overflow-hidden">
        {/* Add Grant Button */}
        <div className="p-4 border-b border-slate-200">
          <button
            onClick={() => setAddModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-corporate-blue px-4 py-3 text-sm font-semibold text-white hover:bg-corporate-blue/90 transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-lg">add_circle</span>
            <span>사업 추가하기</span>
          </button>
        </div>

        <div className="p-4 shrink-0">
          <div className="flex w-full items-center rounded-lg bg-slate-100 border border-transparent focus-within:border-corporate-blue focus-within:bg-white focus-within:ring-2 focus-within:ring-corporate-blue/20 transition-all">
            <div className="flex items-center justify-center pl-3 text-neutral-medium-gray">
              <span className="material-symbols-outlined text-xl">search</span>
            </div>
            <input
              className="w-full bg-transparent border-none py-2.5 px-3 text-sm text-neutral-dark-gray placeholder:text-neutral-medium-gray focus:ring-0"
              placeholder="공고 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col px-4 pb-4">
            <FilterAccordion
              title="지역"
              options={["서울", "경기", "부산", "전국"]}
              isOpen={true}
              selectedOptions={selectedRegions}
              onOptionChange={(option) => toggleFilter(selectedRegions, setSelectedRegions, option)}
            />
            <FilterAccordion
              title="분야"
              options={["IT/SW", "제조", "에너지/환경", "바이오/헬스"]}
              selectedOptions={selectedIndustries}
              onOptionChange={(option) => toggleFilter(selectedIndustries, setSelectedIndustries, option)}
            />
            <FilterAccordion
              title="접수 상태"
              options={["접수중", "접수마감", "접수전", "심사중"]}
              selectedOptions={selectedStatuses}
              onOptionChange={(option) => toggleFilter(selectedStatuses, setSelectedStatuses, option)}
            />

            <div className="mt-4 pt-4 border-t border-slate-200">
              <h3 className="px-2 pb-2 text-xs font-semibold text-neutral-medium-gray uppercase tracking-wider">
                검색 결과 ({filteredGrants.length})
              </h3>

              {isLoading ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-corporate-blue border-t-transparent mx-auto"></div>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {filteredGrants.length === 0 ? (
                    <p className="text-sm text-neutral-medium-gray px-2 py-4 text-center italic">검색된 공고가 없습니다.</p>
                  ) : (
                    filteredGrants.map(grant => (
                      <Link to={`/grant/${grant.id}`} key={grant.id}>
                        <div
                          className={`
                            p-3 rounded-lg cursor-pointer transition-all duration-200 group
                            ${grantId === grant.id
                              ? 'bg-light-blue-bg ring-1 ring-corporate-blue/20'
                              : 'hover:bg-slate-50'
                            }
                          `}
                        >
                          <div className="flex items-start gap-2">
                            {/* New badge for uploaded grants */}
                            {grant.id.startsWith('GRANT-') && (
                              <span className="shrink-0 text-xs font-medium text-white bg-green-500 px-1.5 py-0.5 rounded">
                                NEW
                              </span>
                            )}
                            <h3 className={`font-semibold text-sm line-clamp-2 flex-1 ${grantId === grant.id ? 'text-corporate-blue' : 'text-neutral-dark-gray group-hover:text-corporate-blue'}`}>
                              {grant.title}
                            </h3>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-neutral-medium-gray">#{grant.id.substring(grant.id.length - 8)}</p>
                            {grant.status === 'Open' ? (
                              <span className="text-xs font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded">{getStatusLabel(grant.status)}</span>
                            ) : grant.status === 'Upcoming' ? (
                              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{getStatusLabel(grant.status)}</span>
                            ) : (
                              <span className="text-xs font-medium text-neutral-500 bg-slate-100 px-1.5 py-0.5 rounded">{getStatusLabel(grant.status || '')}</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {isAddModalOpen && (
        <AddGrantModal
          onClose={() => setAddModalOpen(false)}
          onGrantAdded={handleGrantAdded}
        />
      )}
    </>
  );
};

export default Sidebar;