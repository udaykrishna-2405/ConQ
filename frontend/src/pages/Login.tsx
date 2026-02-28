import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { login, register, clearError } from '../store/slices/authSlice';

const Login: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
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
          <h1>ConQ</h1>
          <p>AI-Powered Growth Operating System</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <h2>{isRegister ? 'Create Account' : 'Sign In'}</h2>

          {error && <div className="form-error">{error}</div>}

          {isRegister && (
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                required={isRegister}
                placeholder="Your full name"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
              placeholder="Min 8 characters"
            />
          </div>

          <div className="form-group">
            <label htmlFor="tenantId">Organization ID</label>
            <input
              id="tenantId"
              name="tenantId"
              type="text"
              value={form.tenantId}
              onChange={handleChange}
              required
              placeholder="Your org tenant ID"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>

          <p className="login-toggle">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              className="btn-link"
              onClick={() => {
                setIsRegister(!isRegister);
                dispatch(clearError());
              }}
            >
              {isRegister ? 'Sign In' : 'Create Account'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
