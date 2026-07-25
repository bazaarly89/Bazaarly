import React from 'react';
import ProductListing from './ProductListing';

// The search page shares the exact same filterable grid as ProductListing;
// it reads the `q` query param and renders the same UI under /search.
export default function Search() {
  return <ProductListing />;
}
