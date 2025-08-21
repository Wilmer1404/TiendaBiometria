import { useState } from 'react';
import { apiCreateUser } from '../lib/api';

export default function PersonRegistration({ onUserCreated, onBack }) {
  const [formData, setFormData] = useState({
    student_id: '',
    full_name: '',
    email: '',
    balance_pen: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await apiCreateUser(formData);
      if (response.ok) {
        setMessage('Usuario creado exitosamente! ✅');
        setTimeout(() => {
          onUserCreated(response.user);
        }, 1500);
      } else {
        setMessage(`Error: ${response.error}`);
      }
    } catch (error) {
      setMessage('Error de conexión. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-6">
          <div className="card shadow-lg border-0">
            <div className="card-header bg-gradient-primary text-white text-center py-4">
              <h2 className="mb-0">
                <i className="bi bi-person-plus-fill me-2"></i>
                Registro de Nueva Persona
              </h2>
              <p className="mb-0 mt-2 opacity-75">Completa tus datos para acceder a la tienda</p>
            </div>
            
            <div className="card-body p-4">
              {message && (
                <div className={`alert ${message.includes('Error') ? 'alert-danger' : 'alert-success'} alert-dismissible fade show`}>
                  {message}
                  <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="student_id" className="form-label fw-semibold">
                    <i className="bi bi-card-text me-2 text-primary"></i>
                    Código de Estudiante
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    id="student_id"
                    name="student_id"
                    value={formData.student_id}
                    onChange={handleInputChange}
                    required
                    placeholder="Ej: 20230001"
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="full_name" className="form-label fw-semibold">
                    <i className="bi bi-person me-2 text-primary"></i>
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    required
                    placeholder="Ej: Juan Pérez García"
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="email" className="form-label fw-semibold">
                    <i className="bi bi-envelope me-2 text-primary"></i>
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    className="form-control form-control-lg"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="juan.perez@email.com"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="balance_pen" className="form-label fw-semibold">
                    <i className="bi bi-wallet2 me-2 text-primary"></i>
                    Saldo Inicial (S/)
                  </label>
                  <input
                    type="number"
                    className="form-control form-control-lg"
                    id="balance_pen"
                    name="balance_pen"
                    value={formData.balance_pen}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="100.00"
                  />
                  <div className="form-text">Este será tu saldo inicial para realizar compras</div>
                </div>

                <div className="d-grid gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Creando usuario...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-2"></i>
                        Crear Usuario
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={onBack}
                  >
                    <i className="bi bi-arrow-left me-2"></i>
                    Volver
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 