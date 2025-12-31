import React, { useState } from 'react';
import { login, logout } from '../../firebase/auth';
import { useSelector } from 'react-redux';

export const LoginPage = ({ error: errorProp = "" }) => {
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
        }
    };

    const handleLogout = async () => {
        const result = await logout();
        if (!result.success) {
            setError(result.error);
        }
    };

    if (user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
                <div className="p-8 bg-gray-800 rounded shadow-xl w-80 text-center">
                    <h2 className="text-xl mb-4">Benvenuto!</h2>
                    <p className="text-gray-300 mb-2">Sei già loggato come:</p>
                    <p className="text-blue-400 font-semibold mb-6">{user.email}</p>
                    <button 
                        onClick={handleLogout}
                        className="w-full bg-red-600 py-2 rounded hover:bg-red-700 transition"
                    >
                        Logout
                    </button>
                </div>
            </div>
        );
    }

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
                <button className="w-full bg-blue-600 py-2 rounded hover:bg-blue-700 transition">
                    Accedi
                </button>
            </form>
        </div>
    );
};