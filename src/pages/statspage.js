
import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar/Navbar';
import PageContainer from '../components/UI/PageContainer';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { getCurrentUserProfile, getUserFinishedMatches, getAllFinishedMatches } from '../firebase/db';

const CYAN = '#38C7D7';
const YELLOW = '#FEC417';
const COLORS = [CYAN, YELLOW, '#2C333A', '#8884d8', '#82ca9d'];

function getPlacementStats(matches, userName) {
  const placements = [];
  matches.forEach(match => {
    if (!Array.isArray(match.players)) return;
    const idx = match.players.findIndex(p => p && (p.name === userName));
    if (idx !== -1) placements.push(idx + 1); // piazzamento 1-based
  });
  return placements;
}

function getModeStats(matches) {
  const modeMap = {};
  matches.forEach(m => {
    if (!m.mode) return;
    modeMap[m.mode] = (modeMap[m.mode] || 0) + 1;
  });
  return Object.entries(modeMap).map(([mode, count]) => ({ mode, count }));
}

function getTimelineStats(matches) {
  // Conta partite per mese
  const byMonth = {};
  matches.forEach(m => {
    const d = m.createdAt && m.createdAt.toDate ? m.createdAt.toDate() : new Date(m.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    byMonth[key] = (byMonth[key] || 0) + 1;
  });
  return Object.entries(byMonth).map(([month, count]) => ({ month, count }));
}

const Highlights = ({ stats }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
    <Card className="flex flex-col items-center py-6 bg-gradient-to-br from-[#173C55] to-[#1B2227] border-2 border-cyan-400">
      <div className="text-5xl font-extrabold text-cyan-400">{stats.gamesPlayed}</div>
      <div className="text-lg text-white mt-2">Partite giocate</div>
    </Card>
    <Card className="flex flex-col items-center py-6 bg-gradient-to-br from-[#173C55] to-[#1B2227] border-2 border-yellow-400">
      <div className="text-5xl font-extrabold text-yellow-400">{stats.gamesWon}</div>
      <div className="text-lg text-white mt-2">Vittorie</div>
    </Card>
    <Card className="flex flex-col items-center py-6 bg-gradient-to-br from-[#173C55] to-[#1B2227] border-2 border-cyan-400">
      <div className="text-5xl font-extrabold text-cyan-400">{stats.winRate}%</div>
      <div className="text-lg text-white mt-2">Win Rate</div>
    </Card>
    <Card className="flex flex-col items-center py-6 bg-gradient-to-br from-[#173C55] to-[#1B2227] border-2 border-yellow-400">
      <div className="text-5xl font-extrabold text-yellow-400">{stats.bestPlacement}</div>
      <div className="text-lg text-white mt-2">Miglior piazzamento</div>
    </Card>
  </div>
);

const BarGraph = ({ data, color = CYAN, height = 180, minX = 1, maxX = 6 }) => {
  // Always show axes and grid, even if no data
  const barWidth = 28;
  const axisColor = '#2C333A';
  const labelColor = '#38C7D7';
  const maxCount = data && data.length ? Math.max(...data.map(d => d.count)) : 1;
  const bars = [];
  for (let i = minX; i <= maxX; i++) {
    const found = data && data.find(d => String(d.place) === String(i));
    bars.push({ place: i, count: found ? found.count : 0 });
  }
  return (
    <div className="relative w-full h-[200px] flex flex-col justify-end">
      {/* Y axis grid */}
      <svg width="100%" height="180" className="absolute left-0 top-0 z-0">
        {[0, 0.25, 0.5, 0.75, 1].map((v, idx) => (
          <line
            key={idx}
            x1="0" x2="100%" y1={30 + v * 130} y2={30 + v * 130}
            stroke={axisColor} strokeDasharray="4 4" strokeWidth="1"
          />
        ))}
      </svg>
      <div className="flex items-end h-[180px] w-full gap-2 z-10">
        {bars.map((d, i) => (
          <div key={i} className="flex flex-col items-center w-full">
            <div className="text-xs text-cyan-300 mb-1 min-h-[16px]">{d.count > 0 ? d.count : ''}</div>
            <div
              className="rounded-t-md transition-all duration-300"
              style={{
                height: d.count > 0 ? `${(d.count / maxCount) * 130 + 8}px` : '8px',
                background: d.count > 0 ? color : '#222b',
                width: `${barWidth}px`,
                minHeight: '8px',
                opacity: d.count > 0 ? 1 : 0.5,
                display: 'block',
              }}
            />
            <div className="text-xs text-gray-400 mt-1">{d.place}</div>
          </div>
        ))}
      </div>
      {/* Y axis label */}
      <div className="absolute left-0 top-0 h-[180px] flex flex-col justify-between z-20">
        {[maxCount, Math.round(maxCount*0.75), Math.round(maxCount*0.5), Math.round(maxCount*0.25), 0].map((v, idx) => (
          <span key={idx} className="text-xs text-gray-500" style={{height: '1px'}}>{v}</span>
        ))}
      </div>
      {/* Placeholder if no data */}
      {(!data || !data.length || bars.every(b => b.count === 0)) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-30 pointer-events-none">
          <span className="text-5xl mb-2">📊</span>
          <span className="text-gray-400">Nessun piazzamento registrato</span>
        </div>
      )}
    </div>
  );
};

const PieGraph = ({ data, colors = COLORS, size = 140 }) => {
  if (!data || !data.length) return <div className="text-gray-400">Nessun dato</div>;
  const total = data.reduce((a, b) => a + b.count, 0);
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      {data.map((d, i) => {
        const start = acc / total * 2 * Math.PI;
        acc += d.count;
        const end = acc / total * 2 * Math.PI;
        const x1 = size / 2 + (size / 2 - 10) * Math.sin(start);
        const y1 = size / 2 - (size / 2 - 10) * Math.cos(start);
        const x2 = size / 2 + (size / 2 - 10) * Math.sin(end);
        const y2 = size / 2 - (size / 2 - 10) * Math.cos(end);
        const large = end - start > Math.PI ? 1 : 0;
        return (
          <path
            key={i}
            d={`M${size / 2},${size / 2} L${x1},${y1} A${size / 2 - 10},${size / 2 - 10} 0 ${large} 1 ${x2},${y2} Z`}
            fill={colors[i % colors.length]}
            stroke="#222"
            strokeWidth="1"
          />
        );
      })}
      <circle cx={size/2} cy={size/2} r={size/2-10} fill="none" stroke="#222" strokeWidth="2" />
    </svg>
  );
};

const LineGraph = ({ data, color = YELLOW, height = 180, months = 6 }) => {
  // Always show last N months on X axis
  const now = new Date();
  const monthLabels = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthLabels.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  const points = monthLabels.map(m => {
    const found = data && data.find(d => d.month === m);
    return { month: m, count: found ? found.count : 0 };
  });
  const max = Math.max(1, ...points.map(d => d.count));
  const width = 320;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="mx-auto relative">
      {/* Grid */}
      {[0, 0.25, 0.5, 0.75, 1].map((v, idx) => (
        <line
          key={idx}
          x1={0} x2={width} y1={30 + v * 130} y2={30 + v * 130}
          stroke="#2C333A" strokeDasharray="4 4" strokeWidth="1"
        />
      ))}
      {/* Polyline */}
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="3"
        points={points.map((d, i) => `${(i/(points.length-1))*width},${height-((d.count/max)*(height-30))}`).join(' ')}
      />
      {/* Dots */}
      {points.map((d, i) => (
        <circle
          key={i}
          cx={(i/(points.length-1))*width}
          cy={height-((d.count/max)*(height-30))}
          r="5"
          fill={CYAN}
        />
      ))}
      {/* X labels */}
      {points.map((d, i) => (
        <text
          key={i}
          x={(i/(points.length-1))*width}
          y={height-5}
          textAnchor="middle"
          fontSize="12"
          fill="#38C7D7"
        >{d.month}</text>
      ))}
      {/* Y axis labels */}
      {[max, Math.round(max*0.75), Math.round(max*0.5), Math.round(max*0.25), 0].map((v, idx) => (
        <text
          key={idx}
          x={0}
          y={30 + idx * 32}
          textAnchor="start"
          fontSize="11"
          fill="#888"
        >{v}</text>
      ))}
      {/* Placeholder if no data */}
      {(!data || !data.length || points.every(p => p.count === 0)) && (
        <g>
          <text x={width/2} y={height/2-10} textAnchor="middle" fontSize="40" fill="#444">⏳</text>
          <text x={width/2} y={height/2+30} textAnchor="middle" fontSize="16" fill="#888">Nessuna partita giocata di recente</text>
        </g>
      )}
    </svg>
  );
};

const StatsPage = () => {
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState(null);
  const [globalStats, setGlobalStats] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      const userProfile = await getCurrentUserProfile();
      if (!userProfile.success) return;
      setUser(userProfile.data);
      const userMatches = await getUserFinishedMatches(userProfile.data.nickname || userProfile.data.uid);
      const allMatches = await getAllFinishedMatches();

      // Statistiche utente
      const gamesPlayed = userMatches.length;
      const gamesWon = userMatches.filter(m => {
        const winner = m.winner;
        const idx = m.players.findIndex(p => p && (p.name === userProfile.data.nickname));
        return String(winner) === String(idx);
      }).length;
      const winRate = gamesPlayed ? Math.round((gamesWon / gamesPlayed) * 100) : 0;
      const placements = getPlacementStats(userMatches, userProfile.data.nickname);
      const bestPlacement = placements.length ? Math.min(...placements) : '-';
      const avgPlacement = placements.length ? (placements.reduce((a,b) => a+b,0)/placements.length).toFixed(2) : '-';
      const placementDist = placements.reduce((acc, p) => { acc[p] = (acc[p]||0)+1; return acc; }, {});
      const placementData = Object.entries(placementDist).map(([place, count]) => ({ place, count }));
      const modeData = getModeStats(userMatches);
      const timelineData = getTimelineStats(userMatches);

      setUserStats({
        gamesPlayed,
        gamesWon,
        winRate,
        bestPlacement,
        avgPlacement,
        placementData,
        modeData,
        timelineData
      });

      // Statistiche globali
      const globalGames = allMatches.length;
      const globalWins = allMatches.length; // ogni partita ha un vincitore
      const globalPlacements = getPlacementStats(allMatches, null); // tutti i piazzamenti
      const globalAvgPlacement = globalPlacements.length ? (globalPlacements.reduce((a,b) => a+b,0)/globalPlacements.length).toFixed(2) : '-';
      setGlobalStats({
        globalGames,
        globalAvgPlacement
      });
      setLoading(false);
    }
    fetchStats();
  }, []);

  if (loading || !userStats) {
    return (
      <>
        <Navbar mode="lobby" />
        <PageContainer>
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-white text-xl">Caricamento statistiche...</div>
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Navbar mode="lobby" />
      <PageContainer>
        <div className="max-w-6xl mx-auto pt-20">
          <h1 className="text-3xl font-bold text-white mb-2">Statistiche</h1>
          <p className="text-gray-400 mb-8">Le tue performance e il confronto con la media globale</p>
          <Highlights stats={userStats} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <Card className="p-6">
              <div className="text-lg text-white font-bold mb-4">Distribuzione Piazzamenti</div>
              <BarGraph data={userStats.placementData} />
            </Card>
            <Card className="p-6">
              <div className="text-lg text-white font-bold mb-4">Andamento Partite nel Tempo</div>
              <LineGraph data={userStats.timelineData} />
            </Card>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="flex flex-col items-center justify-center py-8">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-2xl text-white font-bold">Piazzamento Medio</div>
                <span className="text-gray-400 text-base" title="La posizione più alta mai raggiunta in una partita. 1 = vittoria">ⓘ</span>
              </div>
              <div className="text-5xl font-extrabold text-cyan-400 mb-2">{userStats.avgPlacement}</div>
              <div className="text-gray-400">Media globale: <span className="text-yellow-400 font-semibold">{globalStats.globalAvgPlacement}</span></div>
            </Card>
            <Card className="flex flex-col items-center justify-center py-8">
              <div className="text-2xl text-white font-bold mb-2">Partite Giocate</div>
              <div className="text-5xl font-extrabold text-cyan-400 mb-2">{userStats.gamesPlayed}</div>
              <div className="text-gray-400">Media globale: <span className="text-yellow-400 font-semibold">{globalStats.globalGames}</span></div>
            </Card>
          </div>
          <div className="mt-12 text-center">
            <Button variant="outline" size="md" onClick={() => window.location.reload()}>
              Aggiorna Statistiche
            </Button>
          </div>
        </div>
      </PageContainer>
    </>
  );
};

export default StatsPage;
