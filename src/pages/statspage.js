import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar/Navbar';
import PageContainer from '../components/UI/PageContainer';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { getCurrentUserProfile, getUserFinishedMatches } from '../firebase/db';
import { LineChart } from '@mui/x-charts/LineChart';

function getTimelineStats(matches) {
  // Conta partite per giorno (formato 'gg/mm')
  const byDay = {};
  matches.forEach(m => {
    const d = m.createdAt && m.createdAt.toDate ? m.createdAt.toDate() : new Date(m.createdAt);
    // Formatta la data come 'gg/mm'
    const key = d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
    byDay[key] = (byDay[key] || 0) + 1;
  });
  return Object.entries(byDay).map(([date, count]) => ({ date, count }));
}

const Highlights = ({ stats }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 mt-10">
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
  </div>
);

const StatsPage = () => {
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      const userProfile = await getCurrentUserProfile();
      if (!userProfile.success) return;
      const userMatches = await getUserFinishedMatches(userProfile.data.nickname || userProfile.data.uid);

      // Statistiche utente
      const gamesPlayed = userMatches.length;
      const gamesWon = userMatches.filter(m => {
        const winner = m.winner;
        const idx = m.players.findIndex(p => p && (p.name === userProfile.data.nickname));
        return String(winner) === String(idx);
      }).length;
      const winRate = gamesPlayed ? Math.round((gamesWon / gamesPlayed) * 100) : 0;
      const timelineData = getTimelineStats(userMatches);

      setUserStats({
        gamesPlayed,
        gamesWon,
        winRate,
        timelineData
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

  const last7DaysData = [...Array(7)].map((_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (6 - i)); // Calcola i giorni da 6 giorni fa a oggi
  const dateStr = date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
  
  // Cerca se esiste una partita in questa data nei tuoi userStats
  // Nota: adatta 'd.month' o 'd.date' in base a come ricevi i dati dal server
  const match = userStats.timelineData.find(d => d.date === dateStr || d.month === dateStr);
  
  return {
    date: dateStr,
    count: match ? match.count : 0 // Se non c'è, mette 0 invece di lasciare il vuoto
  };
});

  return (
    <>
      <Navbar mode="lobby" />
      <PageContainer>
        <div className="max-w-6xl mx-auto pt-20">
          <h1 className="text-3xl font-bold text-white mb-2">Statistiche</h1>
          <p className="text-gray-400 mb-8">Le tue performance e il confronto con la media globale</p>

          <Highlights stats={userStats} />
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <Card className="p-6">
              <div className="text-lg text-white font-bold mb-4">Numero partite giocate nel tempo</div>
              <div className="w-full px-2 py-4">
                <LineChart
                  height={240}
                  // Riduciamo i margini per "attaccare" gli assi ai bordi del box
                  margin={{ top: 10, right: 40, bottom: 10, left: 0 }}
                  series={[
                    {
                      data: last7DaysData.map((d) => d.count),
                      color: '#38C7D7',
                      area: true,
                      showMark: true,
                      curve: 'linear',
                    },
                  ]}
                  xAxis={[
                    {
                      scaleType: 'point',
                      data: last7DaysData.map((d) => d.date), // Es: ['Lun', 'Mar', 'Mer'...]
                    },
                  ]}
                  yAxis={[
                    {
                      min: 0,
                      max: Math.max(...last7DaysData.map(d => d.count), 1) + 1,
                      tickMinStep: 1,
                      valueFormatter: (v) => Math.floor(v).toString(),
                    },
                  ]}
                  // Nascondiamo la legenda se vuoi pulizia assoluta, o la mettiamo dentro
                  slotProps={{
                    legend: { hidden: true }
                  }}
                  sx={{
                    background: '#1B2227',
                    borderRadius: '16px',
                    width: '100%',
                    // Rimuove eventuali padding interni del componente
                    padding: 0,
                    '& .MuiChartsAxis-tickLabel': {
                      fill: '#FFFFFF !important',
                      fontSize: '10px',
                    },
                    '& .MuiChartsAxis-directionX .MuiChartsAxis-tickLabel': {
                      dy: '10px', // Sposta le etichette X più in basso
                    },
                    '& .MuiChartsAxis-line': { stroke: '#FFFFFF !important' },
                    '& .MuiChartsAxis-tick': { stroke: '#FFFFFF !important' },
                    '& .MuiLineElement-root': { strokeWidth: 3 },
                    '& .MuiAreaElement-root': { fillOpacity: 0.15 },
                    '& .MuiChartsGrid-line': { stroke: '#ffffff11' },
                  }}
                  grid={{ horizontal: true }}
                />
              </div>
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
