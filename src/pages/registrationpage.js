import React, { useState } from 'react';
import { register } from '../firebase/auth';
import { saveUserData } from '../firebase/db';
import { useNavigate } from 'react-router-dom';
import Button from '../components/UI/Button';
import TextInput from '../components/UI/TextInput';
import AuthForm from '../components/UI/AuthForm';

export const RegistrationPage = () => {
    const navigate = useNavigate();
    
    // Stati per i campi del form
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        nickname: '',
        birthDate: ''
    });
    
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Handler per aggiornare i campi
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // Validazione del form
    const validateForm = () => {
        if (!formData.email || !formData.password || !formData.firstName || 
            !formData.lastName || !formData.nickname || !formData.birthDate) {
            setError('Tutti i campi obbligatori devono essere compilati');
            return false;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Le password non coincidono');
            return false;
        }

        if (formData.password.length < 6) {
            setError('La password deve essere di almeno 6 caratteri');
            return false;
        }

        return true;
    };

    // Handler per la registrazione
    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            // 1. Registra l'utente su Firebase Auth
            const authResult = await register(formData.email, formData.password);
            
            if (!authResult.success) {
                setError(authResult.error);
                setLoading(false);
                return;
            }

            // 2. Salva i dati aggiuntivi su Firestore
            const userData = {
                email: formData.email,
                firstName: formData.firstName,
                lastName: formData.lastName,
                nickname: formData.nickname,
                birthDate: formData.birthDate,
                photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.nickname}`
            };

            const dbResult = await saveUserData(authResult.user.uid, userData);

            if (!dbResult.success) {
                setError('Account creato ma errore nel salvataggio dati. Riprova più tardi.');
                setLoading(false);
                return;
            }

            // 3. Successo! Redirect alla lobby
            navigate('/lobby');

        } catch (err) {
            setError('Errore imprevisto durante la registrazione');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthForm 
            title="Registrazione WorldConquer"
            error={error}
            onSubmit={handleRegister}
        >
            <TextInput
                variant="auth"
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@esempio.com"
                required
            />

            <TextInput
                variant="auth"
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimo 6 caratteri"
                required
            />

            <TextInput
                variant="auth"
                label="Conferma Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Ripeti la password"
                required
            />

            <TextInput
                variant="auth"
                label="Nome"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Mario"
                required
            />

            <TextInput
                variant="auth"
                label="Cognome"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Rossi"
                required
            />

            <TextInput
                variant="auth"
                label="Nickname"
                name="nickname"
                type="text"
                value={formData.nickname}
                onChange={handleChange}
                placeholder="Il tuo nome in gioco"
                required
            />

            <TextInput
                variant="auth"
                label="Data di Nascita"
                name="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={handleChange}
                required
                className="mb-4"
            />

            {/* Bottone Registrazione */}
            <Button
                type="submit"
                variant="cyan"
                size="lg"
                className="w-full"
                disabled={loading}
            >
                {loading ? 'Registrazione...' : 'Registrati'}
            </Button>

            {/* Link al Login */}
            <div className="mt-4 text-center text-sm text-gray-400">
                Hai già un account?{' '}
                <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="text-[#38C7D7] hover:underline"
                >
                    Accedi qui
                </button>
            </div>
        </AuthForm>
    );
};

export default RegistrationPage;