// Custom hook that applies the "one store per cart" rule before adding.
import { useApp } from '../context/AppContext';
import { allStores } from '../api/campusApi';
import { confirmAction } from '../utils/dialogs';

export default function useAddToCart() {
  const { cart, isOtherStore, addToCart } = useApp();

  // store: the store of the item, item: the cart line, onAdded: optional callback
  const add = (store, item, onAdded) => {
    const doAdd = () => {
      addToCart(store.id, item);
      if (onAdded) onAdded();
    };

    if (isOtherStore(store.id)) {
      const current = allStores.find((s) => s.id === cart.storeId);
      confirmAction(
        'Start a new cart?',
        `Your cart has items from ${current ? current.name : 'another store'}. ` +
          `You can only order from one store at a time.\n\nEmpty the cart and add this item from ${store.name}?`,
        doAdd,
        'Empty cart'
      );
    } else {
      doAdd();
    }
  };

  return add;
}

// Unique key for a cart line: same product + same options = same line
export function makeItemKey(productId, size, extras = []) {
  const extraLabels = extras.map((e) => e.label).sort().join(',');
  return `${productId}|${size ? size.label : ''}|${extraLabels}`;
}

// "Large · Extra cheese, Fries on the side"
export function makeOptionsLabel(size, extras = []) {
  const parts = [];
  if (size) parts.push(size.label);
  if (extras.length > 0) parts.push(extras.map((e) => e.label).join(', '));
  return parts.join(' · ');
}
