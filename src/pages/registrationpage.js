import React, { useState, useEffect } from 'react';
import { register } from '../firebase/auth';
import { saveUserData } from '../firebase/db';
import { useNavigate } from 'react-router-dom';
import { Mail, User, AtSign } from 'lucide-react';
import Button from '../components/UI/Button';
import TextInput from '../components/UI/Input/TextInput';
import PasswordInput from '../components/UI/Input/PasswordInput';
import DateInput from '../components/UI/Input/DateInput';
import Form from '../components/UI/Form';
import PageContainer from '../components/UI/PageContainer';
import auth from '../firebase/auth';

export const RegistrationPage = ({ isCompleteProfile = false, currentUserEmail = null }) => {
    const navigate = useNavigate();
    
    // Verifica autenticazione se in modalità complete profile
    useEffect(() => {
        if (isCompleteProfile && !auth.currentUser) {
            navigate('/login');
        }
    }, [isCompleteProfile, navigate]);

    // Stati per i campi del form
    const [formData, setFormData] = useState({
        email: currentUserEmail || '',
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
        // Pulisci errore quando l'utente modifica
        if (error) setError('');
    };

    // Validazione del form
    const validateForm = () => {
        // Validazione campi comuni
        if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.nickname.trim() || !formData.birthDate) {
            setError('Tutti i campi obbligatori devono essere compilati');
            return false;
        }

        // Validazione email e password solo se NON è complete profile
        if (!isCompleteProfile) {
            if (!formData.email.trim() || !formData.password) {
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
            let userId;

            if (isCompleteProfile) {
                // Modalità complete profile - utente già autenticato
                const user = auth.currentUser;
                if (!user) {
                    setError('Sessione scaduta. Effettua nuovamente il login.');
                    navigate('/login');
                    return;
                }
                userId = user.uid;
            } else {
                // Modalità registrazione normale - crea nuovo utente
                const authResult = await register(formData.email, formData.password);
                
                if (!authResult.success) {
                    setError(authResult.error);
                    setLoading(false);
                    return;
                }
                userId = authResult.user.uid;
            }

            // Salva i dati aggiuntivi su Firestore
            const userData = {
                email: isCompleteProfile ? auth.currentUser.email : formData.email,
                firstName: formData.firstName,
                lastName: formData.lastName,
                nickname: formData.nickname,
                birthDate: formData.birthDate,
                photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.nickname}`
            };

            const dbResult = await saveUserData(userId, userData);

            if (!dbResult.success) {
                setError('Account creato ma errore nel salvataggio dati. Riprova più tardi.');
                setLoading(false);
                return;
            }

            // Successo! Redirect alla lobby
            navigate('/lobby');

        } catch (err) {
            setError('Errore imprevisto durante la registrazione');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageContainer centered={true}>
            <Form 
                title={isCompleteProfile ? "Completa il tuo Profilo" : "Registrazione WorldConquer"}
                error={error}
                onSubmit={handleRegister}
            >
            {/* Email read-only se complete profile */}
            {isCompleteProfile && currentUserEmail && (
                <div className="mb-6 p-3 bg-[#38C7D7]/10 border border-[#38C7D7]/30 rounded-lg">
                    <p className="text-sm text-gray-300">
                        <span className="font-semibold text-[#38C7D7]">Email:</span> {currentUserEmail}
                    </p>
                </div>
            )}

            {/* Campi Email e Password - solo se NON è complete profile */}
            {!isCompleteProfile && (
                <>
                    <TextInput

                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="email@esempio.com"
                        icon={Mail}
                        required
                    />

                    <PasswordInput
                        label="Password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Minimo 6 caratteri"
                        minLength={6}
                        required
                    />

                    <PasswordInput
                        label="Conferma Password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Ripeti la password"
                        minLength={6}
                        required
                    />
                </>
            )}

            {/* Campi comuni a entrambe le modalità */}
            <TextInput
                label="Nome"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Mario"
                icon={User}
                required
            />

            <TextInput
                label="Cognome"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Rossi"
                icon={User}
                required
            />

            <TextInput
                label="Nickname"
                name="nickname"
                type="text"
                value={formData.nickname}
                onChange={handleChange}
                placeholder={isCompleteProfile ? "mario_pro" : "Il tuo nome in gioco"}
                icon={AtSign}
                required
            />

            <DateInput
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                required
            />

            {/* Bottone Registrazione */}
            <Button
                type="submit"
                variant="cyan"
                size="lg"
                className="w-full"
                disabled={loading}
            >
                {loading 
                    ? (isCompleteProfile ? 'Salvataggio...' : 'Registrazione...') 
                    : (isCompleteProfile ? 'Completa Registrazione' : 'Registrati')
                }
            </Button>

            {/* Link al Login - solo in modalità registrazione normale */}
            {!isCompleteProfile && (
                <div className="mt-4 text-center text-sm text-gray-400">
                    Hai già un account?{' '}
                    <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="text-[#38C7D7] hover:underline font-medium"
                    >
                        Accedi qui
                    </button>
                </div>
            )}
        </Form>
        </PageContainer>
    );
};

export default RegistrationPage;