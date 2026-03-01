import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { logout } from '../../store/slices/authSlice';
import { useI18n } from '../../i18n';

const Navbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector((state) => state.auth.user);
  const { language, setLanguage, t } = useI18n();
  const [moreOpen, setMoreOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  if (location.pathname === '/login') return null;

  const isActive = (path: string) => location.pathname === path ? 'active' : '';
  const isMoreActive = ['/ai-studio', '/monetization', '/content-shield', '/growth-intelligence', '/automation', '/creator-scorecard'].includes(location.pathname);

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/dashboard">{t('nav.brand')}</Link>
        <span className="navbar-subtitle">{t('nav.subtitle')}</span>
      </div>

      <div className="navbar-links">
        <Link to="/dashboard" className={isActive('/dashboard')}>
          {t('nav.dashboard')}
        </Link>
        <Link to="/nlp" className={isActive('/nlp')}>
          {t('nav.nlp')}
        </Link>
        <Link to="/predict" className={isActive('/predict')}>
          {t('nav.predict')}
        </Link>
        <Link to="/trends" className={isActive('/trends')}>
          {t('nav.trends')}
        </Link>
        <div className="nav-dropdown">
          <button
            className={`nav-dropdown-toggle ${isMoreActive ? 'active' : ''}`}
            onClick={() => setMoreOpen(!moreOpen)}
            onBlur={() => setTimeout(() => setMoreOpen(false), 200)}
          >
            More
          </button>
          {moreOpen && (
            <div className="nav-dropdown-menu">
              <Link to="/ai-studio" className={isActive('/ai-studio')} onClick={() => setMoreOpen(false)}>AI Studio</Link>
              <Link to="/monetization" className={isActive('/monetization')} onClick={() => setMoreOpen(false)}>Monetization</Link>
              <Link to="/content-shield" className={isActive('/content-shield')} onClick={() => setMoreOpen(false)}>Content Shield</Link>
              <Link to="/growth-intelligence" className={isActive('/growth-intelligence')} onClick={() => setMoreOpen(false)}>Growth Intelligence</Link>
              <Link to="/automation" className={isActive('/automation')} onClick={() => setMoreOpen(false)}>Automation</Link>
              <Link to="/creator-scorecard" className={isActive('/creator-scorecard')} onClick={() => setMoreOpen(false)}>Creator Scorecard</Link>
            </div>
          )}
        </div>
      </div>

      <div className="navbar-user">
        <button
          className="lang-toggle"
          onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
          title={language === 'en' ? 'हिन्दी में बदलें' : 'Switch to English'}
        >
          {language === 'en' ? 'हिन्दी' : 'EN'}
        </button>
        {user && (
          <>
            <span className="user-name">{user.name}</span>
            <span className="user-tier">{user.tier}</span>
          </>
        )}
        <button onClick={handleLogout} className="btn-logout">
          {t('nav.logout')}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
