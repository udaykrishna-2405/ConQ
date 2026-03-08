import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { completeOnboarding, clearError } from '../store/slices/authSlice';
import { useI18n } from '../i18n';

const NICHES = [
  'Tech & Gadgets', 'Food & Cooking', 'Fitness & Health', 'Travel & Adventure',
  'Fashion & Beauty', 'Education & Learning', 'Entertainment & Comedy', 'Music & Dance',
  'Gaming', 'Business & Finance', 'Lifestyle & Vlogging', 'Photography & Art',
];

const GOALS = [
  'Grow subscribers/followers', 'Increase engagement rate', 'Go viral with content',
  'Monetize content', 'Build brand partnerships', 'Understand audience better',
  'Improve content quality', 'Track trends in my niche',
];

const Onboarding: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { loading, error, user } = useAppSelector((state) => state.auth);

  const [step, setStep] = useState(1);
  const [youtubeChannelId, setYoutubeChannelId] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const toggleNiche = (niche: string) => {
    setSelectedNiches((prev) =>
      prev.includes(niche) ? prev.filter((n) => n !== niche) : prev.length < 3 ? [...prev, niche] : prev
    );
  };

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : prev.length < 3 ? [...prev, goal] : prev
    );
  };

  const handleSubmit = async () => {
    dispatch(clearError());
    const platforms: string[] = [];
    if (youtubeChannelId.trim()) platforms.push('youtube');
    if (instagramHandle.trim()) platforms.push('instagram');

    const result = await dispatch(completeOnboarding({
      platforms,
      onboarding: {
        youtubeChannelId: youtubeChannelId.trim() || undefined,
        instagramHandle: instagramHandle.trim() || undefined,
        contentNiche: selectedNiches,
        goals: selectedGoals,
      },
      onboardingCompleted: true,
    }));

    if (result.meta.requestStatus === 'fulfilled') {
      navigate('/dashboard');
    }
  };

  const canProceedStep1 = youtubeChannelId.trim() || instagramHandle.trim();
  const canProceedStep2 = selectedNiches.length > 0;
  const canFinish = selectedGoals.length > 0;

  const stepLabels = [t('onboarding.platforms'), t('onboarding.niche'), t('onboarding.goals')];

  return (
    <div className="onboarding-page">
      <div className="onboarding-container">
        <div className="onboarding-header">
          <h1>{t('onboarding.welcome')}{user?.name ? `, ${user.name}` : ''}</h1>
          <p>{t('onboarding.subtitle')}</p>
        </div>

        <div className="onboarding-progress">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`progress-step ${s === step ? 'active' : ''} ${s < step ? 'completed' : ''}`}>
              <span className="step-number">{s < step ? '✓' : s}</span>
              <span className="step-label">{stepLabels[s - 1]}</span>
            </div>
          ))}
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="onboarding-card">
          {step === 1 && (
            <div className="onboarding-step">
              <h2>{t('onboarding.connectPlatforms')}</h2>
              <p className="step-description">{t('onboarding.connectDesc')}</p>

              <div className="form-group">
                <label htmlFor="youtubeChannelId">{t('onboarding.youtubeLabel')}</label>
                <input id="youtubeChannelId" type="text" value={youtubeChannelId}
                  onChange={(e) => setYoutubeChannelId(e.target.value)}
                  placeholder="e.g. UCxxxxxxxxxxxxxx" />
                <span className="input-hint">Find it at youtube.com/account_advanced</span>
              </div>

              <div className="form-group">
                <label htmlFor="instagramHandle">{t('onboarding.instagramLabel')}</label>
                <input id="instagramHandle" type="text" value={instagramHandle}
                  onChange={(e) => setInstagramHandle(e.target.value)}
                  placeholder="e.g. your_username" />
              </div>

              <div className="onboarding-actions">
                <button className="btn-primary" disabled={!canProceedStep1} onClick={() => setStep(2)}>
                  {t('onboarding.next')}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="onboarding-step">
              <h2>{t('onboarding.selectNiche')}</h2>
              <p className="step-description">{t('onboarding.nicheDesc')}</p>

              <div className="chip-grid">
                {NICHES.map((niche) => (
                  <button key={niche} type="button"
                    className={`chip ${selectedNiches.includes(niche) ? 'chip-selected' : ''}`}
                    onClick={() => toggleNiche(niche)}>
                    {niche}
                  </button>
                ))}
              </div>

              <div className="selection-count">{selectedNiches.length}/3 {t('onboarding.selected')}</div>

              <div className="onboarding-actions">
                <button className="btn-secondary" onClick={() => setStep(1)}>{t('onboarding.back')}</button>
                <button className="btn-primary" disabled={!canProceedStep2} onClick={() => setStep(3)}>
                  {t('onboarding.next')}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="onboarding-step">
              <h2>{t('onboarding.selectGoals')}</h2>
              <p className="step-description">{t('onboarding.goalsDesc')}</p>

              <div className="chip-grid">
                {GOALS.map((goal) => (
                  <button key={goal} type="button"
                    className={`chip ${selectedGoals.includes(goal) ? 'chip-selected' : ''}`}
                    onClick={() => toggleGoal(goal)}>
                    {goal}
                  </button>
                ))}
              </div>

              <div className="selection-count">{selectedGoals.length}/3 {t('onboarding.selected')}</div>

              <div className="onboarding-actions">
                <button className="btn-secondary" onClick={() => setStep(2)}>{t('onboarding.back')}</button>
                <button className="btn-primary" disabled={!canFinish || loading} onClick={handleSubmit}>
                  {loading ? t('onboarding.saving') : t('onboarding.getStarted')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
