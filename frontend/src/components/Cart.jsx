import { money } from '../lib/money';

export default function Cart({ items, onRemove }) {
  const total = items.reduce((s, it) => s + (it.price || it.price_pen) * it.qty, 0);
  return (
    <div className="card card-soft mt-4">
      <div className="card-body">
        <h4 className="h5 mb-3"><i className="bi bi-bag me-2"></i>Carrito</h4>
        <ul className="list-group">
          {items.map(it => (
            <li key={it.id} className="list-group-item d-flex justify-content-between align-items-center">
              <span>{it.name} × {it.qty}</span>
              <span>
                <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => onRemove(it.id)}>-</button>
                {money((it.price || it.price_pen) * it.qty)}
              </span>
            </li>
          ))}
          <li className="list-group-item d-flex justify-content-between">
            <strong>Total</strong>
            <strong>{money(total)}</strong>
          </li>
        </ul>
      </div>
    </div>
  );
}
