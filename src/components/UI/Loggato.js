import React, { useState } from 'react';
import { logout } from '../../firebase/auth';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

export const LoggatoPage = ({ error: errorProp = "" }) => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(errorProp);

    // Puoi leggere lo stato dal tuo nuovo slice
    const { user } = useSelector((state) => state.auth);



    const handleLogout = async () => {
        const result = await logout();
        if (!result.success) {
            setError(result.error);
        } else {
            navigate('/login');
        }
    };

    // Se l'utente non è loggato, reindirizza al login
    if (!user) {
        navigate('/login');
        return null;
    }

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



};