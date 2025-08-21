import { money } from '../lib/money';

export default function ProductCard({ product, onAdd, disabled = false }) {
  return (
    <div className="card shadow-sm border-0 h-100 product-card">
      <div className="position-relative">
        <img 
          src={product.img || product.image_url} 
          className="card-img-top product-img" 
          alt={product.name}
          style={{ height: '200px', objectFit: 'cover' }}
        />
        {disabled && (
          <div className="position-absolute top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center">
            <div className="text-white text-center">
              <i className="bi bi-lock display-6 mb-2"></i>
              <p className="mb-0">Autentícate para comprar</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="card-body d-flex flex-column p-3">
        <h6 className="card-title fw-bold mb-2">{product.name}</h6>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <span className="h5 text-primary fw-bold mb-0">
            {money(product.price_pen ?? product.price)}
          </span>
          {!disabled && (
            <span className="badge bg-success">
              <i className="bi bi-check-circle me-1"></i>
              Disponible
            </span>
          )}
        </div>
        
        <button 
          className={`btn ${disabled ? 'btn-secondary' : 'btn-primary'} mt-auto w-100`} 
          onClick={() => onAdd(product)}
          disabled={disabled}
        >
          <i className={`bi ${disabled ? 'bi-lock' : 'bi-plus-lg'} me-2`}></i>
          {disabled ? 'Autentícate Primero' : 'Agregar al Carrito'}
        </button>
      </div>
    </div>
  );
}
