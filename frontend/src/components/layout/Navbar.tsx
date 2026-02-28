import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { logout } from '../../store/slices/authSlice';

const Navbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  if (location.pathname === '/login') return null;

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/dashboard">ConQ</Link>
        <span className="navbar-subtitle">AI Growth OS</span>
      </div>

      <div className="navbar-links">
        <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>
          Dashboard
        </Link>
        <Link to="/nlp" className={location.pathname === '/nlp' ? 'active' : ''}>
          NLP Analyzer
        </Link>
        <Link to="/predict" className={location.pathname === '/predict' ? 'active' : ''}>
          Virality Predictor
        </Link>
        <Link to="/trends" className={location.pathname === '/trends' ? 'active' : ''}>
          Trends
        </Link>
      </div>

      <div className="navbar-user">
        {user && (
          <>
            <span className="user-name">{user.name}</span>
            <span className="user-tier">{user.tier}</span>
          </>
        )}
        <button onClick={handleLogout} className="btn-logout">
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
