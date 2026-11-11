import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Leaf,
    Flower2,
    ShieldCheck,
    Wheat,
    Fish,
    AlertTriangle,
    Milk,
    CheckCircle2,
    Pizza,
    ChefHat,
    User,
    Users,
    ArrowLeft,
    ArrowRight,
    Sparkles,
    Landmark,
    Coins,
} from 'lucide-react';
import { CurrencyCode } from '../types/api.dto';

export interface QuizAnswers {
    dietaryRestrictions: string;
    allergies: string;
    cuisine: string;
    groupType: string;
    budget: string;
    currency: CurrencyCode;
}

interface QuestionLoopProps {
    onComplete: (answers: QuizAnswers) => void;
    currency: CurrencyCode;
    onToggleCurrency: () => void;
}

export default function QuestionLoop({
    onComplete,
    currency = 'USD',
    onToggleCurrency,
}: QuestionLoopProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<QuizAnswers>({
        dietaryRestrictions: 'None',
        allergies: 'None',
        cuisine: 'Any',
        groupType: 'Solo',
        budget: currency === 'EGP' ? '150 EGP' : '20 USD',
        currency,
    });

    // Keep budget currency suffix in sync when user switches between USD and EGP
    useEffect(() => {
        setAnswers((prev) => {
            const num = parseFloat(prev.budget);
            const fallback = currency === 'EGP' ? 150 : 20;
            const amount = !isNaN(num) && num > 0 ? num : fallback;
            return {
                ...prev,
                budget: `${amount} ${currency}`,
                currency,
            };
        });
    }, [currency]);

    const [customInputs, setCustomInputs] = useState<Record<string, string>>({
        dietaryRestrictions: '',
        allergies: '',
        cuisine: '',
    });

    const { t } = useTranslation();

    const steps = [
        {
            key: 'dietaryRestrictions' as const,
            question: t('dietaryRestrictions_q'),
            isMulti: false,
            isInput: false,
            options: [
                {
                    label: 'Vegetarian',
                    icon: Leaf,
                    desc: t('Vegetarian_desc'),
                    localizedLabel: t('Vegetarian'),
                },
                {
                    label: 'Vegan',
                    icon: Flower2,
                    desc: t('Vegan_desc'),
                    localizedLabel: t('Vegan'),
                },
                {
                    label: 'Jewish Kosher',
                    icon: ShieldCheck,
                    desc: t('Kosher_desc'),
                    localizedLabel: t('Kosher'),
                },
                {
                    label: 'None',
                    icon: CheckCircle2,
                    desc: t('None_diet_desc'),
                    localizedLabel: t('None_diet'),
                },
                {
                    label: 'Other',
                    icon: Sparkles,
                    desc: t('Other_diet_desc'),
                    localizedLabel: t('Other_diet'),
                },
            ],
        },
        {
            key: 'allergies' as const,
            question: t('allergies_q'),
            isMulti: true,
            isInput: false,
            options: [
                {
                    label: 'Gluten',
                    icon: Wheat,
                    desc: t('Gluten_desc'),
                    localizedLabel: t('Gluten'),
                },
                {
                    label: 'Seafood',
                    icon: Fish,
                    desc: t('Seafood_desc'),
                    localizedLabel: t('Seafood'),
                },
                {
                    label: 'Nuts',
                    icon: AlertTriangle,
                    desc: t('Nuts_desc'),
                    localizedLabel: t('Nuts'),
                },
                {
                    label: 'Dairy',
                    icon: Milk,
                    desc: t('Dairy_desc'),
                    localizedLabel: t('Dairy'),
                },
                {
                    label: 'None',
                    icon: CheckCircle2,
                    desc: t('None_allergy_desc'),
                    localizedLabel: t('None_allergy'),
                },
                {
                    label: 'Other',
                    icon: Sparkles,
                    desc: t('Other_allergy_desc'),
                    localizedLabel: t('Other_allergy'),
                },
            ],
        },
        {
            key: 'cuisine' as const,
            question: t('cuisine_q'),
            isMulti: false,
            isInput: false,
            options: [
                {
                    label: 'Egyptian',
                    icon: Landmark,
                    desc: t('Egyptian_desc'),
                    localizedLabel: t('Egyptian'),
                },
                {
                    label: 'Italian',
                    icon: Pizza,
                    desc: t('Italian_desc'),
                    localizedLabel: t('Italian'),
                },
                {
                    label: 'Mexican',
                    icon: ChefHat,
                    desc: t('Mexican_desc'),
                    localizedLabel: t('Mexican'),
                },
                {
                    label: 'Chinese',
                    icon: ChefHat,
                    desc: t('Chinese_desc'),
                    localizedLabel: t('Chinese'),
                },
                {
                    label: 'Indian',
                    icon: ChefHat,
                    desc: t('Indian_desc'),
                    localizedLabel: t('Indian'),
                },
                {
                    label: 'American',
                    icon: ChefHat,
                    desc: t('American_desc'),
                    localizedLabel: t('American'),
                },
                {
                    label: 'Japanese',
                    icon: ChefHat,
                    desc: t('Japanese_desc'),
                    localizedLabel: t('Japanese'),
                },
                {
                    label: 'Mediterranean',
                    icon: ChefHat,
                    desc: t('Mediterranean_desc'),
                    localizedLabel: t('Mediterranean'),
                },
                {
                    label: 'Any',
                    icon: CheckCircle2,
                    desc: t('Any_cuisine_desc'),
                    localizedLabel: t('Any_cuisine'),
                },
                {
                    label: 'Other',
                    icon: Sparkles,
                    desc: t('Other_cuisine_desc'),
                    localizedLabel: t('Other_cuisine'),
                },
            ],
        },
        {
            key: 'groupType' as const,
            question: t('groupType_q'),
            isMulti: false,
            isInput: false,
            options: [
                {
                    label: 'Solo',
                    icon: User,
                    desc: t('Solo_desc'),
                    localizedLabel: t('Solo'),
                },
                {
                    label: 'Group',
                    icon: Users,
                    desc: t('Group_desc'),
                    localizedLabel: t('Group'),
                },
            ],
        },
        {
            key: 'budget' as const,
            question: currency === 'EGP' ? t('budget_q_egp') : t('budget_q_usd'),
            isMulti: false,
            isInput: true,
            placeholder:
                currency === 'EGP' ? t('budget_placeholder_egp') : t('budget_placeholder_usd'),
            options: [],
        },
    ];

    const currentStepData = steps[currentStep];

    const getPredefinedOptions = (stepKey: string): string[] => {
        if (stepKey === 'dietaryRestrictions') {
            return ['Vegetarian', 'Vegan', 'Jewish Kosher', 'None'];
        }
        if (stepKey === 'allergies') {
            return ['Gluten', 'Seafood', 'Nuts', 'Dairy', 'None'];
        }
        if (stepKey === 'cuisine') {
            return [
                'Egyptian',
                'Italian',
                'Mexican',
                'Chinese',
                'Indian',
                'American',
                'Japanese',
                'Mediterranean',
                'Any',
            ];
        }
        return [];
    };

    const isOtherActive = (stepKey: keyof QuizAnswers): boolean => {
        if (!['dietaryRestrictions', 'allergies', 'cuisine'].includes(stepKey)) return false;
        const val = answers[stepKey];
        const predefined = getPredefinedOptions(stepKey);
        if (stepKey === 'allergies') {
            const list = val
                .split(',')
                .map((x) => x.trim())
                .filter(Boolean);
            return list.some((item) => item === 'Other' || !predefined.includes(item));
        } else {
            return val === 'Other' || (!predefined.includes(val) && val !== '');
        }
    };

    const handleSingleSelect = (value: string) => {
        const key = currentStepData.key;
        if (value === 'Other') {
            const customVal = customInputs[key] || 'Other';
            setAnswers({ ...answers, [key]: customVal });
        } else {
            setAnswers({ ...answers, [key]: value });
        }
    };

    const handleMultiSelect = (value: string) => {
        const key = currentStepData.key;
        const currentSelected = answers[key];
        const predefined = getPredefinedOptions(key);
        let list = currentSelected
            .split(',')
            .map((x) => x.trim())
            .filter(Boolean);

        if (value === 'None') {
            list = ['None'];
        } else {
            list = list.filter((item) => item !== 'None');
            if (value === 'Other') {
                const isOther = isOtherActive(key);
                if (isOther) {
                    list = list.filter((item) => predefined.includes(item));
                } else {
                    const customVal = customInputs[key] || 'Other';
                    list.push(customVal);
                }
            } else {
                if (list.includes(value)) {
                    list = list.filter((item) => item !== value);
                } else {
                    list.push(value);
                }
            }
            if (list.length === 0) {
                list = ['None'];
            }
        }

        setAnswers({
            ...answers,
            [key]: list.join(', '),
        });
    };

    const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const text = e.target.value;
        const key = currentStepData.key;

        setCustomInputs({
            ...customInputs,
            [key]: text,
        });

        if (currentStepData.isMulti) {
            const currentSelected = answers[key];
            const predefined = getPredefinedOptions(key);
            const list = currentSelected
                .split(',')
                .map((x) => x.trim())
                .filter(Boolean);

            const customIdx = list.findIndex(
                (item) => !predefined.includes(item) || item === 'Other'
            );
            const newCustomVal = text.trim() || 'Other';
            if (customIdx !== -1) {
                list[customIdx] = newCustomVal;
            } else {
                list.push(newCustomVal);
            }

            setAnswers({
                ...answers,
                [key]: list.join(', '),
            });
        } else {
            setAnswers({
                ...answers,
                [key]: text.trim() || 'Other',
            });
        }
    };

    const isSelected = (value: string): boolean => {
        if (value === 'Other') {
            return isOtherActive(currentStepData.key);
        }
        const selectedVal = answers[currentStepData.key];
        if (currentStepData.isMulti) {
            const list = selectedVal.split(',').map((x) => x.trim());
            return list.includes(value);
        }
        return selectedVal === value;
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onComplete(answers);
        }
    };

    const isContinueDisabled = (): boolean => {
        if (currentStepData.isInput) {
            const val = answers[currentStepData.key];
            const num = parseFloat(val);
            return !val || isNaN(num) || num <= 0;
        }
        if (isOtherActive(currentStepData.key)) {
            const customVal = customInputs[currentStepData.key];
            return !customVal || !customVal.trim();
        }
        return false;
    };

    const progressPercentage = ((currentStep + 1) / steps.length) * 100;

    return (
        <div className="glass-card quiz-container animate-slide-in">
            <div className="support-notice-banner">
                <ShieldCheck size={16} />
                <span>{t('supportNotice')}</span>
            </div>

            <div className="quiz-progress">
                <div
                    className="quiz-progress-bar"
                    style={{ width: `${progressPercentage}%` }}
                ></div>
            </div>

            <div className="quiz-steps-text">
                {t('questionNum', { current: currentStep + 1, total: steps.length })}
            </div>

            <h2 className="question-text">{currentStepData.question}</h2>

            {currentStepData.isInput ? (
                <div className="budget-input-container animate-slide-in">
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            marginBottom: '1rem',
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => currency !== 'USD' && onToggleCurrency()}
                            className={`btn ${currency === 'USD' ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                        >
                            <Coins size={15} />
                            <span>{t('currencyUSD')}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => currency !== 'EGP' && onToggleCurrency()}
                            className={`btn ${currency === 'EGP' ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                        >
                            <Coins size={15} />
                            <span>{t('currencyEGP')}</span>
                        </button>
                    </div>
                    <div className="input-with-addon">
                        <input
                            type="number"
                            min="1"
                            step="1"
                            className="budget-field"
                            placeholder={currentStepData.placeholder}
                            value={parseFloat(answers.budget) || ''}
                            onChange={(e) => {
                                const val = e.target.value;
                                setAnswers({
                                    ...answers,
                                    budget: val ? `${val} ${currency}` : '',
                                    currency,
                                });
                            }}
                        />
                        <span className="addon-text">{currency}</span>
                    </div>
                </div>
            ) : (
                <>
                    <div className="tiles-grid">
                        {currentStepData.options.map((opt) => {
                            const IconComponent = opt.icon;
                            const selected = isSelected(opt.label);
                            return (
                                <div
                                    key={opt.label}
                                    className={`tile ${selected ? 'selected' : ''}`}
                                    onClick={() =>
                                        currentStepData.isMulti
                                            ? handleMultiSelect(opt.label)
                                            : handleSingleSelect(opt.label)
                                    }
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            currentStepData.isMulti
                                                ? handleMultiSelect(opt.label)
                                                : handleSingleSelect(opt.label);
                                        }
                                    }}
                                >
                                    <div className="tile-icon">
                                        <IconComponent size={22} />
                                    </div>
                                    <div className="tile-label">{opt.localizedLabel}</div>
                                    <div className="tile-desc">{opt.desc}</div>
                                </div>
                            );
                        })}
                    </div>

                    {isOtherActive(currentStepData.key) && (
                        <div className="custom-input-container animate-slide-in">
                            <label className="custom-input-label">{t('specifyPreference')}</label>
                            <input
                                type="text"
                                className="custom-field"
                                placeholder={
                                    currentStepData.key === 'dietaryRestrictions'
                                        ? t('Other_diet_placeholder')
                                        : currentStepData.key === 'allergies'
                                          ? t('Other_allergy_placeholder')
                                          : t('Other_cuisine_placeholder')
                                }
                                value={customInputs[currentStepData.key] || ''}
                                onChange={handleCustomInputChange}
                                maxLength={40}
                            />
                        </div>
                    )}
                </>
            )}

            <div className="quiz-footer">
                <button
                    type="button"
                    onClick={handleBack}
                    className="btn btn-secondary"
                    disabled={currentStep === 0}
                    style={{ opacity: currentStep === 0 ? 0.35 : 1 }}
                >
                    <ArrowLeft size={16} />
                    <span>{t('btnBack')}</span>
                </button>

                <button
                    type="button"
                    onClick={handleNext}
                    className="btn btn-primary"
                    disabled={isContinueDisabled()}
                    style={{
                        opacity: isContinueDisabled() ? 0.5 : 1,
                        cursor: isContinueDisabled() ? 'not-allowed' : 'pointer',
                    }}
                >
                    <span>
                        {currentStep === steps.length - 1 ? t('btnFindRecipe') : t('btnContinue')}
                    </span>
                    <ArrowRight size={16} />
                </button>
            </div>
        </div>
    );
}
