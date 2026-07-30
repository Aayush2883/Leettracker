import React, { useState } from 'react';
import { Search, Building2, Star, ChevronRight } from 'lucide-react';
import StatsCard from './StatsCard';
import ProblemRow from './ProblemRow';

export default function Dashboard({ companies, userProgress, onSelectCompany, stats, onStateChange }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('companies'); // 'companies' | 'bookmarks'
  const [visibleCount, setVisibleCount] = useState(48);

  // Filter companies
  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get bookmarked problems
  const bookmarkedProblems = Object.keys(userProgress)
    .filter(link => userProgress[link].bookmarked && userProgress[link].problem)
    .map(link => ({
      ...userProgress[link].problem,
      state: userProgress[link]
    }));



  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 48);
  };

  return (
    <div className="grid-cols-1-3 animate-fade-in">
      {/* Sidebar: Overall Stats & Quick Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <StatsCard stats={stats} />
        
        {/* Quick Tips Glass Card */}
        <div className="glass-card" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '0.95rem' }}>Study Tip</h4>
          <p style={{ lineHeight: '1.4' }}>
            Focus on high-frequency questions for the past 30 days when preparing for upcoming interviews. Keep notes on time/space complexity for revision.
          </p>
        </div>
      </div>

      {/* Main Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Navigation Tabs and Search */}
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          gap: '1rem',
          borderBottom: '1px solid var(--border-light)',
          paddingBottom: '1rem'
        }}>
          <div className="tabs-container">
            <button 
              className={`tab-btn ${activeTab === 'companies' ? 'active' : ''}`}
              onClick={() => setActiveTab('companies')}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <Building2 size={14} /> Companies ({companies.length})
              </span>
            </button>
            <button 
              className={`tab-btn ${activeTab === 'bookmarks' ? 'active' : ''}`}
              onClick={() => setActiveTab('bookmarks')}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <Star size={14} /> Bookmarks ({bookmarkedProblems.length})
              </span>
            </button>

          </div>

          {activeTab === 'companies' && (
            <div className="search-input-wrapper" style={{ width: '280px' }}>
              <input 
                type="text" 
                placeholder="Search 440+ companies..." 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisibleCount(48); // Reset pagination on search
                }}
                className="search-input"
                style={{ padding: '0.5rem 1rem 0.5rem 2.25rem', borderRadius: '10px' }}
              />
              <Search size={15} className="search-icon" style={{ left: '0.75rem' }} />
            </div>
          )}
        </div>

        {/* Tab Content: Companies List */}
        {activeTab === 'companies' && (
          <>
            <div className="companies-grid">
              {filteredCompanies.slice(0, visibleCount).map(company => (
                <div 
                  key={company.id}
                  onClick={() => onSelectCompany(company.id, company.name)}
                  className="glass-card interactive"
                  style={{ 
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    minHeight: '120px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{company.name}</h3>
                    <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <span>Total Questions</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{company.counts.all}</span>
                    </div>
                    {company.counts.thirtyDays > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span>Past 30 Days</span>
                        <span style={{ color: 'var(--color-primary)' }}>{company.counts.thirtyDays}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredCompanies.length === 0 && (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No companies match your search.
              </div>
            )}

            {filteredCompanies.length > visibleCount && (
              <button 
                onClick={handleLoadMore}
                className="btn-secondary"
                style={{ alignSelf: 'center', marginTop: '1rem' }}
              >
                Load More Companies
              </button>
            )}
          </>
        )}

        {/* Tab Content: Bookmarks */}
        {activeTab === 'bookmarks' && (
          <div className="glass-card" style={{ padding: 0, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                  <th style={{ padding: '1rem', width: '40px' }}></th>
                  <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Title</th>
                  <th style={{ padding: '1rem', width: '100px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Difficulty</th>
                  <th style={{ padding: '1rem', width: '120px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Frequency</th>
                  <th style={{ padding: '1rem', width: '100px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Acceptance</th>
                  <th style={{ padding: '1rem', width: '100px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Completed</th>
                </tr>
              </thead>
              <tbody>
                {bookmarkedProblems.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      <Star size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
                      <div>No bookmarked questions yet.</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Click the star icon next to a question in any company list to save it here.
                      </div>
                    </td>
                  </tr>
                ) : (
                  bookmarkedProblems.map((prob) => (
                    <ProblemRow 
                      key={prob.link}
                      problem={prob}
                      state={prob.state}
                      onStateChange={(newState) => onStateChange(prob.link, newState, prob)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}


      </div>
    </div>
  );
}
