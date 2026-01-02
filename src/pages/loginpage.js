import React, { useState } from 'react';
import { login, loginWithGoogle } from '../firebase/auth';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Button from '../components/UI/Button';
import GoogleLogo from '../components/Constants/GoogleLogo';
import TextInput from '../components/UI/TextInput';
import AuthForm from '../components/UI/AuthForm';

export const LoginPage = ({ error: errorProp = "" }) => {

    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(errorProp);

    // Puoi leggere lo stato dal tuo nuovo slice
    const { user } = useSelector((state) => state.auth);

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
        } else {
            setError("");
            navigate('/lobby');
        }
    };

    return (
        <AuthForm 
            title="WorldConquer Login"
            error={error || errorProp}
            onSubmit={handleLogin}
            className="w-80"
        >
            <TextInput
                variant="auth"
                label="Email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
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