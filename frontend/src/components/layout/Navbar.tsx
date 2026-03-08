import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { logout } from '../../store/slices/authSlice';
import { useI18n } from '../../i18n';
import LanguageSelector from '../common/LanguageSelector';

const MORE_LINKS = [
  { to: '/ai-studio', label: 'AI Studio' },
  { to: '/monetization', label: 'Monetization' },
  { to: '/content-shield', label: 'Content Shield' },
  { to: '/growth-intelligence', label: 'Growth Intelligence' },
  { to: '/automation', label: 'Automation' },
  { to: '/creator-scorecard', label: 'Creator Scorecard' },
];

const Navbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector((state) => state.auth.user);
  const { t } = useI18n();
  const [moreOpen, setMoreOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  if (location.pathname === '/login') return null;

  const isActive = (path: string) => location.pathname === path ? 'active' : '';
  const isMoreActive = MORE_LINKS.some(l => l.to === location.pathname);

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/dashboard">{t('nav.brand')}</Link>
        <span className="navbar-subtitle">{t('nav.subtitle')}</span>
      </div>

      <div className="navbar-links">
        <Link to="/dashboard" className={isActive('/dashboard')}>{t('nav.dashboard')}</Link>
        <Link to="/nlp" className={isActive('/nlp')}>{t('nav.nlp')}</Link>
        <Link to="/predict" className={isActive('/predict')}>{t('nav.predict')}</Link>
        <Link to="/trends" className={isActive('/trends')}>{t('nav.trends')}</Link>

        {/* More Dropdown */}
        <div className="nav-dropdown" ref={dropdownRef}>
          <button
            className={`nav-dropdown-toggle ${isMoreActive ? 'active' : ''}`}
            onClick={() => setMoreOpen(prev => !prev)}
          >
            More ▾
          </button>
          {moreOpen && (
            <div className="nav-dropdown-menu">
              {MORE_LINKS.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={isActive(to)}
                  onClick={() => setMoreOpen(false)}
                >
                  {label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="navbar-user">
        {/* 22-language selector — replaces old toggle button */}
        <LanguageSelector />
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
