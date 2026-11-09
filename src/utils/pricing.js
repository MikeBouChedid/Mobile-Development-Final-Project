// Pricing rules for products, printing jobs, and the cart.

export const DELIVERY_FEE = 0.5;
export const FREE_DELIVERY_FROM = 10; // free delivery when subtotal >= $10
export const MIN_ORDER = 2; // minimum order subtotal

export const round2 = (n) => Math.round(n * 100) / 100;

export const money = (n) => `$${round2(n).toFixed(2)}`;

// Unit price of a product with the chosen size and extras
export function productUnitPrice(product, size, extras = []) {
  const sizeExtra = size ? size.extra : 0;
  const extrasTotal = extras.reduce((sum, e) => sum + e.price, 0);
  return round2(product.price + sizeExtra + extrasTotal);
}

// Live price of a printing job, from the price table in campus.json
export function calcPrintPrice(job, prices) {
  const pages = Number(job.pages) || 0;
  const copies = Number(job.copies) || 0;
  if (pages <= 0 || copies <= 0) return 0;

  const perPage = job.color ? prices.colorPerPage : prices.blackWhitePerPage;
  let pagesCost = pages * perPage;
  if (job.doubleSided) {
    pagesCost = pagesCost * (1 - prices.doubleSidedDiscount);
  }
  const bindingCost = prices.binding[job.binding] || 0;
  return round2((pagesCost + bindingCost) * copies);
}

export function cartCount(items) {
  return items.reduce((sum, item) => sum + item.qty, 0);
}

export function cartSubtotal(items) {
  return round2(items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0));
}

export function getDeliveryFee(subtotal) {
  if (subtotal === 0) return 0;
  return subtotal >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;
}
