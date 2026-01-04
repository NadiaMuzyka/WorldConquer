import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Flag } from 'lucide-react';
import Button from '../components/UI/Button';
import PageContainer from '../components/UI/PageContainer';

export default function Home() {
    const navigate = useNavigate();

    return (
        <PageContainer centered={true}>
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
                <div className="flex justify-center mt-12">
                    <Button
                        onClick={() => navigate('/login')}
                        variant="cyan"
                        size="md"
                        className="px-12 py-4 text-xl"
                    >
                        Fai il Login
                    </Button>
                </div>
            </div>
        </PageContainer>
    );
};