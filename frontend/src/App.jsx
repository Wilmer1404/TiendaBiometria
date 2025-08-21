// src/App.jsx
import { useState } from 'react';
import PersonRegistration from './pages/PersonRegistration';
import BiometricEnroll from './pages/BiometricEnroll';
import BiometricLogin from './pages/BiometricLogin';
import Store from './pages/Store';

export default function App() {
  const [page, setPage] = useState('register');
  const [userId, setUserId] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [isBiometricallyAuthenticated, setIsBiometricallyAuthenticated] = useState(false);

  const handleUserCreated = (user) => {
    setUserInfo(user);
    setUserId(user.id);
    setIsBiometricallyAuthenticated(false); // Usuario registrado pero no autenticado
    setPage('enroll');
  };

  const handleEnrollmentComplete = () => {
    setIsBiometricallyAuthenticated(false); // Enrolado pero no autenticado aún
    setPage('login');
  };

  const handleAuthenticated = (id) => {
    setUserId(id);
    setIsBiometricallyAuthenticated(true); // Ahora sí está autenticado
    setPage('store');
  };

  const resetFlow = () => {
    setUserId(null);
    setUserInfo(null);
    setIsBiometricallyAuthenticated(false);
    setPage('register');
  };

  return (
    <div className="min-vh-100 bg-light">
      <nav className="navbar navbar-expand-lg bg-white shadow-sm border-bottom">
        <div className="container">
          <a className="navbar-brand fw-bold text-primary" href="#">
            <i className="bi bi-shop me-2"></i> Tienda Inteligente
          </a>
          
          <div className="ms-auto d-flex gap-2">
            <button 
              className={`btn btn-sm ${page==='register'?'btn-primary':'btn-outline-primary'}`} 
              onClick={() => setPage('register')}
            >
              <i className="bi bi-person-plus me-1"></i> Registrarse
            </button>
            <button 
              className={`btn btn-sm ${page==='enroll'?'btn-warning':'btn-outline-warning'}`} 
              onClick={() => setPage('enroll')}
              disabled={!userId}
            >
              <i className="bi bi-shield-check me-1"></i> Enrolar
            </button>
            <button 
              className={`btn btn-sm ${page==='login'?'btn-success':'btn-outline-success'}`} 
              onClick={() => setPage('login')}
            >
              <i className="bi bi-shield-lock me-1"></i> Autenticar
            </button>
            <button 
              className={`btn btn-sm ${page==='store'?'btn-dark':'btn-outline-dark'}`} 
              onClick={() => setPage('store')}
              disabled={!isBiometricallyAuthenticated}
            >
              <i className="bi bi-bag me-1"></i> Tienda
            </button>
            
            {userId && (
              <button 
                className="btn btn-sm btn-outline-danger" 
                onClick={resetFlow}
                title="Cerrar sesión"
              >
                <i className="bi bi-box-arrow-right"></i>
              </button>
            )}
          </div>
        </div>
      </nav>

      <main>
        {page === 'register' && (
          <PersonRegistration 
            onUserCreated={handleUserCreated} 
            onBack={() => setPage('login')}
          />
        )}
        {page === 'enroll' && (
          <BiometricEnroll 
            userId={userId} 
            onEnrollmentComplete={handleEnrollmentComplete}
          />
        )}
        {page === 'login' && (
          <BiometricLogin onAuthenticated={handleAuthenticated} />
        )}
        {page === 'store' && (
          <Store userId={userId} isAuthenticated={isBiometricallyAuthenticated} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-dark text-white py-4 mt-5">
        <div className="container text-center">
          <p className="mb-0">
            <i className="bi bi-shield-check me-2"></i>
            Sistema de Tienda con Autenticación Biométrica
          </p>
          <small className="text-muted">
            Tecnología de reconocimiento facial para un acceso seguro
          </small>
        </div>
      </footer>
    </div>
  );
}
