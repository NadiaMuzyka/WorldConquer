import React, { useState } from 'react';
import { login, loginWithGoogle } from '../firebase/auth';
import { getUserData } from '../firebase/db';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import Button from '../components/UI/Button';
import GoogleLogo from '../components/Constants/GoogleLogo';
import TextInput from '../components/UI/TextInput';
import AuthForm from '../components/UI/AuthForm';

export const LoginPage = ({ error: errorProp = "" }) => {

    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(errorProp);

    const handleLogin = async (e) => {
        e.preventDefault();
        const result = await login(email, password);
        if (!result.success) {
            setError(result.error);
        } else {
            setError("");
            navigate('/lobby');
        }
    };

    const handleGoogleLogin = async () => {
        const result = await loginWithGoogle();
        if (!result.success) {
            setError(result.error);
            return;
        }
        
        setError("");
        
        // Se è un nuovo utente, controlla se ha già completato il profilo
        if (result.isNewUser) {
            // Nuovo utente Google - deve completare il profilo
            navigate('/complete-profile');
            return;
        }
        
        // Utente esistente - controlla se ha i dati in Firestore
        const userData = await getUserData(result.user.uid);
        
        if (!userData.success || !userData.data) {
            // Dati non trovati - deve completare il profilo
            navigate('/complete-profile');
        } else {
            // Dati presenti - vai alla lobby
            navigate('/lobby');
        }
    };

    return (
        <AuthForm 
            title="WorldConquer Login"
            error={error || errorProp}
            onSubmit={handleLogin}
        >
            <TextInput
                variant="auth"
                label="Email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                icon={Mail}
                required
            />

            <TextInput
                variant="auth"
                label="Password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="mb-4"
            />
            
            <Button
                type="submit"
                variant="cyan"
                size="lg"
                className="w-full"
            >
                Accedi
            </Button>

            <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-800 text-gray-400">oppure</span>
                </div>
            </div>

            <Button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full bg-white text-gray-700 hover:bg-gray-100 border-transparent gap-2 whitespace-nowrap"
                size="lg"
            >
                <GoogleLogo />
                Accedi con Google
            </Button>

            {/* Link alla Registrazione */}
            <div className="mt-6 text-center text-sm text-gray-400">
                Non hai un account?{' '}
                <button
                    type="button"
                    onClick={() => navigate('/register')}
                    className="text-[#38C7D7] hover:underline font-medium"
                >
                    Registrati qui
                </button>
            </div>
        </AuthForm>
    );
};