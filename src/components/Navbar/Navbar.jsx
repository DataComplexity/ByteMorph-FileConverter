import './Navbar.css';

export default function Navbar({ user, onLogin, onSignup, onLogout }) {
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <nav className="bm-navbar">

      <div className="bm-navbar__logo">
        <div className="bm-navbar__logo-icon">B</div>
        <span className="bm-navbar__logo-text">ByteMorph</span>
      </div>

      <div className="bm-navbar__links">
        {['converter', 'compress', 'features', 'formats', 'about'].map(id => (
          <span key={id} className="bm-nav" onClick={() => scrollTo(id)}>
            {id.charAt(0).toUpperCase() + id.slice(1)}
          </span>
        ))}
      </div>

      <div className="bm-navbar__auth">
        {user ? (
          <div className="bm-navbar__user">
            <span className="bm-user-name">Hi, {user.name.split(' ')[0]}</span>
            <button className="bm-btn-logout" onClick={onLogout}>Logout</button>
          </div>
        ) : (
          <>
            <button className="bm-auth-login" onClick={onLogin}>Log in</button>
            <button className="bm-auth-signup" onClick={onSignup}>Sign up</button>
          </>
        )}
      </div>
    </nav>
  );
}
