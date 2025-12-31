import React, { useState } from 'react';
import { login } from '../../firebase/auth';
import { useSelector } from 'react-redux';

export const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // Puoi leggere lo stato dal tuo nuovo slice
    const { user } = useSelector((state) => state.auth);

    const handleLogin = async (e) => {
        e.preventDefault();
        const result = await login(email, password);
        if (!result.success) {
            setError(result.error);
        }
    };

    if (user) return <p>Sei già loggato come {user.email}</p>;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
            <form onSubmit={handleLogin} className="p-8 bg-gray-800 rounded shadow-xl w-80">
                <h2 className="text-xl mb-4 text-center">WorldConquer Login</h2>
                {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
                <input
                    className="w-full mb-2 p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
                    type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    className="w-full mb-4 p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
                    type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)}
                />
                <button className="w-full bg-blue-600 py-2 rounded hover:bg-blue-700 transition">
                    Accedi
                </button>
            </form>
        </div>
    );
};