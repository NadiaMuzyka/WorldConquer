import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Flag } from 'lucide-react';

export default function Home() {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-[#1c1c1c] to-gray-900 text-white">
            <div className="text-center space-y-8 p-8">
                {/* Logo e Titolo */}
                <div className="flex flex-col items-center gap-4">
                    <div className="relative w-24 h-24 flex items-center justify-center">
                        <Flag className="w-20 h-20 text-[#38C7D7] fill-current drop-shadow-lg" />
                    </div>
                    <h1 className="font-bold text-5xl text-white tracking-wide">
                        WorldConquer
                    </h1>
                    <p className="text-gray-400 text-lg max-w-md">
                        Conquista il mondo e domina i tuoi avversari in questa epica battaglia strategica
                    </p>
                </div>

                {/* Bottone Login */}
                <button
                    onClick={() => navigate('/login')}
                    className="mt-12 px-12 py-4 bg-[#38C7D7] hover:bg-[#2dbdc0] text-[#192832] font-bold text-xl rounded-full transition-all transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-[#38C7D7]/50"
                >
                    Fai il Login
                </button>
            </div>
        </div>
    );
};