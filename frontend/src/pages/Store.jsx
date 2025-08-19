import { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard';
import Cart from '../components/Cart';
import { apiGetProducts, apiCheckout } from '../lib/api';
import { money } from '../lib/money';

export default function Store({ userId }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    (async () => {
      try { setProducts(await apiGetProducts()); }
      catch (e) { console.error(e); alert('No se pudieron cargar productos'); }
    })();
  }, []);

  function add(p){
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
    if (!userId) { alert('Primero autentícate con tu rostro.'); return; }
    if (!cart.length) { alert('Carrito vacío.'); return; }
    const items = cart.map(it=>({ productId: it.id, qty: it.qty }));
    const resp = await apiCheckout(userId, items);
    if (resp.ok) { alert(`Pago exitoso: ${money(resp.total)}`); setCart([]); }
    else { alert('Error: ' + (resp.error || 'No se pudo pagar')); }
  }

  return (
    <div className="container py-5">
      <div className="hero rounded-4 p-4 mb-4 card-soft d-flex align-items-center justify-content-between">
        <div>
          <h1 className="h3 title-strong mb-1">Tienda</h1>
          <p className="text-muted mb-0">Elige tus productos y paga con tu billetera.</p>
        </div>
        <span className={`badge ${userId?'text-bg-success':'text-bg-secondary'}`}>
          {userId ? 'Autenticado' : 'Sin autenticar'}
        </span>
      </div>

      <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-3">
        {products.map(p=>(
          <div className="col" key={p.id}>
            <ProductCard product={p} onAdd={add}/>
          </div>
        ))}
      </div>

      <Cart items={cart} onRemove={remove}/>
      <div className="text-end mt-3">
        <button className="btn btn-success btn-lg" onClick={pay}>
          <i className="bi bi-credit-card me-2"></i> Confirmar y Pagar
        </button>
      </div>
    </div>
  );
}
