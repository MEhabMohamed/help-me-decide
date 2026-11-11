import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Trash2,
    Calendar,
    Utensils,
    X,
    Video,
    ListChecks,
} from 'lucide-react';
import {
    CurrencyCode,
    DeleteHistoryResponseDTO,
    HistoryItemResponseDTO,
    HistoryListResponseDTO,
    Language,
} from '../types/api.dto';
import { apiRequest } from '../lib/api';

interface HistoryLogProps {
    lang: Language;
    currency: CurrencyCode;
}

export default function HistoryLog({ lang = 'en', currency = 'USD' }: HistoryLogProps) {
    const [history, setHistory] = useState<HistoryItemResponseDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedItem, setSelectedItem] = useState<HistoryItemResponseDTO | null>(null);
    const { t } = useTranslation();

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await apiRequest<HistoryListResponseDTO>('/history');
            setHistory(data.items || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch history.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!window.confirm(t('deleteConfirm'))) {
            return;
        }

        try {
            await apiRequest<DeleteHistoryResponseDTO>(`/history/${id}`, {
                method: 'DELETE',
            });

            setHistory((prev) => prev.filter((item) => item.id !== id));
            if (selectedItem && selectedItem.id === id) {
                setSelectedItem(null);
            }
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to delete history item.');
        }
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString(lang === 'ar' ? 'ar-EG' : undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="history-page animate-slide-in">
            <div className="history-header">
                <h2 style={{ fontSize: '1.65rem' }}>{t('savedHeader')}</h2>
            </div>

            {loading ? (
                <div className="loader-container">
                    <div className="spinner"></div>
                    <p style={{ color: 'var(--text-secondary)' }}>{t('loadingHistory')}</p>
                </div>
            ) : error ? (
                <div className="alert-error">{error}</div>
            ) : history.length === 0 ? (
                <div className="glass-card no-history">
                    <Utensils size={48} style={{ opacity: 0.25 }} />
                    <h3>{t('noSavedHeader')}</h3>
                    <p
                        style={{
                            maxWidth: '420px',
                            color: 'var(--text-secondary)',
                            fontSize: '0.95rem',
                        }}
                    >
                        {t('noSavedDesc')}
                    </p>
                </div>
            ) : (
                <div className="history-grid">
                    {history.map((item) => {
                        const recipe =
                            item.recommendationDetails?.recipe?.[lang] ||
                            item.recommendationDetails?.recipe?.en;
                        const displayName = recipe?.name || item.recommendationName;
                        const displayCost =
                            currency === 'EGP'
                                ? recipe?.estimatedCostEgp || item.budget
                                : recipe?.estimatedCostUsd || item.budget;

                        return (
                            <div
                                key={item.id}
                                className="glass-card history-item-card"
                                onClick={() => setSelectedItem(item)}
                            >
                                <div className="history-card-header">
                                    <span className="history-type-badge">{t('cookingFlow')}</span>
                                    <button
                                        type="button"
                                        className="delete-btn"
                                        onClick={(e) => handleDelete(e, item.id)}
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div className="history-item-name">{displayName}</div>

                                <div className="history-card-footer">
                                    <span
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.25rem',
                                        }}
                                    >
                                        <Calendar size={12} />
                                        <span>{formatDate(item.createdAt)}</span>
                                    </span>
                                    <span>
                                        {t('budgetLabel')}: <strong>{displayCost}</strong>
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {selectedItem &&
                (() => {
                    const currentRecipe =
                        selectedItem.recommendationDetails?.recipe?.[lang] ||
                        selectedItem.recommendationDetails?.recipe?.en;
                    if (!currentRecipe) return null;

                    return (
                        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
                            <div
                                className="glass-card modal-content"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    type="button"
                                    onClick={() => setSelectedItem(null)}
                                    className="modal-close-btn"
                                >
                                    <X size={18} />
                                </button>

                                <div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            gap: '0.65rem',
                                            marginBottom: '1rem',
                                            flexWrap: 'wrap',
                                        }}
                                    >
                                        <span className="badge badge-accent">{t('cookingFlow')}</span>
                                        <span className="badge">
                                            {t('cuisineLabel')}: {selectedItem.cuisine}
                                        </span>
                                        <span className="badge">
                                            {t('budgetLabel')}: {selectedItem.budget}
                                        </span>
                                    </div>

                                    <div
                                        style={{
                                            display: 'flex',
                                            gap: '1.35rem',
                                            flexWrap: 'wrap',
                                            marginBottom: '1.75rem',
                                        }}
                                    >
                                        {currentRecipe.image && (
                                            <img
                                                src={currentRecipe.image}
                                                alt={currentRecipe.name}
                                                style={{
                                                    width: '120px',
                                                    height: '120px',
                                                    objectFit: 'cover',
                                                    borderRadius: '14px',
                                                }}
                                            />
                                        )}
                                        <div style={{ flex: 1, minWidth: '200px' }}>
                                            <h2
                                                style={{
                                                    fontSize: '1.65rem',
                                                    marginBottom: '0.4rem',
                                                }}
                                            >
                                                {currentRecipe.name}
                                            </h2>
                                            <p
                                                style={{
                                                    color: 'var(--text-secondary)',
                                                    fontSize: '0.9rem',
                                                }}
                                            >
                                                {t('categoryLabel')}: {currentRecipe.category}
                                            </p>
                                            {currentRecipe.youtube && (
                                                <a
                                                    href={currentRecipe.youtube}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn btn-secondary"
                                                    style={{
                                                        padding: '0.4rem 0.85rem',
                                                        fontSize: '0.82rem',
                                                        marginTop: '0.5rem',
                                                    }}
                                                >
                                                    <Video size={14} color="#ef4444" />
                                                    <span>{t('watchVideo')}</span>
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    <div
                                        className="recipe-layout"
                                        style={{
                                            borderTop: '1px solid var(--card-border)',
                                            paddingTop: '1.35rem',
                                        }}
                                    >
                                        <div className="ingredients-list">
                                            <h3
                                                style={{
                                                    marginBottom: '0.85rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                }}
                                            >
                                                <ListChecks
                                                    size={20}
                                                    color="var(--accent-primary)"
                                                />
                                                <span>{t('ingredientsHeader')}</span>
                                            </h3>
                                            {currentRecipe.ingredients.map((ing, idx) => (
                                                <div key={idx} className="ing-item">
                                                    <span className="ing-name">{ing}</span>
                                                    <span className="ing-measure">
                                                        {currentRecipe.measurements[idx]}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="instructions-section">
                                            <h3
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                }}
                                            >
                                                <Utensils size={20} color="var(--accent-primary)" />
                                                <span>{t('instructionsHeader')}</span>
                                            </h3>
                                            <p
                                                className="instructions-text"
                                                style={{ fontSize: '0.95rem' }}
                                            >
                                                {currentRecipe.instructions}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}
        </div>
    );
}
