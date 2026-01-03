import React from 'react';
import { RegistrationPage } from './registrationpage';
import auth from '../firebase/auth';

/**
 * Pagina per completare il profilo dopo login Google
 * Usa RegistrationPage in modalità "complete profile"
 */
const CompleteProfilePage = () => {
  return (
    <RegistrationPage 
      isCompleteProfile={true}
      currentUserEmail={auth.currentUser?.email}
    />
  );
};

export default CompleteProfilePage;
