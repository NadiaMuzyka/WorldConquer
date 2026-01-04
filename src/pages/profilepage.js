import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Calendar, AtSign, Shuffle } from 'lucide-react';
import { getCurrentUserProfile, updateCurrentUserProfile, updateCurrentUserAvatar } from '../firebase/db';
import { auth } from '../firebase/firebaseConfig';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import Navbar from '../components/Navbar/Navbar';
import Button from '../components/UI/Button';
import TextInput from '../components/UI/Input/TextInput';
import DateInput from '../components/UI/Input/DateInput';
import PasswordInput from '../components/UI/Input/PasswordInput';
import PageContainer from '../components/UI/PageContainer';
import Card from '../components/UI/Card';
import Avatar from '../components/UI/Avatar';

const ProfilePage = () => {
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Stato per cambio password
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    
    // Dati utente originali
    const [userData, setUserData] = useState({
        email: '',
        firstName: '',
        lastName: '',
        nickname: '',
        birthDate: '',
        photoURL: '',
        createdAt: null,
        isGoogleUser: false
    });

    // Dati del form (per la modalità editing)
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        nickname: '',
        birthDate: ''
    });

    // Carica i dati utente
    useEffect(() => {
        const loadUserData = async () => {
            try {
                const result = await getCurrentUserProfile();
                
                if (!result.success) {
                    if (result.error === 'Utente non autenticato') {
                        navigate('/login');
                        return;
                    }
                    setError('Errore nel caricamento dei dati');
                    setLoading(false);
                    return;
                }

                const data = result.data;
                setUserData({
                    email: data.email,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    nickname: data.nickname,
                    birthDate: data.birthDate,
                    photoURL: data.photoURL,
                    createdAt: data.createdAt,
                    isGoogleUser: data.isGoogleUser
                });
                setFormData({
                    firstName: data.firstName,
                    lastName: data.lastName,
                    nickname: data.nickname,
                    birthDate: data.birthDate
                });
            } catch (err) {
                setError('Errore nel caricamento del profilo');
            } finally {
                setLoading(false);
            }
        };

        loadUserData();
    }, [navigate]);

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleEdit = () => {
        setIsEditing(true);
        setError('');
        setSuccess('');
    };

    const handleCancel = () => {
        setIsEditing(false);
        setFormData({
            firstName: userData.firstName,
            lastName: userData.lastName,
            nickname: userData.nickname,
            birthDate: userData.birthDate
        });
        setError('');
        setSuccess('');
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validazione
        if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.nickname.trim() || !formData.birthDate) {
            setError('Tutti i campi sono obbligatori');
            return;
        }

        setLoading(true);

        try {
            // Se il nickname è cambiato, aggiorna anche l'avatar
            let updates = {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                nickname: formData.nickname.trim(),
                birthDate: formData.birthDate
            };

            if (formData.nickname.trim() !== userData.nickname) {
                updates.photoURL = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(formData.nickname.trim())}`;
            }

            const result = await updateCurrentUserProfile(updates);

            if (result.success) {
                setUserData({
                    ...userData,
                    ...updates
                });
                setIsEditing(false);
                setSuccess('Profilo aggiornato con successo!');
            } else {
                setError(result.error || 'Errore nell\'aggiornamento del profilo');
            }
        } catch (err) {
            setError('Errore nell\'aggiornamento del profilo');
        } finally {
            setLoading(false);
        }
    };

    const handleRegenerateAvatar = async () => {
        setLoading(true);
        try {
            const randomSeed = Math.random().toString(36).substring(7);
            const newPhotoURL = `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}`;
            
            const result = await updateCurrentUserAvatar(newPhotoURL);
            
            if (result.success) {
                setUserData({ ...userData, photoURL: newPhotoURL });
                setSuccess('Avatar aggiornato!');
            } else {
                setError(result.error || 'Errore nell\'aggiornamento dell\'avatar');
            }
        } catch (err) {
            setError('Errore nell\'aggiornamento dell\'avatar');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        // Validazioni
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            setPasswordError('Tutti i campi sono obbligatori');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setPasswordError('La nuova password deve contenere almeno 6 caratteri');
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError('Le password non coincidono');
            return;
        }

        if (passwordData.currentPassword === passwordData.newPassword) {
            setPasswordError('La nuova password deve essere diversa da quella attuale');
            return;
        }

        setLoading(true);

        try {
            const user = auth.currentUser;
            
            // Riautentica l'utente con la password corrente
            const credential = EmailAuthProvider.credential(user.email, passwordData.currentPassword);
            await reauthenticateWithCredential(user, credential);

            // Aggiorna la password
            await updatePassword(user, passwordData.newPassword);

            setPasswordSuccess('Password aggiornata con successo!');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            
            // Chiudi il form dopo 2 secondi
            setTimeout(() => {
                setIsChangingPassword(false);
                setPasswordSuccess('');
            }, 2000);

        } catch (err) {
            if (err.code === 'auth/wrong-password') {
                setPasswordError('Password attuale errata');
            } else if (err.code === 'auth/requires-recent-login') {
                setPasswordError('Per motivi di sicurezza, effettua nuovamente il login');
            } else {
                setPasswordError('Errore nell\'aggiornamento della password');
            }
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('it-IT', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
        });
    };

    if (loading && !userData.email) {
        return (
            <>
                <Navbar mode="lobby" />
                <PageContainer centered={true}>
                    <div className="text-white text-xl text-center">Caricamento...</div>
                </PageContainer>
            </>
        );
    }

    return (
        <>
            <Navbar mode="lobby" userAvatar={userData.photoURL || undefined} />
            <PageContainer>
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-8 pt-20">
                        <h1 className="text-3xl font-bold text-white mb-2">Il tuo Profilo</h1>
                        <p className="text-gray-400">Gestisci le tue informazioni personali</p>
                    </div>

                    {/* Messaggi di successo/errore */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-600/20 border border-red-600 rounded-lg text-red-400">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-6 p-4 bg-green-600/20 border border-green-600 rounded-lg text-green-400">
                            {success}
                        </div>
                    )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* Colonna sinistra - Avatar */}
                        <div className="lg:col-span-5">
                            <Card className="text-center sticky top-24">
                            <Avatar
                                src={userData.photoURL}
                                alt={userData.nickname}
                                firstName={userData.firstName}
                                lastName={userData.lastName}
                                nickname={userData.nickname}
                                size="lg"
                                className="mb-4"
                            />
                            
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRegenerateAvatar}
                                disabled={loading}
                                className="w-full"
                            >
                                <Shuffle className="w-4 h-4 mr-2" />
                                Cambia Avatar
                            </Button>
                        </Card>
                    </div>

                    {/* Colonna destra - Informazioni */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* Sezione Informazioni Personali */}
                        <Card>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white">Informazioni Personali</h3>
                                {!isEditing && (
                                    <Button
                                        variant="cyan"
                                        size="sm"
                                        onClick={handleEdit}
                                    >
                                        Modifica
                                    </Button>
                                )}
                            </div>

                            <form onSubmit={handleSave} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <TextInput
                                        label="Nome"
                                        name="firstName"
                                        type="text"
                                        value={isEditing ? formData.firstName : userData.firstName}
                                        onChange={handleInputChange}
                                        disabled={!isEditing}
                                        icon={User}
                                        required
                                    />
                                    <TextInput
                                        label="Cognome"
                                        name="lastName"
                                        type="text"
                                        value={isEditing ? formData.lastName : userData.lastName}
                                        onChange={handleInputChange}
                                        disabled={!isEditing}
                                        icon={User}
                                        required
                                    />
                                </div>

                                <TextInput
                                    label="Nickname"
                                    name="nickname"
                                    type="text"
                                    value={isEditing ? formData.nickname : userData.nickname}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    icon={AtSign}
                                    required
                                />

                                <DateInput
                                    name="birthDate"
                                    value={isEditing ? formData.birthDate : userData.birthDate}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    required
                                />

                                {isEditing && (
                                    <div className="flex gap-3 pt-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleCancel}
                                            className="flex-1"
                                        >
                                            Annulla
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="cyan"
                                            disabled={loading}
                                            className="flex-1"
                                        >
                                            {loading ? 'Salvataggio...' : 'Salva Modifiche'}
                                        </Button>
                                    </div>
                                )}
                            </form>
                        </Card>

                        {/* Sezione Account */}
                        <Card>
                            <h3 className="text-xl font-bold text-white mb-6">Informazioni Account</h3>
                            
                            <div className="space-y-4">
                                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                                    <div className="flex items-center gap-3">
                                        <Mail className="w-5 h-5 text-[#38C7D7]" />
                                        <span className="text-gray-400">Email</span>
                                    </div>
                                    <span className="text-white">{userData.email}</span>
                                </div>

                                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-5 h-5 text-[#38C7D7]" />
                                        <span className="text-gray-400">Data Registrazione</span>
                                    </div>
                                    <span className="text-white">{formatDate(userData.createdAt)}</span>
                                </div>

                                <div className="flex items-center justify-between py-3">
                                    <div className="flex items-center gap-3">
                                        <User className="w-5 h-5 text-[#38C7D7]" />
                                        <span className="text-gray-400">Tipo Account</span>
                                    </div>
                                    <span className="text-white">
                                        {userData.isGoogleUser ? 'Google' : 'Email/Password'}
                                    </span>
                                </div>
                            </div>
                        </Card>

                        {/* Sezione Sicurezza */}
                        {!userData.isGoogleUser && (
                            <Card>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold text-white">Sicurezza</h3>
                                    {!isChangingPassword && (
                                        <Button
                                            variant="cyan"
                                            size="sm"
                                            onClick={() => {
                                                setIsChangingPassword(true);
                                                setPasswordError('');
                                                setPasswordSuccess('');
                                            }}
                                        >
                                            Cambia Password
                                        </Button>
                                    )}
                                </div>

                                {passwordError && (
                                    <div className="mb-4 p-3 bg-red-600/20 border border-red-600 rounded-lg text-red-400 text-sm">
                                        {passwordError}
                                    </div>
                                )}

                                {passwordSuccess && (
                                    <div className="mb-4 p-3 bg-green-600/20 border border-green-600 rounded-lg text-green-400 text-sm">
                                        {passwordSuccess}
                                    </div>
                                )}

                                {isChangingPassword ? (
                                    <form onSubmit={handlePasswordChange} className="space-y-4">
                                        <PasswordInput
                                            label="Password Attuale"
                                            name="currentPassword"
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                            placeholder="Inserisci la password attuale"
                                            required
                                        />

                                        <PasswordInput
                                            label="Nuova Password"
                                            name="newPassword"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            placeholder="Inserisci la nuova password"
                                            minLength={6}
                                            required
                                        />

                                        <PasswordInput
                                            label="Conferma Nuova Password"
                                            name="confirmPassword"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            placeholder="Conferma la nuova password"
                                            minLength={6}
                                            required
                                        />

                                        <div className="flex gap-3 pt-4">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    setIsChangingPassword(false);
                                                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                                    setPasswordError('');
                                                    setPasswordSuccess('');
                                                }}
                                                className="flex-1"
                                            >
                                                Annulla
                                            </Button>
                                            <Button
                                                type="submit"
                                                variant="cyan"
                                                disabled={loading}
                                                className="flex-1"
                                            >
                                                {loading ? 'Aggiornamento...' : 'Aggiorna Password'}
                                            </Button>
                                        </div>
                                    </form>
                                ) : (
                                    <p className="text-gray-400 text-sm">
                                        Gestisci la sicurezza del tuo account modificando la password.
                                    </p>
                                )}
                            </Card>
                        )}
                    </div>
                </div>
                </div>
            </PageContainer>
        </>
    );
};

export default ProfilePage;
