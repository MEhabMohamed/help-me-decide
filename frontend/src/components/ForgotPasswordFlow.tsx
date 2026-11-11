import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    AlertCircle,
    ArrowLeft,
    Check,
    CheckCircle2,
    Circle,
    Eye,
    EyeOff,
    KeyRound,
    Loader,
    Mail,
    ShieldCheck,
    Sun,
    Moon,
    Monitor,
    Utensils,
} from 'lucide-react';
import {
    ForgotPasswordRequestDTO,
    ForgotPasswordResponseDTO,
    Language,
    ResetPasswordRequestDTO,
    ResetPasswordResponseDTO,
    ThemeMode,
    VerifyOtpRequestDTO,
    VerifyOtpResponseDTO,
} from '../types/api.dto';
import { apiRequest } from '../lib/api';

export type ResetStep = 'email' | 'verify-otp' | 'new-password';

interface ForgotPasswordFlowProps {
    initialStep?: ResetStep;
    initialEmail?: string;
    onBackToSignIn: () => void;
    lang: Language;
    toggleLanguage: () => void;
    themeMode: ThemeMode;
    cycleTheme: () => void;
}

export default function ForgotPasswordFlow({
    initialStep = 'email',
    initialEmail = '',
    onBackToSignIn,
    lang,
    toggleLanguage,
    themeMode,
    cycleTheme,
}: ForgotPasswordFlowProps) {
    const [step, setStep] = useState<ResetStep>(initialStep);
    const [email, setEmail] = useState(initialEmail);
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const { t } = useTranslation();

    // PDF Password validation rules (same DTO as Sign Up password)
    const hasMinLength = newPassword.length >= 8;
    const hasLetter = /[A-Za-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const hasSpecial = /[^A-Za-z\d]/.test(newPassword);
    const isPasswordValid = hasMinLength && hasLetter && hasNumber && hasSpecial;

    // Confirm password validation rules & match check
    const confirmHasMinLength = confirmPassword.length >= 8;
    const confirmHasLetter = /[A-Za-z]/.test(confirmPassword);
    const confirmHasNumber = /\d/.test(confirmPassword);
    const confirmHasSpecial = /[^A-Za-z\d]/.test(confirmPassword);
    const passwordsMatch =
        newPassword.length > 0 &&
        confirmPassword.length > 0 &&
        newPassword === confirmPassword;
    const isConfirmPasswordValid =
        confirmHasMinLength &&
        confirmHasLetter &&
        confirmHasNumber &&
        confirmHasSpecial &&
        passwordsMatch;

    const handleSendOtp = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            setError(t('emailInvalidError'));
            return;
        }

        setLoading(true);
        try {
            const dto: ForgotPasswordRequestDTO = { email: email.trim() };
            const res = await apiRequest<ForgotPasswordResponseDTO>('/auth/forgot-password', {
                method: 'POST',
                body: JSON.stringify(dto),
            });
            setSuccessMsg(res.message);
            setStep('verify-otp');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send OTP.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (!/^\d{6}$/.test(otp.trim())) {
            setError(t('otpFormatError'));
            return;
        }

        setLoading(true);
        try {
            const dto: VerifyOtpRequestDTO = {
                email: email.trim(),
                otp: otp.trim(),
            };
            const res = await apiRequest<VerifyOtpResponseDTO>('/auth/verify-otp', {
                method: 'POST',
                body: JSON.stringify(dto),
            });
            if (res.verified) {
                setSuccessMsg(res.message);
                setStep('new-password');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Invalid or expired OTP.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (!isPasswordValid) {
            setError(t('pwdInvalidError'));
            return;
        }
        if (!passwordsMatch) {
            setError(t('passwordsMismatch'));
            return;
        }

        setLoading(true);
        try {
            const dto: ResetPasswordRequestDTO = {
                email: email.trim(),
                otp: otp.trim(),
                newPassword,
                confirmPassword,
            };
            await apiRequest<ResetPasswordResponseDTO>('/auth/reset-password', {
                method: 'POST',
                body: JSON.stringify(dto),
            });
            setSuccessMsg(t('resetSuccessMsg'));
            setTimeout(() => {
                // Clean up URL query params if user arrived via email redirect link
                if (window.location.search) {
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
                onBackToSignIn();
            }, 1500);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to reset password.');
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
                        {t('brandFirst')}
                        <span>{t('brandSecond')}</span>
                    </h1>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        type="button"
                        onClick={cycleTheme}
                        className="btn btn-secondary"
                        style={{ padding: '0.45rem 0.8rem', fontSize: '0.82rem' }}
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
                <h2 className="auth-title">
                    {step === 'email'
                        ? t('forgotTitle')
                        : step === 'verify-otp'
                          ? t('verifyOtpTitle')
                          : t('resetPasswordTitle')}
                </h2>
                <p className="auth-subtitle">
                    {step === 'email'
                        ? t('forgotSub')
                        : step === 'verify-otp'
                          ? `${t('verifyOtpSub')} (${email})`
                          : t('resetPasswordSub')}
                </p>

                {error && (
                    <div className="alert-error" role="alert">
                        <AlertCircle size={18} style={{ flexShrink: 0 }} />
                        <span>{error}</span>
                    </div>
                )}

                {successMsg && (
                    <div className="alert-success" role="status">
                        <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                        <span>{successMsg}</span>
                    </div>
                )}

                {step === 'email' && (
                    <form onSubmit={handleSendOtp} noValidate>
                        <div className="form-group">
                            <label className="form-label" htmlFor="reset-email">
                                {t('emailLabel')}
                            </label>
                            <input
                                id="reset-email"
                                type="email"
                                className="form-input"
                                placeholder={t('emailPlaceholder')}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
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
                            ) : (
                                <>
                                    <Mail size={18} />
                                    <span>{t('sendOtpBtn')}</span>
                                </>
                            )}
                        </button>
                    </form>
                )}

                {step === 'verify-otp' && (
                    <form onSubmit={handleVerifyOtp} noValidate>
                        <div className="form-group">
                            <label className="form-label" htmlFor="verify-email">
                                {t('emailLabel')}
                            </label>
                            <input
                                id="verify-email"
                                type="email"
                                className="form-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="verify-otp-input">
                                {t('otpLabel')}
                            </label>
                            <input
                                id="verify-otp-input"
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                className="form-input"
                                style={{
                                    letterSpacing: '0.35em',
                                    fontSize: '1.25rem',
                                    fontWeight: 700,
                                    textAlign: 'center',
                                }}
                                placeholder={t('otpPlaceholder')}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary auth-submit-btn"
                            disabled={loading || otp.length !== 6}
                        >
                            {loading ? (
                                <Loader
                                    size={18}
                                    style={{ animation: 'spin 1s linear infinite' }}
                                />
                            ) : (
                                <>
                                    <ShieldCheck size={18} />
                                    <span>{t('verifyOtpBtn')}</span>
                                </>
                            )}
                        </button>

                        <div style={{ marginTop: '0.85rem' }}>
                            <button
                                type="button"
                                className="auth-toggle-link"
                                onClick={handleSendOtp}
                                disabled={loading}
                            >
                                {t('resendOtpBtn')}
                            </button>
                        </div>
                    </form>
                )}

                {step === 'new-password' && (
                    <form onSubmit={handleResetPassword} noValidate>
                        <div className="form-group">
                            <label className="form-label" htmlFor="new-password">
                                {t('newPasswordLabel')}
                            </label>
                            <div className="password-input-wrapper">
                                <input
                                    id="new-password"
                                    type={showNewPassword ? 'text' : 'password'}
                                    className={`form-input ${
                                        newPassword.length > 0
                                            ? isPasswordValid
                                                ? 'input-valid'
                                                : 'input-invalid'
                                            : ''
                                    }`}
                                    placeholder={t('newPasswordPlaceholder')}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle-btn"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    aria-label={
                                        showNewPassword ? t('hidePassword') : t('showPassword')
                                    }
                                    title={showNewPassword ? t('hidePassword') : t('showPassword')}
                                >
                                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            <div className="pwd-checklist">
                                <div className="pwd-checklist-title">{t('pwdReqTitle')}</div>
                                <div
                                    className={`pwd-check-item ${
                                        hasMinLength
                                            ? 'met'
                                            : newPassword.length > 0
                                              ? 'unmet'
                                              : ''
                                    }`}
                                >
                                    {hasMinLength ? (
                                        <Check size={15} strokeWidth={3} className="pwd-tick-icon" />
                                    ) : (
                                        <Circle size={14} />
                                    )}
                                    <span>{t('pwdReqLength')}</span>
                                </div>
                                <div
                                    className={`pwd-check-item ${
                                        hasLetter
                                            ? 'met'
                                            : newPassword.length > 0
                                              ? 'unmet'
                                              : ''
                                    }`}
                                >
                                    {hasLetter ? (
                                        <Check size={15} strokeWidth={3} className="pwd-tick-icon" />
                                    ) : (
                                        <Circle size={14} />
                                    )}
                                    <span>{t('pwdReqLetter')}</span>
                                </div>
                                <div
                                    className={`pwd-check-item ${
                                        hasNumber
                                            ? 'met'
                                            : newPassword.length > 0
                                              ? 'unmet'
                                              : ''
                                    }`}
                                >
                                    {hasNumber ? (
                                        <Check size={15} strokeWidth={3} className="pwd-tick-icon" />
                                    ) : (
                                        <Circle size={14} />
                                    )}
                                    <span>{t('pwdReqNumber')}</span>
                                </div>
                                <div
                                    className={`pwd-check-item ${
                                        hasSpecial
                                            ? 'met'
                                            : newPassword.length > 0
                                              ? 'unmet'
                                              : ''
                                    }`}
                                >
                                    {hasSpecial ? (
                                        <Check size={15} strokeWidth={3} className="pwd-tick-icon" />
                                    ) : (
                                        <Circle size={14} />
                                    )}
                                    <span>{t('pwdReqSpecial')}</span>
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="confirm-password">
                                {t('confirmPasswordLabel')}
                            </label>
                            <div className="password-input-wrapper">
                                <input
                                    id="confirm-password"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    className={`form-input ${
                                        confirmPassword.length > 0
                                            ? isConfirmPasswordValid
                                                ? 'input-valid'
                                                : 'input-invalid'
                                            : ''
                                    }`}
                                    placeholder={t('confirmPasswordPlaceholder')}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle-btn"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    aria-label={
                                        showConfirmPassword ? t('hidePassword') : t('showPassword')
                                    }
                                    title={showConfirmPassword ? t('hidePassword') : t('showPassword')}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff size={18} />
                                    ) : (
                                        <Eye size={18} />
                                    )}
                                </button>
                            </div>
                            <div className="pwd-checklist">
                                <div className="pwd-checklist-title">{t('pwdReqTitle')}</div>
                                <div
                                    className={`pwd-check-item ${
                                        confirmHasMinLength
                                            ? 'met'
                                            : confirmPassword.length > 0
                                              ? 'unmet'
                                              : ''
                                    }`}
                                >
                                    {confirmHasMinLength ? (
                                        <Check size={15} strokeWidth={3} className="pwd-tick-icon" />
                                    ) : (
                                        <Circle size={14} />
                                    )}
                                    <span>{t('pwdReqLength')}</span>
                                </div>
                                <div
                                    className={`pwd-check-item ${
                                        confirmHasLetter
                                            ? 'met'
                                            : confirmPassword.length > 0
                                              ? 'unmet'
                                              : ''
                                    }`}
                                >
                                    {confirmHasLetter ? (
                                        <Check size={15} strokeWidth={3} className="pwd-tick-icon" />
                                    ) : (
                                        <Circle size={14} />
                                    )}
                                    <span>{t('pwdReqLetter')}</span>
                                </div>
                                <div
                                    className={`pwd-check-item ${
                                        confirmHasNumber
                                            ? 'met'
                                            : confirmPassword.length > 0
                                              ? 'unmet'
                                              : ''
                                    }`}
                                >
                                    {confirmHasNumber ? (
                                        <Check size={15} strokeWidth={3} className="pwd-tick-icon" />
                                    ) : (
                                        <Circle size={14} />
                                    )}
                                    <span>{t('pwdReqNumber')}</span>
                                </div>
                                <div
                                    className={`pwd-check-item ${
                                        confirmHasSpecial
                                            ? 'met'
                                            : confirmPassword.length > 0
                                              ? 'unmet'
                                              : ''
                                    }`}
                                >
                                    {confirmHasSpecial ? (
                                        <Check size={15} strokeWidth={3} className="pwd-tick-icon" />
                                    ) : (
                                        <Circle size={14} />
                                    )}
                                    <span>{t('pwdReqSpecial')}</span>
                                </div>
                                <div
                                    className={`pwd-check-item ${
                                        passwordsMatch
                                            ? 'met'
                                            : confirmPassword.length > 0
                                              ? 'unmet'
                                              : ''
                                    }`}
                                >
                                    {passwordsMatch ? (
                                        <Check size={15} strokeWidth={3} className="pwd-tick-icon" />
                                    ) : (
                                        <Circle size={14} />
                                    )}
                                    <span>
                                        {passwordsMatch ? t('passwordsMatch') : t('passwordsMismatch')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary auth-submit-btn"
                            disabled={loading || !isPasswordValid || !passwordsMatch}
                        >
                            {loading ? (
                                <Loader
                                    size={18}
                                    style={{ animation: 'spin 1s linear infinite' }}
                                />
                            ) : (
                                <>
                                    <KeyRound size={18} />
                                    <span>{t('updatePasswordBtn')}</span>
                                </>
                            )}
                        </button>
                    </form>
                )}

                <div className="auth-toggle">
                    <button
                        type="button"
                        className="auth-toggle-link"
                        onClick={onBackToSignIn}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                        <ArrowLeft size={15} />
                        <span>{t('backToSignIn')}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

