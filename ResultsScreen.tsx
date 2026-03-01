import React, { useState } from 'react';
import { Player, LeaderboardEntry } from './gameTypes';

interface ResultsScreenProps {
  players: Player[];
  leaderboard: LeaderboardEntry[];
  onPlayAgain: () => void;
  onHome: () => void;
}

const medal = (rank: number) => ['🥇', '🥈', '🥉'][rank - 1] ?? `${rank}`;

const StatBadge: React.FC<{ icon: string; label: string; value: string; highlight?: boolean }> = ({
  icon, label, value, highlight,
}) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '4px 10px',
    background: highlight ? 'rgba(75,255,165,0.12)' : 'rgba(255,255,255,0.05)',
    border: `1px solid ${highlight ? 'rgba(75,255,165,0.3)' : 'rgba(255,255,255,0.08)'}`,
    borderRadius: '8px', fontSize: '12px',
  }}>
    <span>{icon}</span>
    <span style={{ color: 'rgba(255,255,255,0.5)' }}>{label}:</span>
    <span style={{ fontWeight: '600', color: highlight ? '#4BFFA5' : 'white' }}>{value}</span>
  </div>
);

const EmailSignup: React.FC = () => {
  if (sessionStorage.getItem('playtabrecess_subscribed')) {
    return (
      <div style={{
        textAlign: 'center', padding: '16px',
        background: 'rgba(75,255,165,0.08)', border: '1px solid rgba(75,255,165,0.2)',
        borderRadius: '14px', color: '#4BFFA5', fontSize: '14px', fontWeight: '600',
      }}>
        🎮 You're on the list — we'll let you know when the next game drops!
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '16px', padding: '20px 24px',
    }}>
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>
          🎮 New games drop every week
        </div>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>
          Join PlayTabRecess — be first to know when the next one is live.
        </div>
      </div>
      <iframe
        src="https://subscribe-forms.beehiiv.com/d3e61ef5-5de4-4793-9393-2a5dd8788019"
        frameBorder={0}
        scrolling="no"
        style={{
          width: '100%',
          height: '164px',
          background: 'transparent',
          border: 'none',
          display: 'block',
          borderRadius: '12px',
        }}
      />
    </div>
  );
};

const ResultsScreen: React.FC<ResultsScreenProps> = ({ players, leaderboard, onPlayAgain, onHome }) => {
  const winner = players.find(p => p.rank === 1);
  const loser = players.find(p => p.isLoser);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a0f2e 50%, #0f1a2e 100%)',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      color: 'white',
    }}>
      <div style={{ width: '100%', maxWidth: '700px', margin: '0 auto', padding: '40px 20px 60px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '56px', marginBottom: '8px', animation: 'popIn 0.5s ease-out' }}>🎉</div>
          <h1 style={{
            fontSize: '42px', fontWeight: '900', margin: 0,
            background: 'linear-gradient(135deg, #FFB74B, #FF4B6E)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>GAME OVER</h1>
          {winner && (
            <p style={{ color: 'rgba(255,255,255,0.6)', margin: '8px 0 0', fontSize: '16px' }}>
              <span style={{ color: winner.color, fontWeight: '700' }}>{winner.name}</span> wins with {winner.score} pts!
            </p>
          )}
          {loser && (
            <p style={{ color: 'rgba(255,75,110,0.7)', margin: '4px 0 0', fontSize: '14px' }}>
              🏷️ <span style={{ color: loser.color }}>{loser.name}</span> was IT at the end!
            </p>
          )}
        </div>

        {/* Player rankings */}
        <div style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px', overflow: 'hidden', marginBottom: '24px',
        }}>
          {players.map((p, i) => (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: '16px',
              padding: '20px 24px',
              borderBottom: i < players.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              background: p.rank === 1 ? 'rgba(255,183,75,0.06)' : p.isLoser ? 'rgba(255,75,110,0.06)' : 'transparent',
              animation: `slideIn 0.3s ease-out ${i * 0.1}s both`,
            }}>
              <div style={{ fontSize: '24px', width: '32px', flexShrink: 0, paddingTop: '2px' }}>
                {medal(p.rank!)}
              </div>
              <svg width="18" height="24" viewBox="0 0 24 32" fill="none" style={{ flexShrink: 0, marginTop: '4px' }}>
                <path d="M0 0 L0 28 L7 21 L12 32 L16 30 L11 19 L20 19 Z" fill={p.color} stroke="white" strokeWidth="1.5"/>
              </svg>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: '700', fontSize: '16px', color: p.color }}>{p.name}</span>

                  {/* Personality Award */}
                  {p.award && (
                    <span style={{
                      fontSize: '12px', padding: '3px 10px', borderRadius: '20px',
                      background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                      color: 'white', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px',
                    }}>
                      {p.award.emoji} {p.award.title}
                    </span>
                  )}

                  {p.isLoser && (
                    <span style={{
                      fontSize: '11px', padding: '2px 8px', borderRadius: '6px',
                      background: 'rgba(255,75,110,0.2)', color: '#FF4B6E',
                    }}>🏷️ LOSER</span>
                  )}
                </div>

                {/* Award description */}
                {p.award && (
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '8px', fontStyle: 'italic' }}>
                    {p.award.desc}
                  </div>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  <StatBadge icon="⏱️" label="Not IT" value={`${p.stats?.timeNotIt ?? 0}s`} highlight={!p.isLoser} />
                  {(p.stats?.tagsMade ?? 0) > 0 && <StatBadge icon="🏷️" label="Tags" value={String(p.stats!.tagsMade)} />}
                  {(p.stats?.retags ?? 0) > 0 && <StatBadge icon="🔄" label="Retags" value={String(p.stats!.retags)} />}
                  {(p.stats?.timesTagged ?? 0) > 0 && <StatBadge icon="🧲" label="Got tagged" value={String(p.stats!.timesTagged)} />}
                  {p.stats?.fastestTag != null && <StatBadge icon="⚡" label="Fastest tag" value={`${p.stats.fastestTag}s`} />}
                  {p.stats?.survivedUntagged && <StatBadge icon="🛡️" label="Never tagged" value="✓" highlight />}
                </div>
              </div>

              <div style={{
                fontSize: '26px', fontWeight: '900',
                color: p.rank === 1 ? '#FFB74B' : p.isLoser ? '#FF4B6E' : 'white',
                flexShrink: 0, paddingTop: '2px',
              }}>
                {p.score}
              </div>
            </div>
          ))}
        </div>

        {/* Email signup */}
        <div style={{ marginBottom: '24px' }}>
          <EmailSignup />
        </div>

        {/* Global leaderboard */}
        {leaderboard.length > 0 && (
          <div style={{
            background: 'rgba(255,183,75,0.05)', border: '1px solid rgba(255,183,75,0.12)',
            borderRadius: '20px', padding: '24px', marginBottom: '24px',
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '700', color: '#FFB74B' }}>
              🏆 Global Leaderboard
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {leaderboard.slice(0, 6).map((entry, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px',
                }}>
                  <span style={{ fontSize: '14px', width: '20px' }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                  </span>
                  <span style={{ flex: 1, fontSize: '13px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.name}
                  </span>
                  <span style={{ fontSize: '13px', color: '#4BFFA5', fontWeight: '700' }}>{entry.bestScore}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scoring legend */}
        <div style={{
          background: 'rgba(75,159,255,0.06)', border: '1px solid rgba(75,159,255,0.12)',
          borderRadius: '14px', padding: '16px 20px', marginBottom: '24px',
          display: 'flex', gap: '12px', flexWrap: 'wrap',
          fontSize: '12px', color: 'rgba(255,255,255,0.4)',
        }}>
          <span>⏱️ 10pts/sec not IT</span>
          <span>🐇 Never IT → +10</span>
          <span>⚡ Shortest IT streak → +10</span>
          <span>🔄 Most retags → +10</span>
          <span>🐁 Most frantic → +10</span>
          <span>🏷️ IT at end → -20</span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onPlayAgain} style={{
            flex: 2, padding: '16px', border: 'none', borderRadius: '14px',
            background: 'linear-gradient(135deg, #FF4B6E, #C84BFF)',
            color: 'white', fontWeight: '700', fontSize: '16px', cursor: 'pointer',
          }}>🔄 Play Again</button>
          <button onClick={onHome} style={{
            flex: 1, padding: '16px', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '14px', background: 'rgba(255,255,255,0.05)',
            color: 'white', fontWeight: '600', fontSize: '15px', cursor: 'pointer',
          }}>🏠 Home</button>
        </div>
      </div>

      <style>{`
        html, body, #root { height: auto !important; overflow: visible !important; }
        @keyframes popIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes slideIn { from { transform: translateX(-20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default ResultsScreen;
