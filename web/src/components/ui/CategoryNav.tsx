import Link from 'next/link';
import React from 'react';

export async function CategoryNav() {
  let categories = [];
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5030';
    const res = await fetch(`${apiUrl}/api/categories`, { cache: 'no-store' });
    if (res.ok) {
      categories = await res.json();
    }
  } catch (err) {
    console.error("Failed to load header categories:", err);
  }

  return (
    <>
      {categories.slice(0, 5).map((cat: any) => (
        <Link key={cat.id} href={`/products/${cat.slug}`} className="py-3 hover:text-secondary transition-colors whitespace-nowrap">
          {cat.name}
        </Link>
      ))}
    </>
  );
}
