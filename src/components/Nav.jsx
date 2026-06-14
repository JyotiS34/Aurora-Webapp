import { NavLink } from 'react-router-dom';
import StatusPill from './StatusPill';

export default function Nav() {
  return (
    <nav className="nav" role="navigation" aria-label="Main navigation">
      <div className="nav-inner">

        {/* Logo */}
        <NavLink to="/" className="nav-logo">
          <span className="nav-logo-mark" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 13 Q6 5 9 9 Q12 13 16 6" stroke="#36E2C5" strokeWidth="2" strokeLinecap="round" fill="none"/>
              <path d="M2 15.5 Q6 9 9 12 Q12 15 16 9" stroke="#8B7CFF" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.7"/>
            </svg>
          </span>
          AURORA
        </NavLink>

        {/* Links */}
        <ul className="nav-links">
          {[
            { to: '/',         label: 'Overview'  },
            { to: '/demo',     label: 'Demo'      },
            { to: '/training', label: 'Training'  },
            { to: '/pipeline', label: 'Pipeline'  },
          ].map(({ to, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  'nav-link' + (isActive ? ' active' : '')
                }
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* API status */}
        <div className="nav-status">
          <StatusPill />
        </div>

      </div>
    </nav>
  );
}
