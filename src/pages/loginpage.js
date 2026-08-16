import React, { useState } from 'react';
import { login, loginWithGoogle } from '../firebase/auth';
import { getUserData } from '../firebase/db';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Mail } from 'lucide-react';
import Button from '../components/UI/Button';
import GoogleLogo from '../components/Constants/GoogleLogo';
import TextInput from '../components/UI/Input/TextInput';
import PasswordInput from '../components/UI/Input/PasswordInput';
import Form from '../components/UI/Form';
import PageContainer from '../components/UI/PageContainer';
import { setUser } from '../store/slices/userSlice';

export const LoginPage = ({ error: errorProp = "" }) => {

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(errorProp);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    // Distingue quale bottone ha avviato il login, così il testo "in corso..."
    // non compare anche sull'altro metodo di accesso non selezionato.
    const [loginMethod, setLoginMethod] = useState(null); // 'email' | 'google'

    // Popola subito lo stato Redux dell'utente e lo restituisce, senza aspettare
    // il listener onAuthStateChanged in index.js (che fa la stessa cosa in modo
    // asincrono). Necessario perché LobbyPage/CreateMatchPage reindirizzano a
    // /login se userStatus è ancora "unauthenticated" al mount: senza questo,
    // se lo stato precedente era "unauthenticated" (es. dopo un logout), la
    // navigazione a /lobby subito dopo il login vince la corsa contro il
    // listener e la pagina rimbalza immediatamente indietro al login.
    const syncUserToStore = async (firebaseUser) => {
        const isGoogleUser = firebaseUser.providerData.some(p => p.providerId === 'google.com');
        const result = await getUserData(firebaseUser.uid);
        if (!result.success) return false;
        dispatch(setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email,
            isGoogleUser,
            name: result.data.nickname || firebaseUser.email.split('@')[0],
            avatar: result.data.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
            ...result.data
        }));
        return true;
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginMethod('email');
        setIsLoggingIn(true);
        const result = await login(email, password);
        if (!result.success) {
            setError(result.error);
            setIsLoggingIn(false);
            return;
        }
        setError("");
        await syncUserToStore(result.user);
        setIsLoggingIn(false);
        navigate('/lobby');
    };

    const handleGoogleLogin = async () => {
        setLoginMethod('google');
        setIsLoggingIn(true);
        const result = await loginWithGoogle();
        if (!result.success) {
            setError(result.error);
            setIsLoggingIn(false);
            return;
        }

        setError("");

        // Se è un nuovo utente, controlla se ha già completato il profilo
        if (result.isNewUser) {
            // Nuovo utente Google - deve completare il profilo
            setIsLoggingIn(false);
            navigate('/complete-profile');
            return;
        }

        // Utente esistente - controlla se ha i dati in Firestore
        const synced = await syncUserToStore(result.user);

        if (!synced) {
            // Dati non trovati - deve completare il profilo
            navigate('/complete-profile');
        } else {
            // Dati presenti - vai alla lobby
            navigate('/lobby');
        }
        setIsLoggingIn(false);
    };

    return (
        <PageContainer centered={true}>
            <Form 
                title="WorldConquer Login"
                error={error || errorProp}
                onSubmit={handleLogin}
            >
            <TextInput
                label="Email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                icon={Mail}
                required
            />

            <PasswordInput
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
            />
            
            <Button
                type="submit"
                variant="cyan"
                size="lg"
                className="w-full mt-5"
                disabled={isLoggingIn}
            >
                {isLoggingIn && loginMethod === 'email' ? "Accesso..." : "Accedi"}
            </Button>

            <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-[#1B2227] text-gray-400">oppure</span>
                </div>
            </div>

            <Button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full bg-white text-gray-700 hover:bg-gray-100 border-transparent gap-2 whitespace-nowrap"
                size="lg"
                disabled={isLoggingIn}
            >
                <GoogleLogo />
                {isLoggingIn && loginMethod === 'google' ? "Accesso in corso..." : "Accedi con Google"}
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
            </Form>
        </PageContainer>
    );
};