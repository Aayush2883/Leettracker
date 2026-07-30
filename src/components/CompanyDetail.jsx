import React, { useState, useEffect } from 'react';
import { ChevronLeft, Search, ArrowUpDown, Loader } from 'lucide-react';
import ProblemRow from './ProblemRow';

export default function CompanyDetail({ companyId, companyName, userProgress, onStateChange, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Selected timeframe: 'thirtyDays' | 'threeMonths' | 'sixMonths' | 'moreThanSixMonths' | 'all'
  const [timeframe, setTimeframe] = useState('all');
  
  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Sorting: field and order
  const [sortField, setSortField] = useState('frequency'); // 'frequency' | 'title' | 'difficulty' | 'acceptance'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    fetch(`/data/companies/${companyId}.json`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load company data');
        return res.json();
      })
      .then(json => {
        setData(json);
        // Find first timeframe that has data
        const timeframes = ['thirtyDays', 'threeMonths', 'sixMonths', 'moreThanSixMonths', 'all'];
        const firstWithData = timeframes.find(t => json[t] && json[t].length > 0) || 'all';
        setTimeframe(firstWithData);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, [companyId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '1rem' }}>
        <Loader size={40} className="gradient-text" style={{ animation: 'spin 2s linear infinite' }} />
        <span style={{ color: 'var(--text-secondary)' }}>Loading problems list...</span>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--color-rose)', marginBottom: '1rem' }}>Error loading data</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{error || 'No data found'}</p>
        <button onClick={onBack} className="btn-secondary">
          <ChevronLeft size={16} /> Back to Dashboard
        </button>
      </div>
    );
  }

  // Get active list of problems based on timeframe
  const timeframeProblems = data[timeframe] || [];

  // Calculate timeframe-specific solved count
  const timeframeStats = timeframeProblems.reduce((acc, prob) => {
    const state = userProgress[prob.link] || { status: 'todo' };
    if (state.status === 'solved') acc.solved++;
    if (prob.difficulty === 'EASY') acc.easy++;
    if (prob.difficulty === 'MEDIUM') acc.medium++;
    if (prob.difficulty === 'HARD') acc.hard++;
    return acc;
  }, { solved: 0, easy: 0, medium: 0, hard: 0 });

  // Filter problems
  const filteredProblems = timeframeProblems.filter(prob => {
    // Search match (title or topics)
    const matchesSearch = prob.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prob.topics.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    // Difficulty match
    const matchesDifficulty = difficultyFilter === 'all' || prob.difficulty === difficultyFilter;

    // Status match
    const state = userProgress[prob.link] || { status: 'todo' };
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'todo' && state.status !== 'solved') ||
      (statusFilter === 'solved' && state.status === 'solved') ||
      (statusFilter === 'bookmarked' && state.bookmarked);

    return matchesSearch && matchesDifficulty && matchesStatus;
  });

  // Handle Sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc'); // Default to descending
    }
  };

  const difficultyOrder = { 'EASY': 1, 'MEDIUM': 2, 'HARD': 3 };

  const sortedProblems = [...filteredProblems].sort((a, b) => {
    let comp = 0;
    if (sortField === 'frequency') {
      comp = a.frequency - b.frequency;
    } else if (sortField === 'title') {
      comp = a.title.localeCompare(b.title);
    } else if (sortField === 'difficulty') {
      comp = difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
    } else if (sortField === 'acceptance') {
      comp = a.acceptance - b.acceptance;
    }

    return sortOrder === 'asc' ? comp : -comp;
  });

  const completionPercent = timeframeProblems.length > 0 
    ? Math.round((timeframeStats.solved / timeframeProblems.length) * 100) 
    : 0;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={onBack} className="btn-secondary" style={{ padding: '0.5rem 0.75rem', borderRadius: '10px' }} title="Back to Dashboard">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{companyName}</h1>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {timeframeProblems.length} questions listed in this timeframe
            </span>
          </div>
        </div>

        {/* Timeframe selector tabs */}
        <div className="tabs-container" style={{ alignSelf: 'center' }}>
          {data.thirtyDays.length > 0 && (
            <button 
              className={`tab-btn ${timeframe === 'thirtyDays' ? 'active' : ''}`}
              onClick={() => setTimeframe('thirtyDays')}
            >
              30 Days
            </button>
          )}
          {data.threeMonths.length > 0 && (
            <button 
              className={`tab-btn ${timeframe === 'threeMonths' ? 'active' : ''}`}
              onClick={() => setTimeframe('threeMonths')}
            >
              3 Months
            </button>
          )}
          {data.sixMonths.length > 0 && (
            <button 
              className={`tab-btn ${timeframe === 'sixMonths' ? 'active' : ''}`}
              onClick={() => setTimeframe('sixMonths')}
            >
              6 Months
            </button>
          )}
          {data.moreThanSixMonths.length > 0 && (
            <button 
              className={`tab-btn ${timeframe === 'moreThanSixMonths' ? 'active' : ''}`}
              onClick={() => setTimeframe('moreThanSixMonths')}
            >
              &gt; 6 Months
            </button>
          )}
          {data.all.length > 0 && (
            <button 
              className={`tab-btn ${timeframe === 'all' ? 'active' : ''}`}
              onClick={() => setTimeframe('all')}
            >
              All Time
            </button>
          )}
        </div>
      </div>

      {/* Stats Summary Panel */}
      <div className="glass-card" style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: '1', minWidth: '250px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 600 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Solved in this Timeframe</span>
            <span>{timeframeStats.solved} / {timeframeProblems.length} ({completionPercent}%)</span>
          </div>
          <div className="progress-bar-container" style={{ height: '8px' }}>
            <div 
              className="progress-bar-fill" 
              style={{ 
                width: `${completionPercent}%`, 
                background: 'linear-gradient(90deg, var(--color-primary) 0%, var(--color-emerald) 100%)' 
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--diff-easy)', fontWeight: 700 }}>{timeframeStats.easy}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Easy</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--diff-medium)', fontWeight: 700 }}>{timeframeStats.medium}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Medium</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--diff-hard)', fontWeight: 700 }}>{timeframeStats.hard}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Hard</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        {/* Search */}
        <div className="search-input-wrapper" style={{ flex: '1', minWidth: '200px' }}>
          <input 
            type="text" 
            placeholder="Search questions by title or topic..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <Search size={18} className="search-icon" />
        </div>

        {/* Difficulty Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Difficulty:</span>
          <select 
            value={difficultyFilter} 
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="custom-select"
            style={{ fontSize: '0.875rem', padding: '0.5rem 2rem 0.5rem 0.75rem' }}
          >
            <option value="all">All</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Status:</span>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="custom-select"
            style={{ fontSize: '0.875rem', padding: '0.5rem 2rem 0.5rem 0.75rem' }}
          >
            <option value="all">All</option>
            <option value="todo">Todo</option>
            <option value="solved">Completed</option>
            <option value="bookmarked">Bookmarked</option>
          </select>
        </div>
      </div>

      {/* Problems Table */}
      <div className="glass-card" style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: 'rgba(255,255,255,0.01)' }}>
              <th style={{ padding: '1rem', width: '40px' }}></th>
              
              {/* Title Sort */}
              <th 
                style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleSort('title')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Title
                  <ArrowUpDown size={12} style={{ opacity: sortField === 'title' ? 1 : 0.4 }} />
                </div>
              </th>

              {/* Difficulty Sort */}
              <th 
                style={{ padding: '1rem', width: '100px', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleSort('difficulty')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Difficulty
                  <ArrowUpDown size={12} style={{ opacity: sortField === 'difficulty' ? 1 : 0.4 }} />
                </div>
              </th>

              {/* Frequency Sort */}
              <th 
                style={{ padding: '1rem', width: '120px', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleSort('frequency')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Frequency
                  <ArrowUpDown size={12} style={{ opacity: sortField === 'frequency' ? 1 : 0.4 }} />
                </div>
              </th>

              {/* Acceptance Sort */}
              <th 
                style={{ padding: '1rem', width: '100px', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleSort('acceptance')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Acceptance
                  <ArrowUpDown size={12} style={{ opacity: sortField === 'acceptance' ? 1 : 0.4 }} />
                </div>
              </th>

              <th style={{ padding: '1rem', width: '100px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Completed
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedProblems.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No questions match your current filters.
                </td>
              </tr>
            ) : (
              sortedProblems.map((prob) => (
                <ProblemRow 
                  key={prob.link}
                  problem={prob}
                  state={userProgress[prob.link] || { status: 'todo' }}
                  onStateChange={(newState) => onStateChange(prob.link, newState, prob)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
