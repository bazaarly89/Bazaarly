import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Api } from '../api/client';

export default function Categories() {
  const [categories, setCategories] = useState([]);

  useEffect(() => { Api.categories().then((r) => setCategories(r.categories)); }, []);

  return (
    <div className="container-app py-12">
      <h1 className="section-title mb-8">All Categories</h1>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((c) => (
          <Link key={c.id} to={`/categories/${c.slug}`} className="group card overflow-hidden">
            <div className="aspect-[4/3] overflow-hidden">
              <img src={c.image} alt={c.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-slate-800 group-hover:text-brand-600">{c.name}</h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
