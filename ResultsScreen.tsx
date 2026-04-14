import React, { useState } from 'react';
import { Player, GameMode, ZombieStats, ClassicStats } from './gameTypes';

interface ResultsScreenProps {
  players: Player[];
  gameMode: GameMode;
  reason?: string;
  onPlayAgain: () => void;
  onHome: () => void;
}

const medal = (rank: number) => ['🥇', '🥈', '🥉'][rank - 1] ?? `${rank}`;

function zombifyColor(hex: string): string {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.round(r * 0.2 + 40 * 0.8)},${Math.round(g * 0.3 + 130 * 0.7)},${Math.round(b * 0.2 + 40 * 0.8)})`;
  } catch { return '#4a8c4a'; }
}

const StatBadge: React.FC<{ icon: string; label: string; value: string; highlight?: boolean; green?: boolean }> = ({ icon, label, value, highlight, green }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px',
    background: highlight ? 'rgba(75,255,165,0.12)' : green ? 'rgba(76,175,80,0.1)' : 'rgba(255,255,255,0.05)',
    border: `1px solid ${highlight ? 'rgba(75,255,165,0.3)' : green ? 'rgba(76,175,80,0.3)' : 'rgba(255,255,255,0.08)'}`,
    borderRadius: '8px', fontSize: '12px',
  }}>
    <span>{icon}</span>
    <span style={{ color: 'rgba(255,255,255,0.5)' }}>{label}:</span>
    <span style={{ fontWeight: '600', color: highlight ? '#4BFFA5' : green ? '#4caf50' : 'white' }}>{value}</span>
  </div>
);

const EmailSignup: React.FC = () => {
  if (sessionStorage.getItem('playtabrecess_subscribed')) {
    return (
      <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(75,255,165,0.08)', border: '1px solid rgba(75,255,165,0.2)', borderRadius: '14px', color: '#4BFFA5', fontSize: '14px', fontWeight: '600' }}>
        🎮 You're on the list — we'll let you know when the next game drops!
      </div>
    );
  }
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', overflow: 'hidden' }}>
      <iframe
        src="https://subscribe-forms.beehiiv.com/d3e61ef5-5de4-4793-9393-2a5dd8788019"
        frameBorder={0}
        scrolling="no"
        style={{ width: '100%', maxWidth: '500px', height: '164px', background: 'transparent', border: 'none', display: 'block', margin: '0 auto' }}
      />
    </div>
  );
};

// ─── Classic Results ──────────────────────────────────────────────────────────
const ClassicResults: React.FC<{ players: Player[] }> = ({ players }) => {
  const winner = players.find(p => p.rank === 1);
  const loser = players.find(p => p.isLoser);
  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ fontSize: '56px', marginBottom: '8px' }}>🎉</div>
        <h1 style={{ fontSize: '42px', fontWeight: '900', margin: 0, background: 'linear-gradient(135deg, #FFB74B, #FF4B6E)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>GAME OVER</h1>
        {winner && <p style={{ color: 'rgba(255,255,255,0.6)', margin: '8px 0 0', fontSize: '16px' }}><span style={{ color: winner.color, fontWeight: '700' }}>{winner.name}</span> wins with {winner.score} pts!</p>}
        {loser && <p style={{ color: 'rgba(255,75,110,0.7)', margin: '4px 0 0', fontSize: '14px' }}>🏷️ <span style={{ color: loser.color }}>{loser.name}</span> was IT at the end!</p>}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', overflow: 'hidden', marginBottom: '24px' }}>
        {players.map((p, i) => {
          const stats = p.stats as ClassicStats | undefined;
          return (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '20px 24px',
              borderBottom: i < players.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              background: p.rank === 1 ? 'rgba(255,183,75,0.06)' : p.isLoser ? 'rgba(255,75,110,0.06)' : 'transparent',
              animation: `slideIn 0.3s ease-out ${i * 0.1}s both`,
            }}>
              <div style={{ fontSize: '24px', width: '32px', flexShrink: 0, paddingTop: '2px' }}>{medal(p.rank!)}</div>
              <svg width="18" height="24" viewBox="0 0 24 32" fill="none" style={{ flexShrink: 0, marginTop: '4px' }}>
                <path d="M0 0 L0 28 L7 21 L12 32 L16 30 L11 19 L20 19 Z" fill={p.color} stroke="white" strokeWidth="1.5"/>
              </svg>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: '700', fontSize: '16px', color: p.color }}>{p.name}</span>
                  {p.award && (
                    <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', fontWeight: '600' }}>
                      {p.award.emoji} {p.award.title}
                    </span>
                  )}
                  {p.isLoser && <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(255,75,110,0.2)', color: '#FF4B6E' }}>🏷️ LOSER</span>}
                </div>
                {p.award && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '8px', fontStyle: 'italic' }}>{p.award.desc}</div>}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {stats && <StatBadge icon="⏱️" label="Not IT" value={`${stats.timeNotIt}s`} highlight={!p.isLoser} />}
                  {stats && stats.tagsMade > 0 && <StatBadge icon="🏷️" label="Tags" value={String(stats.tagsMade)} />}
                  {stats && stats.retags > 0 && <StatBadge icon="🔄" label="Retags" value={String(stats.retags)} />}
                  {stats && stats.timesTagged > 0 && <StatBadge icon="🧲" label="Got tagged" value={String(stats.timesTagged)} />}
                  {stats && stats.fastestTag != null && <StatBadge icon="⚡" label="Fastest tag" value={`${stats.fastestTag}s`} />}
                  {stats && stats.survivedUntagged && <StatBadge icon="🛡️" label="Never tagged" value="✓" highlight />}
                </div>
              </div>
              <div style={{ fontSize: '26px', fontWeight: '900', color: p.rank === 1 ? '#FFB74B' : p.isLoser ? '#FF4B6E' : 'white', flexShrink: 0, paddingTop: '2px' }}>
                {p.score}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ background: 'rgba(75,159,255,0.06)', border: '1px solid rgba(75,159,255,0.12)', borderRadius: '14px', padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
        <span>⏱️ 10pts/sec not IT</span>
        <span>🐇 Never IT → +10</span>
        <span>⚡ Shortest IT streak → +10</span>
        <span>🔄 Most retags → +10</span>
        <span>🐁 Most frantic → +10</span>
        <span>🏷️ IT at end → -20</span>
      </div>
    </>
  );
};

// ─── Zombie Results ───────────────────────────────────────────────────────────
const ZombieResults: React.FC<{ players: Player[]; reason: string }> = ({ players, reason }) => {
  const survivors = players.filter(p => !p.isZombie && !p.isTurning);
  const patientZero = players.find(p => p.patientZero);
  const timedOut = reason === 'timeout';

  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ fontSize: '56px', marginBottom: '8px' }}>{survivors.length > 0 ? '🧍' : '🧟'}</div>
        <h1 style={{ fontSize: '38px', fontWeight: '900', margin: 0, background: survivors.length > 0 ? 'linear-gradient(135deg, #4caf50, #8bc34a)' : 'linear-gradient(135deg, #4a1a1a, #8c3030)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {survivors.length > 0 ? 'OUTBREAK CONTAINED!' : 'ALL INFECTED!'}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', margin: '8px 0 0', fontSize: '15px' }}>
          {survivors.length > 0
            ? `${survivors.map(s => s.name).join(', ')} survived the zombie apocalypse!`
            : timedOut ? 'The zombies won — time ran out!' : 'No humans remain...'}
        </p>
      </div>

      {/* Patient Zero callout */}
      {patientZero && (
        <div style={{ background: 'rgba(139,0,0,0.15)', border: '1px solid rgba(139,0,0,0.3)', borderRadius: '16px', padding: '16px 20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '32px' }}>🦠</div>
          <div>
            <div style={{ fontSize: '12px', color: 'rgba(255,100,100,0.7)', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '2px' }}>Patient Zero</div>
            <div style={{ fontWeight: '700', fontSize: '16px', color: zombifyColor(patientZero.color) }}>{patientZero.name}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
              Infected {patientZero.infectedCount || 0} player{patientZero.infectedCount !== 1 ? 's' : ''} directly
            </div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '22px', fontWeight: '900', color: '#8bc34a' }}>{patientZero.score} pts</div>
        </div>
      )}

      {/* Player list */}
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', overflow: 'hidden', marginBottom: '24px' }}>
        {players.filter(p => !p.patientZero).map((p, i) => {
          const stats = p.stats as ZombieStats | undefined;
          const pIsZombie = p.isZombie || p.isTurning;
          const cursorColor = pIsZombie ? zombifyColor(p.color) : p.color;
          return (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '18px 24px',
              borderBottom: i < players.filter(x => !x.patientZero).length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              background: !pIsZombie ? 'rgba(76,175,80,0.06)' : 'transparent',
              animation: `slideIn 0.3s ease-out ${i * 0.08}s both`,
            }}>
              <div style={{ fontSize: '22px', width: '32px', flexShrink: 0 }}>{medal(p.rank!)}</div>
              <svg width="18" height="24" viewBox="0 0 24 32" fill="none" style={{ flexShrink: 0, marginTop: '2px' }}>
                <path d="M0 0 L0 28 L7 21 L12 32 L16 30 L11 19 L20 19 Z" fill={cursorColor} stroke="white" strokeWidth="1.5"/>
              </svg>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: '700', fontSize: '15px', color: cursorColor }}>{p.name}</span>
                  {!pIsZombie && <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(76,175,80,0.2)', color: '#4caf50' }}>🧍 SURVIVED</span>}
                  {pIsZombie && <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(139,0,0,0.2)', color: 'rgba(255,100,100,0.8)' }}>🧟 INFECTED</span>}
                  {p.isBot && <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>🤖</span>}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {stats && <StatBadge icon="⏱️" label="Survived" value={`${stats.survivalTime}s`} green={!pIsZombie} />}
                  {stats && pIsZombie && (stats.infectedCount || 0) > 0 && <StatBadge icon="🦠" label="Infected" value={String(stats.infectedCount)} />}
                </div>
              </div>
              <div style={{ fontSize: '22px', fontWeight: '900', color: !pIsZombie ? '#4caf50' : 'rgba(255,255,255,0.4)', flexShrink: 0 }}>
                {p.score}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ background: 'rgba(76,175,80,0.05)', border: '1px solid rgba(76,175,80,0.12)', borderRadius: '14px', padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
        <span>🧍 Survive full game → 300 pts</span>
        <span>🧟 Patient Zero → starts at 250, -8pts/sec, +150 per infection</span>
        <span>🦠 Infected → survival time × 10 + 50 per infection caused</span>
      </div>
    </>
  );
};

// ─── Main ResultsScreen ───────────────────────────────────────────────────────
const ResultsScreen: React.FC<ResultsScreenProps> = ({ players, gameMode, reason = '', onPlayAgain, onHome }) => {
  return (
    <div style={{
      minHeight: '100vh',
      background: gameMode === 'zombie'
        ? 'linear-gradient(135deg, #060f06 0%, #0f1a0f 50%, #060f06 100%)'
        : 'linear-gradient(135deg, #0f0f1a 0%, #1a0f2e 50%, #0f1a2e 100%)',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      color: 'white',
    }}>
      <div style={{ width: '100%', maxWidth: '700px', margin: '0 auto', padding: '40px 20px 60px' }}>

        {gameMode === 'zombie'
          ? <ZombieResults players={players} reason={reason} />
          : <ClassicResults players={players} />
        }

        <div style={{ marginBottom: '24px' }}>
          <EmailSignup />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onPlayAgain} style={{
            flex: 2, padding: '16px', border: 'none', borderRadius: '14px',
            background: gameMode === 'zombie'
              ? 'linear-gradient(135deg, #2d6a2d, #4caf50)'
              : 'linear-gradient(135deg, #FF4B6E, #C84BFF)',
            color: 'white', fontWeight: '700', fontSize: '16px', cursor: 'pointer',
          }}>
            {gameMode === 'zombie' ? '🧟 Play Again' : '🔄 Play Again'}
          </button>
          <button onClick={onHome} style={{
            flex: 1, padding: '16px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '14px',
            background: 'rgba(255,255,255,0.05)', color: 'white', fontWeight: '600', fontSize: '15px', cursor: 'pointer',
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
