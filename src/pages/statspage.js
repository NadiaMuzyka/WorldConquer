import React from 'react';
import Navbar from '../components/Navbar/Navbar';
import PageContainer from '../components/UI/PageContainer';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';

// Placeholder per i grafici (da sostituire con una libreria tipo Recharts/Chart.js)
const StatChart = ({ title, value, average, type }) => (
  <Card className="flex flex-col items-center justify-center gap-2 w-full max-w-xs mx-auto">
    <div className="text-lg text-white font-bold">{title}</div>
    <div className="text-4xl text-cyan-400 font-extrabold">{value}</div>
    {average !== undefined && (
      <div className="text-sm text-gray-400">Media globale: <span className="text-cyan-300 font-semibold">{average}</span></div>
    )}
    {/* Qui andrà il grafico vero e proprio */}
    <div className="w-full h-24 bg-gray-700 rounded-lg mt-2 flex items-center justify-center text-gray-500 text-xs">
      [Grafico {type}]
    </div>
  </Card>
);

const StatsPage = () => {
  // TODO: Fetch dati reali da Firestore e calcolare statistiche
  // Esempio dati statici
  const stats = [
    { title: 'Partite giocate', value: 42, average: 30, type: 'bar' },
    { title: 'Vittorie', value: 12, average: 8, type: 'pie' },
    { title: 'Win Rate', value: '28%', average: '21%', type: 'radar' },
    { title: 'Piazzamento medio', value: 2.3, average: 3.1, type: 'line' },
    { title: 'Eliminazioni fatte', value: 25, average: 15, type: 'bar' },
    { title: 'Eliminazioni subite', value: 10, average: 12, type: 'bar' },
  ];

  return (
    <>
      <Navbar mode="lobby" />
      <PageContainer>
        <div className="max-w-5xl mx-auto pt-20">
          <h1 className="text-3xl font-bold text-white mb-2">Statistiche</h1>
          <p className="text-gray-400 mb-8">Le tue performance e il confronto con la media globale</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {stats.map((stat, idx) => (
              <StatChart key={idx} {...stat} />
            ))}
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
