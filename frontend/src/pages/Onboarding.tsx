import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { completeOnboarding, clearError } from '../store/slices/authSlice';

const NICHES = [
  'Tech & Gadgets',
  'Food & Cooking',
  'Fitness & Health',
  'Travel & Adventure',
  'Fashion & Beauty',
  'Education & Learning',
  'Entertainment & Comedy',
  'Music & Dance',
  'Gaming',
  'Business & Finance',
  'Lifestyle & Vlogging',
  'Photography & Art',
];

const GOALS = [
  'Grow subscribers/followers',
  'Increase engagement rate',
  'Go viral with content',
  'Monetize content',
  'Build brand partnerships',
  'Understand audience better',
  'Improve content quality',
  'Track trends in my niche',
];

const Onboarding: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error, user } = useAppSelector((state) => state.auth);

  const [step, setStep] = useState(1);
  const [youtubeChannelId, setYoutubeChannelId] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const toggleNiche = (niche: string) => {
    setSelectedNiches((prev) =>
      prev.includes(niche)
        ? prev.filter((n) => n !== niche)
        : prev.length < 3
        ? [...prev, niche]
        : prev
    );
  };

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal)
        ? prev.filter((g) => g !== goal)
        : prev.length < 3
        ? [...prev, goal]
        : prev
    );
  };

  const handleSubmit = async () => {
    dispatch(clearError());

    const platforms: string[] = [];
    if (youtubeChannelId.trim()) platforms.push('youtube');
    if (instagramHandle.trim()) platforms.push('instagram');

    const result = await dispatch(
      completeOnboarding({
        platforms,
        onboarding: {
          youtubeChannelId: youtubeChannelId.trim() || undefined,
          instagramHandle: instagramHandle.trim() || undefined,
          contentNiche: selectedNiches,
          goals: selectedGoals,
        },
        onboardingCompleted: true,
      })
    );

    if (result.meta.requestStatus === 'fulfilled') {
      navigate('/dashboard');
    }
  };

  const canProceedStep1 = youtubeChannelId.trim() || instagramHandle.trim();
  const canProceedStep2 = selectedNiches.length > 0;
  const canFinish = selectedGoals.length > 0;

  return (
    <div className="onboarding-page">
      <div className="onboarding-container">
        <div className="onboarding-header">
          <h1>Welcome to ConQ{user?.name ? `, ${user.name}` : ''}</h1>
          <p>Let's set up your creator profile in 3 quick steps</p>
        </div>

        <div className="onboarding-progress">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`progress-step ${s === step ? 'active' : ''} ${s < step ? 'completed' : ''}`}
            >
              <span className="step-number">{s < step ? '\u2713' : s}</span>
              <span className="step-label">
                {s === 1 ? 'Platforms' : s === 2 ? 'Niche' : 'Goals'}
              </span>
            </div>
          ))}
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="onboarding-card">
          {step === 1 && (
            <div className="onboarding-step">
              <h2>Connect Your Platforms</h2>
              <p className="step-description">
                Link your YouTube channel and/or Instagram account to start tracking performance.
              </p>

              <div className="form-group">
                <label htmlFor="youtubeChannelId">YouTube Channel ID</label>
                <input
                  id="youtubeChannelId"
                  type="text"
                  value={youtubeChannelId}
                  onChange={(e) => setYoutubeChannelId(e.target.value)}
                  placeholder="e.g. UCxxxxxxxxxxxxxx"
                />
                <span className="input-hint">
                  Find it at youtube.com/account_advanced
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="instagramHandle">Instagram Username</label>
                <input
                  id="instagramHandle"
                  type="text"
                  value={instagramHandle}
                  onChange={(e) => setInstagramHandle(e.target.value)}
                  placeholder="e.g. your_username"
                />
              </div>

              <div className="onboarding-actions">
                <button
                  className="btn-primary"
                  disabled={!canProceedStep1}
                  onClick={() => setStep(2)}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="onboarding-step">
              <h2>Select Your Content Niche</h2>
              <p className="step-description">
                Choose up to 3 categories that best describe your content.
              </p>

              <div className="chip-grid">
                {NICHES.map((niche) => (
                  <button
                    key={niche}
                    className={`chip ${selectedNiches.includes(niche) ? 'chip-selected' : ''}`}
                    onClick={() => toggleNiche(niche)}
                    type="button"
                  >
                    {niche}
                  </button>
                ))}
              </div>

              <div className="selection-count">
                {selectedNiches.length}/3 selected
              </div>

              <div className="onboarding-actions">
                <button className="btn-secondary" onClick={() => setStep(1)}>
                  Back
                </button>
                <button
                  className="btn-primary"
                  disabled={!canProceedStep2}
                  onClick={() => setStep(3)}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="onboarding-step">
              <h2>What Are Your Goals?</h2>
              <p className="step-description">
                Select up to 3 goals so ConQ can personalize your experience.
              </p>

              <div className="chip-grid">
                {GOALS.map((goal) => (
                  <button
                    key={goal}
                    className={`chip ${selectedGoals.includes(goal) ? 'chip-selected' : ''}`}
                    onClick={() => toggleGoal(goal)}
                    type="button"
                  >
                    {goal}
                  </button>
                ))}
              </div>

              <div className="selection-count">
                {selectedGoals.length}/3 selected
              </div>

              <div className="onboarding-actions">
                <button className="btn-secondary" onClick={() => setStep(2)}>
                  Back
                </button>
                <button
                  className="btn-primary"
                  disabled={!canFinish || loading}
                  onClick={handleSubmit}
                >
                  {loading ? 'Saving...' : 'Get Started'}
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
