'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export function SortDropdown({ currentSort }: { currentSort: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value) params.set('sort', e.target.value);
    else params.delete('sort');
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <select 
      className="text-xs font-bold text-gray-900 bg-transparent outline-none cursor-pointer"
      value={currentSort || 'Popularity'}
      onChange={handleChange}
    >
      <option value="Popularity">Popularity</option>
      <option value="PriceLow">Price: Low to High</option>
      <option value="PriceHigh">Price: High to Low</option>
      <option value="Newest">Newest First</option>
    </select>
  );
}
