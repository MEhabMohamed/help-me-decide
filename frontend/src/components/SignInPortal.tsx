import React, { useState, useEffect } from 'react';
import { translations } from '../translations';
import {
    LogIn,
    UserPlus,
    AlertCircle,
    Loader,
    Eye,
    EyeOff,
    CheckCircle2,
    Circle,
    Sun,
    Moon,
    Monitor,
    Utensils,
} from 'lucide-react';
import {
    AuthResponseDTO,
    Language,
    LoginRequestDTO,
    RegisterRequestDTO,
    ThemeMode,
    UserResponseDTO,
} from '../types/api.dto';
import { apiRequest, storeTokens } from '../lib/api';

declare global {
    interface Window {
        google?: {
            accounts?: {
                oauth2?: {
                    initTokenClient: (config: {
                        client_id: string;
                        scope: string;
                        callback: (response: { access_token?: string; error?: string }) => void;
                    }) => { requestAccessToken: () => void };
                };
            };
        };
    }
}

interface SignInPortalProps {
    onAuthSuccess: (token: string, user: UserResponseDTO) => void;
    onForgotPassword: () => void;
    lang: Language;
    toggleLanguage: () => void;
    themeMode: ThemeMode;
    cycleTheme: () => void;
}

export default function SignInPortal({
    onAuthSuccess,
    onForgotPassword,
    lang,
    toggleLanguage,
    themeMode,
    cycleTheme,
}: SignInPortalProps) {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const t = translations[lang];
    const googleClientId =
        import.meta.env.VITE_GOOGLE_CLIENT_ID ||
        '52231987269-3tmkj3uu0j8ph8843tnko5qoq994r3eh.apps.googleusercontent.com';

    const [tokenClient, setTokenClient] = useState<{ requestAccessToken: () => void } | null>(
        null
    );

    // Password requirement checks per PDF specification
    const hasMinLength = password.length >= 8;
    const hasLetter = /[A-Za-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[^A-Za-z\d]/.test(password);
    const isPasswordValid = hasMinLength && hasLetter && hasNumber && hasSpecial;

    useEffect(() => {
        let timerId: number;
        const initGoogleOAuth = () => {
            if (window.google?.accounts?.oauth2) {
                const client = window.google.accounts.oauth2.initTokenClient({
                    client_id: googleClientId,
                    scope: 'openid profile email',
                    callback: async (tokenResponse) => {
                        if (tokenResponse.error) {
                            setError(tokenResponse.error);
                            return;
                        }
                        setLoading(true);
                        setError('');
                        try {
                            const data = await apiRequest<AuthResponseDTO>('/auth/google', {
                                method: 'POST',
                                body: JSON.stringify({
                                    accessToken: tokenResponse.access_token,
                                }),
                            });
                            storeTokens(data.accessToken, data.refreshToken);
                            onAuthSuccess(data.accessToken, data.user);
                        } catch (err) {
                            setError(
                                err instanceof Error
                                    ? err.message
                                    : 'Google authentication failed.'
                            );
                        } finally {
                            setLoading(false);
                        }
                    },
                });
                setTokenClient(client);
            } else {
                timerId = window.setTimeout(initGoogleOAuth, 200);
            }
        };

        initGoogleOAuth();
        return () => window.clearTimeout(timerId);
    }, [googleClientId, onAuthSuccess]);

    const handleGoogleSignIn = () => {
        if (tokenClient) {
            tokenClient.requestAccessToken();
        } else {
            setError(
                lang === 'ar'
                    ? 'جاري تحميل خدمات جوجل، يرجى المحاولة بعد لحظة...'
                    : 'Google services are loading. Please try again in a moment.'
            );
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            setError(t.emailInvalidError);
            return;
        }

        if (isSignUp) {
            if (name.trim().length < 3) {
                setError(t.nameMinError);
                return;
            }
            if (!isPasswordValid) {
                setError(t.pwdInvalidError);
                return;
            }
        }

        setLoading(true);
        try {
            if (isSignUp) {
                const dto: RegisterRequestDTO = {
                    name: name.trim(),
                    email: email.trim(),
                    password,
                };
                const res = await apiRequest<AuthResponseDTO>('/auth/register', {
                    method: 'POST',
                    body: JSON.stringify(dto),
                });
                storeTokens(res.accessToken, res.refreshToken);
                onAuthSuccess(res.accessToken, res.user);
            } else {
                const dto: LoginRequestDTO = {
                    email: email.trim(),
                    password,
                };
                const res = await apiRequest<AuthResponseDTO>('/auth/login', {
                    method: 'POST',
                    body: JSON.stringify(dto),
                });
                storeTokens(res.accessToken, res.refreshToken);
                onAuthSuccess(res.accessToken, res.user);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Authentication failed.');
        } finally {
            setLoading(false);
        }
    };

    const renderThemeIcon = () => {
        if (themeMode === 'dark') return <Moon size={16} />;
        if (themeMode === 'light') return <Sun size={16} />;
        return <Monitor size={16} />;
    };

    return (
        <div className="auth-page animate-slide-in">
            <div className="auth-top-bar">
                <div className="brand">
                    <div className="brand-logo">
                        <Utensils size={20} />
                    </div>
                    <h1 className="brand-text" style={{ fontSize: '1.25rem' }}>
                        {t.brandFirst}
                        <span>{t.brandSecond}</span>
                    </h1>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        type="button"
                        onClick={cycleTheme}
                        className="btn btn-secondary"
                        style={{ padding: '0.45rem 0.8rem', fontSize: '0.82rem' }}
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
                        onClick={toggleLanguage}
                        className="btn btn-secondary"
                        style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
                    >
                        <span>{lang === 'en' ? 'العربية' : 'English'}</span>
                    </button>
                </div>
            </div>

            <div className="glass-card auth-card">
                <h2 className="auth-title">{isSignUp ? t.createAccount : t.welcomeBack}</h2>
                <p className="auth-subtitle">{isSignUp ? t.createAccountSub : t.welcomeSub}</p>

                {error && (
                    <div className="alert-error" role="alert">
                        <AlertCircle size={18} style={{ flexShrink: 0 }} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                    {isSignUp && (
                        <div className="form-group">
                            <label className="form-label" htmlFor="signup-name">
                                {t.nameLabel}
                            </label>
                            <input
                                id="signup-name"
                                type="text"
                                className="form-input"
                                placeholder={t.namePlaceholder}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                minLength={3}
                                required
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label" htmlFor="auth-email">
                            {t.emailLabel}
                        </label>
                        <input
                            id="auth-email"
                            type="email"
                            className="form-input"
                            placeholder={t.emailPlaceholder}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <div className="form-label-row">
                            <label className="form-label" htmlFor="auth-password">
                                {t.passwordLabel}
                            </label>
                            {!isSignUp && (
                                <button
                                    type="button"
                                    onClick={onForgotPassword}
                                    className="auth-toggle-link"
                                    style={{ fontSize: '0.8rem' }}
                                >
                                    {t.forgotPasswordLink}
                                </button>
                            )}
                        </div>
                        <div className="password-input-wrapper">
                            <input
                                id="auth-password"
                                type={showPassword ? 'text' : 'password'}
                                className="form-input"
                                placeholder={t.passwordPlaceholder}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? t.hidePassword : t.showPassword}
                                title={showPassword ? t.hidePassword : t.showPassword}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        {isSignUp && (
                            <div className="pwd-checklist">
                                <div className="pwd-checklist-title">{t.pwdReqTitle}</div>
                                <div className={`pwd-check-item ${hasMinLength ? 'met' : ''}`}>
                                    {hasMinLength ? (
                                        <CheckCircle2 size={14} />
                                    ) : (
                                        <Circle size={14} />
                                    )}
                                    <span>{t.pwdReqLength}</span>
                                </div>
                                <div className={`pwd-check-item ${hasLetter ? 'met' : ''}`}>
                                    {hasLetter ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                                    <span>{t.pwdReqLetter}</span>
                                </div>
                                <div className={`pwd-check-item ${hasNumber ? 'met' : ''}`}>
                                    {hasNumber ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                                    <span>{t.pwdReqNumber}</span>
                                </div>
                                <div className={`pwd-check-item ${hasSpecial ? 'met' : ''}`}>
                                    {hasSpecial ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                                    <span>{t.pwdReqSpecial}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary auth-submit-btn"
                        disabled={loading}
                    >
                        {loading ? (
                            <Loader
                                size={18}
                                style={{ animation: 'spin 1s linear infinite' }}
                            />
                        ) : isSignUp ? (
                            <>
                                <UserPlus size={18} />
                                <span>{t.signUpBtn}</span>
                            </>
                        ) : (
                            <>
                                <LogIn size={18} />
                                <span>{t.signInBtn}</span>
                            </>
                        )}
                    </button>
                </form>

                <div className="divider">{lang === 'ar' ? 'أو' : 'or'}</div>

                <div className="google-btn-wrapper">
                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        className="btn google-custom-btn"
                        disabled={loading}
                    >
                        <svg viewBox="0 0 24 24" width="18" height="18">
                            <path
                                fill="#EA4335"
                                d="M12 5.04c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.7 1.6 15 1 12 1 7.3 1 3.4 3.7 1.6 7.6l3.9 3C6.4 7.6 9 5.04 12 5.04z"
                            />
                            <path
                                fill="#4285F4"
                                d="M23.5 12.25c0-.8-.1-1.6-.2-2.25H12v4.25h6.5c-.3 1.5-1.1 2.7-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.5z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.5 14.25c-.2-.7-.4-1.5-.4-2.25s.2-1.54.4-2.25l-3.9-3C.6 8.7 0 10.3 0 12s.6 3.3 1.6 5.25l3.9-3z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c3.24 0 6-.97 7.9-2.75l-3.7-2.9c-1.1.75-2.5 1.2-4.2 1.2-3 0-5.6-2.56-6.5-5.56l-3.9 3C3.4 20.3 7.3 23 12 23z"
                            />
                        </svg>
                        <span>{isSignUp ? t.googleSignUp : t.googleSignIn}</span>
                    </button>
                </div>

                <div className="auth-toggle">
                    {isSignUp ? `${t.alreadyHaveAccount} ` : `${t.dontHaveAccount} `}
                    <button
                        type="button"
                        className="auth-toggle-link"
                        onClick={() => {
                            setIsSignUp(!isSignUp);
                            setError('');
                        }}
                    >
                        {isSignUp ? t.toggleSignIn : t.toggleSignUp}
                    </button>
                </div>
            </div>
        </div>
    );
}

