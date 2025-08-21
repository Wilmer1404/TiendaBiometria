import { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard';
import Cart from '../components/Cart';
import { apiGetProducts, apiCheckout, apiGetUser } from '../lib/api';
import { money } from '../lib/money';

export default function Store({ userId, isAuthenticated }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Limpiar datos de usuario y carrito al cambiar de usuario o autenticación
    setUserInfo(null);
    setCart([]);
    (async () => {
      try { 
        setIsLoading(true);
        setProducts(await apiGetProducts()); 
        
        if (userId && isAuthenticated) {
          const userResp = await apiGetUser(userId);
          if (userResp.ok) {
            setUserInfo(userResp.user);
          }
        }
      }
      catch (e) { 
        console.error(e); 
        alert('No se pudieron cargar productos'); 
      } finally {
        setIsLoading(false);
      }
    })();
  }, [userId, isAuthenticated]);

  function add(p){
    if (!isAuthenticated) {
      alert('Debes autenticarte biométricamente para agregar productos al carrito');
      return;
    }
    
    setCart(prev=>{
      const f = prev.find(x=>x.id===p.id);
      if (f) return prev.map(x=>x.id===p.id? {...x, qty:x.qty+1 } : x);
      return [...prev, { id:p.id, name:p.name, price:p.price_pen??p.price, qty:1 }];
    });
  }
  
  function remove(id){
    setCart(prev => prev.flatMap(x => x.id===id ? (x.qty>1 ? [{...x, qty:x.qty-1}] : []) : [x]));
  }

  async function pay(){
    if (!isAuthenticated) { 
      alert('Debes autenticarte biométricamente para realizar compras.'); 
      return; 
    }
    if (!cart.length) { alert('Carrito vacío.'); return; }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    if (userInfo && total > userInfo.balance_pen) {
      alert(`Saldo insuficiente. Necesitas S/ ${money(total - userInfo.balance_pen)} más.`);
      return;
    }
    
    const items = cart.map(it=>({ productId: it.id, qty: it.qty }));
    const resp = await apiCheckout(userId, items);
    if (resp.ok) { 
      alert(`Pago exitoso: ${money(resp.total)}`); 
      setCart([]); 
      
      // Actualizar saldo del usuario
      if (userInfo) {
        setUserInfo(prev => ({
          ...prev,
          balance_pen: prev.balance_pen - resp.total
        }));
      }
    }
    else { alert('Error: ' + (resp.error || 'No se pudo pagar')); }
  }

  if (isLoading) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card shadow-lg border-0">
              <div className="card-body text-center py-5">
                <div className="spinner-border text-primary mb-3" role="status" style={{width: '3rem', height: '3rem'}}>
                  <span className="visually-hidden">Cargando...</span>
                </div>
                <h4 className="text-muted">Cargando productos...</h4>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card shadow-lg border-0">
              <div className="card-header bg-gradient-warning text-white py-4 text-center">
                <h4 className="mb-0">
                  <i className="bi bi-shield-exclamation me-2"></i>
                  Acceso Requiere Autenticación Biométrica
                </h4>
              </div>
              <div className="card-body text-center py-5">
                <div className="display-1 text-warning mb-4">
                  <i className="bi bi-lock"></i>
                </div>
                <h3 className="text-warning mb-3">Debes autenticarte primero</h3>
                <p className="text-muted mb-4">
                  Para acceder a la tienda, necesitas completar el proceso de enrolamiento biométrico y autenticarte con tu rostro.
                </p>
                <div className="alert alert-info d-inline-block">
                  <i className="bi bi-lightbulb me-2"></i>
                  <strong>Próximo paso:</strong> Ve a "Enrolar" para configurar tu biometría
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      {/* Header de la tienda */}
      <div className="hero rounded-4 p-5 mb-5 card-soft bg-gradient-primary text-white">
        <div className="row align-items-center">
          <div className="col-lg-8">
            <h1 className="display-5 fw-bold mb-3">
              <i className="bi bi-shop me-3"></i>
              Tienda Inteligente
            </h1>
            <p className="lead mb-4">
              Bienvenido a nuestra tienda con autenticación biométrica. 
              Elige tus productos y paga de forma segura.
            </p>
            
            {userInfo ? (
              <div className="d-flex align-items-center gap-3">
                <div className="bg-white bg-opacity-25 rounded-circle p-3">
                  <i className="bi bi-person-circle display-6"></i>
                </div>
                <div>
                  <h5 className="mb-1">{userInfo.full_name}</h5>
                  <p className="mb-0 opacity-75">
                    Código: {userInfo.student_id} • Saldo: S/ {money(userInfo.balance_pen)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="alert alert-warning d-inline-block">
                <i className="bi bi-exclamation-triangle me-2"></i>
                <strong>Error:</strong> No se pudo cargar la información del usuario
              </div>
            )}
          </div>
          
          <div className="col-lg-4 text-center">
            <div className="badge fs-5 p-3 bg-success">
              <i className="bi bi-shield-check me-2"></i>
              Autenticado Biométricamente
            </div>
          </div>
        </div>
      </div>

      {/* Productos */}
      <div className="row mb-5">
        <div className="col-12">
          <h3 className="fw-bold mb-4">
            <i className="bi bi-grid me-2 text-primary"></i>
            Productos Disponibles
          </h3>
        </div>
      </div>

      <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-4 mb-5">
        {products.map(p=>(
          <div className="col" key={p.id}>
            <ProductCard product={p} onAdd={add} disabled={false}/>
          </div>
        ))}
      </div>

      {/* Carrito y pago */}
      <div className="row">
        <div className="col-lg-8">
          <Cart items={cart} onRemove={remove} userInfo={userInfo} />
        </div>
        
        <div className="col-lg-4">
          <div className="card shadow-lg border-0">
            <div className="card-header bg-gradient-success text-white py-3">
              <h5 className="mb-0">
                <i className="bi bi-credit-card me-2"></i>
                Resumen de Compra
              </h5>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal:</span>
                <span>S/ {money(cart.reduce((sum, item) => sum + (item.price * item.qty), 0))}</span>
              </div>
              
              {userInfo && (
                <div className="d-flex justify-content-between mb-3">
                  <span>Saldo disponible:</span>
                  <span className="fw-bold text-success">S/ {money(userInfo.balance_pen)}</span>
                </div>
              )}
              
              <div className="d-grid">
                <button 
                  className="btn btn-success btn-lg" 
                  onClick={pay}
                  disabled={!cart.length}
                >
                  <i className="bi bi-credit-card me-2"></i> 
                  Confirmar y Pagar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
