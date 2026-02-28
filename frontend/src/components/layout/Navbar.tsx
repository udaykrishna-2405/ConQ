import React from 'react';
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

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  if (location.pathname === '/login') return null;

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/dashboard">{t('nav.brand')}</Link>
        <span className="navbar-subtitle">{t('nav.subtitle')}</span>
      </div>

      <div className="navbar-links">
        <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>
          {t('nav.dashboard')}
        </Link>
        <Link to="/nlp" className={location.pathname === '/nlp' ? 'active' : ''}>
          {t('nav.nlp')}
        </Link>
        <Link to="/predict" className={location.pathname === '/predict' ? 'active' : ''}>
          {t('nav.predict')}
        </Link>
        <Link to="/trends" className={location.pathname === '/trends' ? 'active' : ''}>
          {t('nav.trends')}
        </Link>
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
