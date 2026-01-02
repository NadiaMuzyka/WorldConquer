import React, { useState } from 'react';
import { login, loginWithGoogle } from '../firebase/auth';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Button from '../components/UI/Button';
import GoogleLogo from '../components/Constants/GoogleLogo';

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
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
            <form onSubmit={handleLogin} className="p-8 bg-gray-800 rounded shadow-xl w-80">
                <h2 className="text-xl mb-4 text-center">WorldConquer Login</h2>
                {(error || errorProp) && <p className="text-red-500 text-sm mb-2">{error || errorProp}</p>}
                <input
                    className="w-full mb-2 p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
                    type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    className="w-full mb-4 p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
                    type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)}
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
            </form>
        </div>
    );
};