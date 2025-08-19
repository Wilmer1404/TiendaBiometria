import { money } from '../lib/money';

export default function ProductCard({ product, onAdd }) {
  return (
    <div className="card card-soft h-100">
      <img src={product.img || product.image_url} className="card-img-top product-img" alt={product.name}/>
      <div className="card-body d-flex flex-column">
        <h5 className="card-title">{product.name}</h5>
        <p className="card-text text-muted mb-3">{money(product.price_pen ?? product.price)}</p>
        <button className="btn btn-dark mt-auto" onClick={() => onAdd(product)}>
          <i className="bi bi-plus-lg me-1"></i> Agregar
        </button>
      </div>
    </div>
  );
}
