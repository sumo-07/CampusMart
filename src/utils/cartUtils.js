const CART_KEY = "campusmart_cart";

export const getCartFromStorage = () => {
  const cart = localStorage.getItem(CART_KEY);
  return cart ? JSON.parse(cart) : [];
};

export const saveCartToStorage = (cart) => {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
};

export const addToCart = (product) => {
  const cart = getCartFromStorage();

  const existingItem = cart.find((item) => item.id === product.id);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      thumbnail: product.thumbnail,
      quantity: 1,
    });
  }

  saveCartToStorage(cart);
};

export const updateQuantity = (id, type) => {
  const cart = getCartFromStorage();

  const updatedCart = cart
    .map((item) => {
      if (item.id === id) {
        if (type === "inc") item.quantity += 1;
        if (type === "dec") item.quantity -= 1;
      }
      return item;
    })
    .filter((item) => item.quantity > 0);

  saveCartToStorage(updatedCart);
  return updatedCart;
};

export const clearCart = () => {
  localStorage.removeItem(CART_KEY);
};

export const removeFromCart = (id) => {
  const cart = getCartFromStorage();
  const updatedCart = cart.filter((item) => item.id !== id);
  saveCartToStorage(updatedCart);
  return updatedCart;
};