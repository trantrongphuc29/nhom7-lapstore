import React from 'react';

const ProductCard = ({ product }) => {
  return (
    <a href={`/products/${product.id}`} className="group bg-white dark:bg-background-dark rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all relative block">
      {product.badge && (
        <div className="absolute top-2 left-2 z-10">
          <span className={`${product.badge === 'New' ? 'bg-primary' : 'bg-red-500'} text-white text-[10px] font-bold px-2 py-1 rounded-full`}>
            {product.badge}
          </span>
        </div>
      )}
      <div className="p-4 flex flex-col h-full">
        <div className="aspect-square mb-4 relative overflow-hidden rounded-lg bg-slate-50">
          <img className="w-full h-full object-contain group-hover:scale-105 transition-transform" alt={product.name} src={product.image} />
        </div>
        <h4 className="text-sm font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">{product.name}</h4>
        <div className="flex gap-2 mb-3">
          {product.specs.map(spec => (
            <span key={spec} className="bg-slate-100 dark:bg-slate-800 text-[10px] px-2 py-0.5 rounded text-slate-600 dark:text-slate-400">{spec}</span>
          ))}
        </div>
        <div className="mt-auto">
          <p className="text-primary font-bold text-lg">{product.price}</p>
          {product.oldPrice && <p className="text-slate-400 text-xs line-through">{product.oldPrice}</p>}
        </div>
      </div>
    </a>
  );
};

export default ProductCard;
