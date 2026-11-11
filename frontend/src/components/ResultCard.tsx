import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Utensils,
    RotateCcw,
    Video,
    ListChecks,
    Check,
    ShieldCheck,
    DollarSign,
} from 'lucide-react';
import {
    CreateHistoryRequestDTO,
    CurrencyCode,
    HistoryItemResponseDTO,
    Language,
    RecommendResponseDTO,
} from '../types/api.dto';
import { QuizAnswers } from './QuestionLoop';
import { apiRequest } from '../lib/api';

interface ResultCardProps {
    recommendation: RecommendResponseDTO;
    quizAnswers: QuizAnswers;
    onReset: () => void;
    lang: Language;
    currency: CurrencyCode;
}

export default function ResultCard({
    recommendation,
    quizAnswers,
    onReset,
    lang = 'en',
    currency = 'USD',
}: ResultCardProps) {
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const { t } = useTranslation();

    const recipe = recommendation.recipe[lang] || recommendation.recipe.en;
    const displayCost =
        currency === 'EGP'
            ? recipe.estimatedCostEgp || recipe.estimatedCost || recipe.estimatedCostUsd
            : recipe.estimatedCostUsd || recipe.estimatedCost || recipe.estimatedCostEgp;

    const handleSaveAndReset = async () => {
        setSaving(true);
        try {
            const dto: CreateHistoryRequestDTO = {
                dietaryRestrictions: quizAnswers.dietaryRestrictions,
                allergies: quizAnswers.allergies,
                cuisine: quizAnswers.cuisine,
                groupType: quizAnswers.groupType.toLowerCase(),
                budget: quizAnswers.budget,
                recommendationName: recommendation.recipe.en.name,
                recommendationDetails: recommendation,
            };

            await apiRequest<HistoryItemResponseDTO>('/history', {
                method: 'POST',
                body: JSON.stringify(dto),
            });

            setSaved(true);
            setTimeout(() => {
                onReset();
            }, 700);
        } catch (err) {
            console.error('Save error:', err);
            onReset();
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="glass-card result-page animate-slide-in">
            <div className="result-header">
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-accent">{t('cookingFlow')}</span>
                    {displayCost && (
                        <span
                            className="badge"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                            <DollarSign size={13} color="var(--accent-primary)" />
                            <span>
                                {t('estimatedCostLabel')}: <strong>{displayCost}</strong>
                            </span>
                        </span>
                    )}
                </div>
                <div className="result-meta">
                    <span>
                        {t('cuisineLabel')}: <strong>{recipe.area || quizAnswers.cuisine}</strong>
                    </span>
                    <span>
                        {t('categoryLabel')}: <strong>{recipe.category}</strong>
                    </span>
                </div>
            </div>

            {recipe.matchedPreferences && (
                <div
                    className="support-notice-banner"
                    style={{ marginBottom: '1.5rem', justifyContent: 'flex-start' }}
                >
                    <ShieldCheck size={16} />
                    <span>
                        {t('matchedLabel')}:{' '}
                        <strong>
                            {quizAnswers.dietaryRestrictions} | {quizAnswers.allergies} |{' '}
                            {quizAnswers.groupType} | {quizAnswers.budget}
                        </strong>
                    </span>
                </div>
            )}

            <div className="recipe-hero">
                <img src={recipe.image} alt={recipe.name} className="recipe-img" />
                <div className="recipe-quick-details">
                    <h1 className="recipe-title">{recipe.name}</h1>
                    <div className="recipe-badges">
                        <span className="badge">{recipe.category}</span>
                        <span className="badge">{recipe.area}</span>
                        {recipe.youtube && (
                            <a
                                href={recipe.youtube}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="badge badge-accent"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    textDecoration: 'none',
                                }}
                            >
                                <Video size={14} />
                                <span>{t('videoTutorial')}</span>
                            </a>
                        )}
                    </div>
                </div>
            </div>

            <div className="recipe-layout">
                <div className="ingredients-list">
                    <h3
                        style={{
                            marginBottom: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                        }}
                    >
                        <ListChecks size={20} color="var(--accent-primary)" />
                        <span>{t('ingredientsHeader')}</span>
                    </h3>
                    {recipe.ingredients.map((ing, i) => (
                        <div key={i} className="ing-item">
                            <span className="ing-name">{ing}</span>
                            <span className="ing-measure">{recipe.measurements[i]}</span>
                        </div>
                    ))}
                </div>

                <div className="instructions-section">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Utensils size={20} color="var(--accent-primary)" />
                        <span>{t('instructionsHeader')}</span>
                    </h3>
                    <p className="instructions-text">{recipe.instructions}</p>
                </div>
            </div>

            <div
                style={{
                    marginTop: '2.5rem',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '1rem',
                    flexWrap: 'wrap',
                }}
            >
                <button
                    type="button"
                    onClick={handleSaveAndReset}
                    className="btn btn-primary"
                    disabled={saving}
                    style={{ padding: '0.88rem 1.75rem', fontSize: '1rem' }}
                >
                    {saving ? (
                        <span>{t('savingHistory')}</span>
                    ) : saved ? (
                        <>
                            <Check size={18} />
                            <span>{t('savedStartingOver')}</span>
                        </>
                    ) : (
                        <>
                            <RotateCcw size={18} />
                            <span>{t('saveAndResetBtn')}</span>
                        </>
                    )}
                </button>

                <button
                    type="button"
                    onClick={onReset}
                    className="btn btn-secondary"
                    disabled={saving}
                    style={{ padding: '0.88rem 1.75rem', fontSize: '1rem' }}
                >
                    <RotateCcw size={18} />
                    <span>{t('resetWithoutSaving')}</span>
                </button>
            </div>
        </div>
    );
}
