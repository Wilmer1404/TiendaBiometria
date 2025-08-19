// src/App.jsx
import { useState } from 'react';
import BiometricEnroll from './pages/BiometricEnroll';
import BiometricLogin from './pages/BiometricLogin';
import Store from './pages/Store';

export default function App() {
  const [page, setPage] = useState('login');
  const [userId, setUserId] = useState(null);

  return (
    <div>
      <nav className="navbar navbar-expand-lg bg-white border-bottom">
        <div className="container">
          <a className="navbar-brand fw-bold" href="#">
            <i className="bi bi-shop me-2 text-primary"></i> Tienda Inteligente
          </a>
          <div className="ms-auto d-flex gap-2">
            <button className={`btn btn-sm ${page==='enroll'?'btn-primary':'btn-outline-primary'}`} onClick={()=>setPage('enroll')}>
              <i className="bi bi-person-plus me-1"></i> Enrolar
            </button>
            <button className={`btn btn-sm ${page==='login'?'btn-success':'btn-outline-success'}`} onClick={()=>setPage('login')}>
              <i className="bi bi-shield-lock me-1"></i> Autenticar
            </button>
            <button className={`btn btn-sm ${page==='store'?'btn-dark':'btn-outline-dark'}`} onClick={()=>setPage('store')}>
              <i className="bi bi-bag me-1"></i> Tienda
            </button>
          </div>
        </div>
      </nav>

      {page === 'enroll' && <BiometricEnroll />}
      {page === 'login' && <BiometricLogin onAuthenticated={setUserId} />}
      {page === 'store' && <Store userId={userId} />}
    </div>
  );
}
