import React from 'react';
import PageContainer from '../components/UI/PageContainer';
import { Loader2 } from 'lucide-react';

const LobbyLoading = ({ message = "Caricamento lobby..." }) => (
  <PageContainer className="font-roboto">
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-[#38C7D7] animate-spin mx-auto mb-4" />
        <p className="text-white">{message}</p>
      </div>
    </div>
  </PageContainer>
);

export default LobbyLoading;
