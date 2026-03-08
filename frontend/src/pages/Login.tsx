import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { login, register, clearError } from '../store/slices/authSlice';
import { useI18n } from '../i18n';

const Login: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { loading, error } = useAppSelector((state) => state.auth);

  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    tenantId: 'demo-tenant',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());

    let result;
    if (isRegister) {
      result = await dispatch(register({
        email: form.email,
        password: form.password,
        name: form.name,
        tenantId: form.tenantId,
      }));
    } else {
      result = await dispatch(login({
        email: form.email,
        password: form.password,
        tenantId: form.tenantId,
      }));
    }

    if (result.meta.requestStatus === 'fulfilled') {
      navigate(isRegister ? '/onboarding' : '/dashboard');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>{t('login.title')}</h1>
          <p>{t('login.tagline')}</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <h2>{isRegister ? t('login.createAccount') : t('login.signIn')}</h2>

          {error && <div className="form-error">{error}</div>}

          {isRegister && (
            <div className="form-group">
              <label htmlFor="name">{t('login.name')}</label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                required={isRegister}
                placeholder={t('login.namePlaceholder')}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">{t('login.email')}</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder={t('login.emailPlaceholder')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('login.password')}</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
              placeholder={t('login.passwordPlaceholder')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="tenantId">{t('login.tenantId')}</label>
            <input
              id="tenantId"
              name="tenantId"
              type="text"
              value={form.tenantId}
              onChange={handleChange}
              required
              placeholder={t('login.tenantPlaceholder')}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading
              ? t('login.pleaseWait')
              : isRegister
                ? t('login.createAccount')
                : t('login.signIn')}
          </button>

          <p className="login-toggle">
            {isRegister ? t('login.hasAccount') : t('login.noAccount')}{' '}
            <button
              type="button"
              className="btn-link"
              onClick={() => {
                setIsRegister(!isRegister);
                dispatch(clearError());
              }}
            >
              {isRegister ? t('login.signIn') : t('login.createAccount')}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
