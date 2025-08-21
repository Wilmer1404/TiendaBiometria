import { money } from '../lib/money';

export default function Cart({ items, onRemove, userInfo }) {
  const total = items.reduce((s, it) => s + (it.price || it.price_pen) * it.qty, 0);
  
  if (items.length === 0) {
    return (
      <div className="card shadow-lg border-0">
        <div className="card-header bg-gradient-info text-white py-3">
          <h5 className="mb-0">
            <i className="bi bi-bag me-2"></i>
            Tu Carrito de Compras
          </h5>
        </div>
        <div className="card-body text-center py-5">
          <div className="display-4 text-muted mb-3">
            <i className="bi bi-bag-x"></i>
          </div>
          <h5 className="text-muted mb-3">Carrito vacío</h5>
          <p className="text-muted mb-0">
            {userInfo 
              ? 'Agrega productos para comenzar a comprar' 
              : 'Autentícate primero para agregar productos'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card shadow-lg border-0">
      <div className="card-header bg-gradient-primary text-white py-3">
        <h5 className="mb-0">
          <i className="bi bi-bag me-2"></i>
          Tu Carrito de Compras
        </h5>
      </div>
      
      <div className="card-body p-0">
        <div className="list-group list-group-flush">
          {items.map(it => (
            <div key={it.id} className="list-group-item d-flex justify-content-between align-items-center py-3">
              <div className="d-flex align-items-center">
                <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                  <i className="bi bi-box text-primary"></i>
                </div>
                <div>
                  <h6 className="mb-1 fw-bold">{it.name}</h6>
                  <small className="text-muted">Precio unitario: {money(it.price || it.price_pen)}</small>
                </div>
              </div>
              
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center">
                  <button 
                    className="btn btn-sm btn-outline-danger" 
                    onClick={() => onRemove(it.id)}
                    title="Reducir cantidad"
                  >
                    <i className="bi bi-dash"></i>
                  </button>
                  <span className="mx-3 fw-bold">{it.qty}</span>
                </div>
                <span className="fw-bold text-primary">
                  {money((it.price || it.price_pen) * it.qty)}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="card-footer bg-light">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Total a pagar:</h5>
            <h4 className="mb-0 text-primary fw-bold">{money(total)}</h4>
          </div>
          
          {userInfo && (
            <div className="mt-2">
              <small className="text-muted">
                Saldo disponible: <span className="fw-bold text-success">S/ {money(userInfo.balance_pen)}</span>
              </small>
              {total > userInfo.balance_pen && (
                <div className="alert alert-warning mt-2 mb-0 py-2">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  <small>Saldo insuficiente para esta compra</small>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
