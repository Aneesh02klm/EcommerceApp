const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) {
    return inrFormatter.format(0);
  }
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  if (isNaN(num)) {
    return inrFormatter.format(0);
  }
  return inrFormatter.format(num);
}
