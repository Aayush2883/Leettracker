import React from 'react';
import { Award, BookOpen, Star } from 'lucide-react';

export default function StatsCard({ stats }) {
  const { total, solved, easy, medium, hard, bookmarked } = stats;

  const solvedPercent = total > 0 ? Math.round((solved / total) * 100) : 0;
  const easyPercent = easy.total > 0 ? Math.round((easy.solved / easy.total) * 100) : 0;
  const mediumPercent = medium.total > 0 ? Math.round((medium.solved / medium.total) * 100) : 0;
  const hardPercent = hard.total > 0 ? Math.round((hard.solved / hard.total) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Overview Card */}
      <div className="glass-card" style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '120px',
          height: '120px',
          background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-primary)', padding: '0.5rem', borderRadius: '10px' }}>
            <Award size={20} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Overall Progress</h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-secondary)' }}>
            {solved}
          </span>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            / {total} solved
          </span>
        </div>

        <div style={{ marginBottom: '0.5rem' }}>
          <div className="progress-bar-container" style={{ height: '8px', background: 'rgba(255,255,255,0.03)' }}>
            <div 
              className="progress-bar-fill" 
              style={{ 
                width: `${solvedPercent}%`, 
                background: 'linear-gradient(90deg, var(--color-primary) 0%, var(--color-purple) 100%)',
                boxShadow: '0 0 10px rgba(59, 130, 246, 0.3)'
              }}
            />
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <span>{solvedPercent}% Completed</span>
          <span>{total - solved} remaining</span>
        </div>
      </div>

      {/* Difficulty Breakdown */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BookOpen size={16} className="gradient-text" />
          By Difficulty
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Easy */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
              <span style={{ color: 'var(--diff-easy)', fontWeight: 600 }}>Easy</span>
              <span style={{ color: 'var(--text-secondary)' }}>
                {easy.solved} / {easy.total}
              </span>
            </div>
            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${easyPercent}%`, backgroundColor: 'var(--diff-easy)' }}
              />
            </div>
          </div>

          {/* Medium */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
              <span style={{ color: 'var(--diff-medium)', fontWeight: 600 }}>Medium</span>
              <span style={{ color: 'var(--text-secondary)' }}>
                {medium.solved} / {medium.total}
              </span>
            </div>
            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${mediumPercent}%`, backgroundColor: 'var(--diff-medium)' }}
              />
            </div>
          </div>

          {/* Hard */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
              <span style={{ color: 'var(--diff-hard)', fontWeight: 600 }}>Hard</span>
              <span style={{ color: 'var(--text-secondary)' }}>
                {hard.solved} / {hard.total}
              </span>
            </div>
            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${hardPercent}%`, backgroundColor: 'var(--diff-hard)' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bookmarks Quick Link */}
      <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: 'rgba(236, 72, 153, 0.1)', color: 'var(--color-pink)', padding: '0.4rem', borderRadius: '8px' }}>
            <Star size={16} fill="var(--color-pink)" />
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Bookmarks</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Saved for review</div>
          </div>
        </div>
        <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-pink)' }}>
          {bookmarked}
        </span>
      </div>
    </div>
  );
}
