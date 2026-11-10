import React, { useState, useEffect } from 'react';
import SignInPortal from './components/SignInPortal';
import ForgotPasswordFlow, { ResetStep } from './components/ForgotPasswordFlow';
import QuestionLoop, { QuizAnswers } from './components/QuestionLoop';
import ResultCard from './components/ResultCard';
import HistoryLog from './components/HistoryLog';
import { translations } from './translations';
import {
    Utensils,
    History,
    LogOut,
    Heart,
    Trash2,
    Sun,
    Moon,
    Monitor,
    Sparkles,
    Coins,
} from 'lucide-react';
import {
    CurrencyCode,
    DeleteUserResponseDTO,
    Language,
    LogoutResponseDTO,
    RecommendRequestDTO,
    RecommendResponseDTO,
    ThemeMode,
    UserResponseDTO,
} from './types/api.dto';
import {
    apiRequest,
    clearStoredTokens,
    getStoredAccessToken,
} from './lib/api';

export default function App() {
    const [token, setToken] = useState<string>(getStoredAccessToken());
    const [user, setUser] = useState<UserResponseDTO | null>(null);
    const [lang, setLang] = useState<Language>(
        (localStorage.getItem('lang') as Language) || 'en'
    );
    const [themeMode, setThemeMode] = useState<ThemeMode>(
        (localStorage.getItem('themeMode') as ThemeMode) || 'system'
    );
    const [currency, setCurrency] = useState<CurrencyCode>(
        (localStorage.getItem('currency') as CurrencyCode) || 'USD'
    );
    const [authView, setAuthView] = useState<'signin' | 'forgot'>('signin');
    const [resetInitialStep, setResetInitialStep] = useState<ResetStep>('email');
    const [resetInitialEmail, setResetInitialEmail] = useState<string>('');

    const [activeTab, setActiveTab] = useState<'recommend' | 'history'>('recommend');
    const [quizAnswers, setQuizAnswers] = useState<QuizAnswers | null>(null);
    const [recommendation, setRecommendation] = useState<RecommendResponseDTO | null>(null);
    const [loading, setLoading] = useState(false);
    const [recommendationError, setRecommendationError] = useState('');
    const [authLoading, setAuthLoading] = useState<boolean>(!!token);
    const [seenIds, setSeenIds] = useState<string[]>([]);

    // Check URL query params for password reset redirect link (?view=verify-otp&email=...)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const viewParam = params.get('view');
        const emailParam = params.get('email') || '';
        if (viewParam === 'verify-otp' || viewParam === 'forgot-password') {
            setAuthView('forgot');
            setResetInitialStep(viewParam === 'verify-otp' ? 'verify-otp' : 'email');
            setResetInitialEmail(emailParam);
        }
    }, []);

    // Apply language & RTL/LTR direction
    useEffect(() => {
        document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
        document.documentElement.setAttribute('lang', lang);
        localStorage.setItem('lang', lang);
    }, [lang]);

    // Apply Dark/Light/System theme mode (system preferred mode as default)
    useEffect(() => {
        localStorage.setItem('themeMode', themeMode);
        if (themeMode === 'system') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', themeMode);
        }
    }, [themeMode]);

    useEffect(() => {
        if (token) {
            fetchCurrentUser();
        }
    }, [token]);

    const fetchCurrentUser = async () => {
        setAuthLoading(true);
        try {
            const currentUser = await apiRequest<UserResponseDTO>('/users/me');
            setUser(currentUser);
        } catch (err) {
            console.error('Auth verify error:', err);
            handleLogoutLocal();
        } finally {
            setAuthLoading(false);
        }
    };

    const handleAuthSuccess = (newToken: string, newUser: UserResponseDTO) => {
        setToken(newToken);
        setUser(newUser);
    };

    const handleLogoutLocal = () => {
        clearStoredTokens();
        setToken('');
        setUser(null);
        setQuizAnswers(null);
        setRecommendation(null);
        setActiveTab('recommend');
        setSeenIds([]);
    };

    const handleLogout = async () => {
        try {
            await apiRequest<LogoutResponseDTO>('/auth/logout', { method: 'POST' });
        } catch {
            // ignore network error on logout
        } finally {
            handleLogoutLocal();
        }
    };

    const handleDeleteAccount = async () => {
        const msg =
            lang === 'ar'
                ? 'هل أنت متأكد من رغبتك في حذف حسابك نهائياً؟ سيتم مسح جميع بياناتك وسجل وصفاتك بالكامل.'
                : 'Are you sure you want to delete your account permanently? All your history and account data will be deleted.';

        if (window.confirm(msg)) {
            try {
                await apiRequest<DeleteUserResponseDTO>('/users/me', {
                    method: 'DELETE',
                });
                alert(
                    lang === 'ar'
                        ? 'تم حذف الحساب بنجاح.'
                        : 'Account deleted successfully.'
                );
                handleLogoutLocal();
            } catch (err) {
                alert(
                    err instanceof Error
                        ? err.message
                        : lang === 'ar'
                          ? 'فشل حذف الحساب.'
                          : 'Failed to delete account.'
                );
            }
        }
    };

    const toggleLanguage = () => {
        setLang(lang === 'en' ? 'ar' : 'en');
    };

    const toggleCurrency = () => {
        setCurrency((prev) => {
            const next = prev === 'USD' ? 'EGP' : 'USD';
            localStorage.setItem('currency', next);
            return next;
        });
    };

    const cycleTheme = () => {
        setThemeMode((prev) =>
            prev === 'system' ? 'dark' : prev === 'dark' ? 'light' : 'system'
        );
    };

    const renderThemeIcon = () => {
        if (themeMode === 'dark') return <Moon size={16} />;
        if (themeMode === 'light') return <Sun size={16} />;
        return <Monitor size={16} />;
    };

    const handleQuizComplete = async (answers: QuizAnswers) => {
        setQuizAnswers(answers);
        setRecommendationError('');
        setLoading(true);

        try {
            const dto: RecommendRequestDTO = {
                dietaryRestrictions: answers.dietaryRestrictions,
                allergies: answers.allergies,
                cuisine: answers.cuisine,
                groupType: answers.groupType.toLowerCase(),
                budget: answers.budget,
                currency: answers.currency || currency,
                lang,
                seenIds,
            };

            const data = await apiRequest<RecommendResponseDTO>('/recommend', {
                method: 'POST',
                body: JSON.stringify(dto),
            });

            setRecommendation(data);
            const recipeId = data.recipe?.en?.id;
            if (recipeId) {
                setSeenIds((prev) => [...prev, recipeId]);
            }
        } catch (err) {
            setRecommendationError(
                err instanceof Error ? err.message : 'Failed to generate recommendation.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleResetRecommendation = () => {
        setQuizAnswers(null);
        setRecommendation(null);
        setRecommendationError('');
    };

    const t = translations[lang];

    if (authLoading) {
        return (
            <div className="loader-container" style={{ minHeight: '100vh' }}>
                <div className="spinner"></div>
                <p style={{ color: 'var(--text-secondary)' }}>{t.sessionVerifying}</p>
            </div>
        );
    }

    if (!token) {
        if (authView === 'forgot') {
            return (
                <ForgotPasswordFlow
                    initialStep={resetInitialStep}
                    initialEmail={resetInitialEmail}
                    onBackToSignIn={() => {
                        setAuthView('signin');
                        setResetInitialStep('email');
                    }}
                    lang={lang}
                    toggleLanguage={toggleLanguage}
                    themeMode={themeMode}
                    cycleTheme={cycleTheme}
                />
            );
        }

        return (
            <SignInPortal
                onAuthSuccess={handleAuthSuccess}
                onForgotPassword={() => {
                    setResetInitialStep('email');
                    setAuthView('forgot');
                }}
                lang={lang}
                toggleLanguage={toggleLanguage}
                themeMode={themeMode}
                cycleTheme={cycleTheme}
            />
        );
    }

    return (
        <div className="app-container">
            <header className="app-header">
                <a
                    href="/"
                    className="brand"
                    onClick={(e) => {
                        e.preventDefault();
                        handleResetRecommendation();
                    }}
                >
                    <div className="brand-logo">
                        <Utensils size={24} />
                    </div>
                    <h1 className="brand-text">
                        {t.brandFirst}
                        <span>{t.brandSecond}</span>
                    </h1>
                </a>

                <div className="header-controls">
                    <button
                        type="button"
                        onClick={cycleTheme}
                        className="btn btn-secondary"
                        style={{ padding: '0.5rem 0.85rem', fontSize: '0.84rem' }}
                        title={
                            themeMode === 'system'
                                ? t.themeSystem
                                : themeMode === 'dark'
                                  ? t.themeDark
                                  : t.themeLight
                        }
                    >
                        {renderThemeIcon()}
                    </button>

                    <button
                        type="button"
                        onClick={toggleCurrency}
                        className="btn btn-secondary"
                        style={{ padding: '0.5rem 0.85rem', fontSize: '0.84rem' }}
                        title={t.switchCurrencyTitle}
                    >
                        <Coins size={15} />
                        <span>{currency === 'USD' ? 'USD ($)' : 'EGP (E£)'}</span>
                    </button>

                    <button
                        type="button"
                        onClick={toggleLanguage}
                        className="btn btn-secondary"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.84rem' }}
                    >
                        <span>{lang === 'en' ? 'العربية' : 'English'}</span>
                    </button>

                    {user && (
                        <div className="user-profile">
                            <div className="avatar-wrapper">
                                {user.avatarUrl ? (
                                    <img
                                        src={user.avatarUrl}
                                        alt={user.name}
                                        className="avatar"
                                    />
                                ) : (
                                    <div className="avatar-fallback">
                                        {user.name
                                            ? user.name.charAt(0).toUpperCase()
                                            : 'U'}
                                    </div>
                                )}
                                <span className="user-name">{user.name || user.email}</span>
                            </div>
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="btn btn-secondary btn-danger"
                                style={{ padding: '0.5rem 0.75rem' }}
                                title={t.signOut}
                            >
                                <LogOut size={16} />
                                <span>{t.signOut}</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteAccount}
                                className="btn btn-secondary btn-danger"
                                style={{ padding: '0.5rem' }}
                                title={t.deleteAccount}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Mandatory Application Page Welcome Banner per PDF instructions */}
            <section className="welcome-banner animate-slide-in">
                <div>
                    <div className="welcome-banner-title">{t.welcomeBannerTitle}</div>
                    <p className="welcome-banner-sub">{t.welcomeBannerSub}</p>
                </div>
                <div className="badge badge-accent" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Sparkles size={14} />
                    <span>{user?.name || user?.email}</span>
                </div>
            </section>

            <nav className="tabs-nav">
                <button
                    type="button"
                    className={`tab-btn ${activeTab === 'recommend' ? 'active' : ''}`}
                    onClick={() => setActiveTab('recommend')}
                >
                    <Utensils size={18} />
                    <span>{t.recommendationsTab}</span>
                </button>
                <button
                    type="button"
                    className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    <History size={18} />
                    <span>{t.historyTab}</span>
                </button>
            </nav>

            <main style={{ flex: 1, paddingBottom: '3rem' }}>
                {activeTab === 'recommend' ? (
                    loading ? (
                        <div className="loader-container">
                            <div className="spinner"></div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
                                {t.loadingMatch}
                            </p>
                        </div>
                    ) : recommendationError ? (
                        <div
                            className="glass-card result-page animate-slide-in"
                            style={{ textAlign: 'center' }}
                        >
                            <div className="alert-error" style={{ marginBottom: '2rem' }}>
                                <span>{recommendationError}</span>
                            </div>
                            <button
                                type="button"
                                onClick={handleResetRecommendation}
                                className="btn btn-primary"
                            >
                                <span>{t.tryAgain}</span>
                            </button>
                        </div>
                    ) : recommendation && quizAnswers ? (
                        <ResultCard
                            recommendation={recommendation}
                            quizAnswers={quizAnswers}
                            onReset={handleResetRecommendation}
                            lang={lang}
                            currency={currency}
                        />
                    ) : (
                        <QuestionLoop
                            onComplete={handleQuizComplete}
                            lang={lang}
                            currency={currency}
                            onToggleCurrency={toggleCurrency}
                        />
                    )
                ) : (
                    <HistoryLog lang={lang} currency={currency} />
                )}
            </main>

            <footer
                style={{
                    textAlign: 'center',
                    padding: '1.5rem 0',
                    color: 'var(--text-secondary)',
                    fontSize: '0.85rem',
                    borderTop: '1px solid var(--card-border)',
                }}
            >
                <p style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    {t.madeWith} <Heart size={12} color="#10b981" fill="#10b981" /> {t.inYear}
                </p>
            </footer>
        </div>
    );
}
