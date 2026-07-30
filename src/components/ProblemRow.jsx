import React from 'react';
import { Star, ExternalLink } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ProblemRow({ problem, state, onStateChange }) {
  const status = state.status || 'todo';
  const isBookmarked = !!state.bookmarked;

  const toggleCompletion = () => {
    const newStatus = status === 'solved' ? 'todo' : 'solved';
    onStateChange({
      ...state,
      status: newStatus
    });

    if (newStatus === 'solved') {
      // Trigger a nice celebratory confetti!
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#3b82f6', '#8b5cf6', '#10b981']
      });
    }
  };

  const toggleBookmark = () => {
    onStateChange({
      ...state,
      bookmarked: !isBookmarked
    });
  };

  const getDifficultyClass = (diff) => {
    if (diff === 'EASY') return 'badge-easy';
    if (diff === 'MEDIUM') return 'badge-medium';
    return 'badge-hard';
  };

  return (
    <tr style={{ 
      borderBottom: '1px solid var(--border-light)',
      transition: 'background-color var(--transition-fast)'
    }}>
      {/* Bookmark Column */}
      <td style={{ padding: '1rem', width: '40px', textAlign: 'center' }}>
        <button 
          onClick={toggleBookmark}
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer',
            color: isBookmarked ? 'var(--color-pink)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.15s ease'
          }}
          className="hover-scale"
          title={isBookmarked ? 'Remove bookmark' : 'Bookmark problem'}
        >
          <Star size={18} fill={isBookmarked ? 'var(--color-pink)' : 'none'} />
        </button>
      </td>

      {/* Title & LeetCode Link */}
      <td style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <a 
              href={problem.link} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ 
                color: 'var(--text-primary)', 
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.95rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
              className="problem-link"
            >
              {problem.title}
              <ExternalLink size={12} style={{ opacity: 0.5 }} />
            </a>
          </div>
          {/* Topic list */}
          {problem.topics.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
              {problem.topics.slice(0, 3).map((topic, idx) => (
                <span 
                  key={idx} 
                  style={{ 
                    fontSize: '0.7rem', 
                    background: 'rgba(255,255,255,0.03)', 
                    color: 'var(--text-secondary)',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '4px',
                    border: '1px solid var(--border-light)'
                  }}
                >
                  {topic}
                </span>
              ))}
              {problem.topics.length > 3 && (
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  +{problem.topics.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </td>

      {/* Difficulty badge */}
      <td style={{ padding: '1rem', width: '100px' }}>
        <span className={`badge ${getDifficultyClass(problem.difficulty)}`}>
          {problem.difficulty.toLowerCase()}
        </span>
      </td>

      {/* Frequency bar */}
      <td style={{ padding: '1rem', width: '120px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            {problem.frequency}%
          </div>
          <div className="progress-bar-container" style={{ height: '4px' }}>
            <div 
              className="progress-bar-fill" 
              style={{ 
                width: `${problem.frequency}%`, 
                backgroundColor: 'var(--color-primary)' 
              }}
            />
          </div>
        </div>
      </td>

      {/* Acceptance rate */}
      <td style={{ padding: '1rem', width: '100px', fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
        {problem.acceptance}%
      </td>

      {/* Action column (Completed checkbox) */}
      <td style={{ padding: '1rem', width: '100px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <label className="checkbox-container" title={status === 'solved' ? 'Mark incomplete' : 'Mark complete'}>
            <input 
              type="checkbox" 
              checked={status === 'solved'} 
              onChange={toggleCompletion} 
            />
            <span className="checkbox-checkmark"></span>
          </label>
        </div>
      </td>
    </tr>
  );
}
