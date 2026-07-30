import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Flag, Globe, Shield, Zap, BookOpen, ArrowRight } from 'lucide-react';
import Button from '../components/UI/Button';
import PageContainer from '../components/UI/PageContainer';

export default function Home() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#173C55] font-roboto overflow-x-hidden">
            {/* HERO SECTION */}
            <div className="relative w-full pt-20 pb-16 flex flex-col items-center justify-center min-h-[70vh] bg-gradient-to-b from-[#1A1F25] to-[#173C55]">
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                    {/* Background abstract elements */}
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#38C7D7] rounded-full mix-blend-overlay filter blur-[100px] animate-pulse"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#FEC417] rounded-full mix-blend-overlay filter blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
                </div>

                <div className="relative z-10 text-center space-y-8 p-6 max-w-4xl mx-auto animate-fadeInUp">
                    {/* Logo e Titolo */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative w-24 h-24 flex items-center justify-center bg-[#1B2227] rounded-full shadow-[0_0_30px_rgba(56,199,215,0.3)]">
                            <Flag className="w-12 h-12 text-[#38C7D7] fill-current drop-shadow-lg" />
                        </div>
                        <h1 className="font-black text-5xl md:text-7xl text-white tracking-tight mt-6">
                            World<span className="text-[#38C7D7]">Conquer</span>
                        </h1>
                        <p className="text-gray-300 text-lg md:text-xl max-w-2xl mt-4 leading-relaxed">
                            Domina i tuoi avversari in questa epica battaglia strategica. Conquista territori, forma alleanze e diventa il padrone del mondo.
                        </p>
                    </div>

                    {/* Bottoni Azione */}
                    <div className="flex flex-col sm:flex-row justify-center gap-4 mt-12">
                        <Button
                            onClick={() => navigate('/login')}
                            variant="cyan"
                            size="lg"
                            className="px-10 py-4 text-xl shadow-[0_0_20px_rgba(56,199,215,0.4)] hover:shadow-[0_0_30px_rgba(56,199,215,0.6)] group"
                        >
                            Gioca Ora
                            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        <Button
                            onClick={() => navigate('/rules')}
                            variant="outline"
                            size="lg"
                            className="px-8 py-4 text-xl bg-[#1B2227] border-gray-600 text-white gap-2"
                        >
                            <BookOpen className="w-5 h-5" />
                            Come Giocare
                        </Button>
                    </div>
                </div>
            </div>

            {/* FEATURES SECTION */}
            <div className="w-full py-20 px-6 bg-[#173C55]">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Perché giocare a WorldConquer?</h2>
                        <div className="w-20 h-1 bg-[#38C7D7] mx-auto rounded-full"></div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="bg-[#1B2227] p-8 rounded-2xl shadow-xl border border-gray-700 hover:-translate-y-2 transition-transform duration-300 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
                            <div className="w-14 h-14 bg-cyan-900/30 rounded-xl flex items-center justify-center mb-6">
                                <Globe className="w-8 h-8 text-[#38C7D7]" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Mappa Globale</h3>
                            <p className="text-gray-400 leading-relaxed">
                                Esplora e conquista decine di territori attraverso i 6 continenti in una mappa interattiva mozzafiato.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-[#1B2227] p-8 rounded-2xl shadow-xl border border-gray-700 hover:-translate-y-2 transition-transform duration-300 animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
                            <div className="w-14 h-14 bg-yellow-900/30 rounded-xl flex items-center justify-center mb-6">
                                <Shield className="w-8 h-8 text-[#FEC417]" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Obiettivi Segreti</h3>
                            <p className="text-gray-400 leading-relaxed">
                                Ogni giocatore ha una missione segreta. Inganna i tuoi nemici e colpisci quando meno se lo aspettano.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-[#1B2227] p-8 rounded-2xl shadow-xl border border-gray-700 hover:-translate-y-2 transition-transform duration-300 animate-fadeInUp" style={{ animationDelay: '0.5s' }}>
                            <div className="w-14 h-14 bg-green-900/30 rounded-xl flex items-center justify-center mb-6">
                                <Zap className="w-8 h-8 text-[#27CA40]" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Multiplayer in Tempo Reale</h3>
                            <p className="text-gray-400 leading-relaxed">
                                Sfida i tuoi amici o giocatori da tutto il mondo in partite dinamiche e senza lag.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* FOOTER SEMPLICE */}
            <footer className="w-full bg-[#1A1F25] py-8 text-center border-t border-gray-800">
                <p className="text-gray-500 text-sm">
                    © {new Date().getFullYear()} WorldConquer. Tutti i diritti riservati.
                </p>
            </footer>
        </div>
    );
};