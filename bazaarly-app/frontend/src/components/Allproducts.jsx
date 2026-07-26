
import React, { useEffect, useState } from "react";
import { Api } from "../api/client";
import ProductCard from "./ProductCard";
import { allProductsConfig } from "./homepage.config";

export default function AllProducts({ config = allProductsConfig }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    Api.products({ limit: config.limit })
      .then((data) => { if (active) setProducts(data.products || data); })
      .catch((e) => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [config.limit]);

  if (loading) return <div className="all-products-loading">Loading...</div>;
  if (error) return <div className="all-products-error">{error}</div>;

  return (
    <div className="all-products">
      <h3 className="all-products-title">{config.title}</h3>
      <div className="all-products-grid">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
