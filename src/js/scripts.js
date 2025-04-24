const API_BASE_URL = 'https://redebots-v2.discloud.app';
let currentPage = 1;
const productsPerPage = 8;
let isLoading = false;
let cart = [];

document.addEventListener('DOMContentLoaded', () => {
  checkAuthStatus();
  loadCategories();
  loadProducts();
  setupInfiniteScroll();
  setupCart();

  // Menu mobile
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  mobileMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
    gsap.to(mobileMenu, { x: mobileMenu.classList.contains('hidden') ? -300 : 0, duration: 0.3 });
  });

  // Busca
  const searchBar = document.getElementById('search-bar');
  const mobileSearchBar = document.getElementById('mobile-search-bar');
  searchBar.addEventListener('input', debounce(() => {
    currentPage = 1;
    document.getElementById('products-grid').innerHTML = '';
    loadProducts();
  }, 300));
  mobileSearchBar.addEventListener('input', debounce(() => {
    currentPage = 1;
    document.getElementById('products-grid').innerHTML = '';
    loadProducts();
  }, 300));

  // Filtros
  document.getElementById('category-filter').addEventListener('change', () => {
    currentPage = 1;
    document.getElementById('products-grid').innerHTML = '';
    loadProducts();
  });
  document.getElementById('sort-filter').addEventListener('change', () => {
    currentPage = 1;
    document.getElementById('products-grid').innerHTML = '';
    loadProducts();
  });

  // Adicionar produto
  document.getElementById('add-product').addEventListener('click', handleAddProduct);
  document.getElementById('mobile-add-product').addEventListener('click', handleAddProduct);

  // Modal
  document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('auth-modal').classList.add('hidden');
  });

  // Carrinho
  document.getElementById('cart-link').addEventListener('click', showCart);
  document.getElementById('mobile-cart-link').addEventListener('click', showCart);
  document.getElementById('close-cart-modal').addEventListener('click', () => {
    document.getElementById('cart-modal').classList.add('hidden');
  });

  // Carregar mais
  document.getElementById('load-more').addEventListener('click', () => {
    currentPage++;
    loadProducts();
  });
});

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

async function checkAuthStatus() {
  const token = localStorage.getItem('access_token');
  const authLink = document.getElementById('auth-link');
  const mobileAuthLink = document.getElementById('mobile-auth-link');
  const addProduct = document.getElementById('add-product');
  const mobileAddProduct = document.getElementById('mobile-add-product');
  const modal = document.getElementById('auth-modal');
  const modalMessage = document.getElementById('modal-message');
  const modalAction = document.getElementById('modal-action');

  if (token) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.user) {
        authLink.innerHTML = '<i class="fas fa-sign-out-alt mr-1"></i> Logout';
        mobileAuthLink.innerHTML = '<i class="fas fa-sign-out-alt mr-1"></i> Logout';
        authLink.addEventListener('click', (e) => {
          e.preventDefault();
          modalMessage.textContent = 'Deseja sair da sua conta?';
          modalAction.innerHTML = '<i class="fas fa-sign-out-alt mr-1"></i> Sair';
          modalAction.onclick = handleLogout;
          modal.classList.remove('hidden');
          gsap.from(modal, { opacity: 0, y: -50, duration: 0.5 });
        });
        mobileAuthLink.addEventListener('click', (e) => {
          e.preventDefault();
          modalMessage.textContent = 'Deseja sair da sua conta?';
          modalAction.innerHTML = '<i class="fas fa-sign-out-alt mr-1"></i> Sair';
          modalAction.onclick = handleLogout;
          modal.classList.remove('hidden');
          gsap.from(modal, { opacity: 0, y: -50, duration: 0.5 });
        });
        if (data.user.role === 'admin' && data.user.discordId === '1219787450583486500') {
          addProduct.classList.remove('hidden');
          mobileAddProduct.classList.remove('hidden');
          window.location.href = '/admin.html';
        } else {
          window.location.href = '/client.html';
        }
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
    }
  } else {
    authLink.href = `${API_BASE_URL}/auth/discord`;
    mobileAuthLink.href = `${API_BASE_URL}/auth/discord`;
    addProduct.classList.add('hidden');
    mobileAddProduct.classList.add('hidden');
  }

  // Verificar callback do Discord
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  if (code) {
    handleDiscordCallback(code);
  }
}

async function handleDiscordCallback(code) {
  const modal = document.getElementById('auth-modal');
  const modalMessage = document.getElementById('modal-message');
  const modalAction = document.getElementById('modal-action');
  try {
    const response = await fetch(`${API_BASE_URL}/auth/discord/callback?code=${code}`, {
      method: 'GET',
    });
    const data = await response.json();
    if (data.user && data.token) {
      localStorage.setItem('access_token', data.token);
      modalMessage.textContent = 'Autenticação realizada com sucesso!';
      modalAction.innerHTML = '<i class="fas fa-check mr-1"></i> Continuar';
      modalAction.onclick = () => {
        modal.classList.add('hidden');
        if (data.user.role === 'admin' && data.user.discordId === '1219787450583486500') {
          window.location.href = '/admin.html';
        } else {
          window.location.href = '/client.html';
        }
      };
      modal.classList.remove('hidden');
      gsap.from(modal, { opacity: 0, y: -50, duration: 0.5 });
    } else {
      modalMessage.textContent = 'Erro na autenticação. Tente novamente.';
      modalAction.innerHTML = '<i class="fas fa-redo mr-1"></i> Tentar Novamente';
      modalAction.onclick = () => {
        window.location.href = `${API_BASE_URL}/auth/discord`;
      };
      modal.classList.remove('hidden');
      gsap.from(modal, { opacity: 0, y: -50, duration: 0.5 });
    }
  } catch (error) {
    modalMessage.textContent = 'Erro ao processar autenticação. Tente novamente.';
    modalAction.innerHTML = '<i class="fas fa-redo mr-1"></i> Tentar Novamente';
    modalAction.onclick = () => {
      window.location.href = `${API_BASE_URL}/auth/discord`;
    };
    modal.classList.remove('hidden');
    gsap.from(modal, { opacity: 0, y: -50, duration: 0.5 });
  }
}

function handleLogout() {
  localStorage.removeItem('access_token');
  document.getElementById('auth-modal').classList.add('hidden');
  window.location.href = '/';
}

function handleAddProduct(e) {
  e.preventDefault();
  const token = localStorage.getItem('access_token');
  if (!token) {
    window.location.href = `${API_BASE_URL}/auth/discord`;
  } else {
    window.location.href = '/admin.html';
  }
}

async function loadCategories() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/categories`);
    const { data } = await response.json();
    const categoriesDropdown = document.getElementById('categories-dropdown');
    const mobileCategoriesMenu = document.getElementById('mobile-categories-menu');
    const categoryFilter = document.getElementById('category-filter');
    const categoriesGrid = document.getElementById('categories-grid');

    // Dropdown e Filtro
    data.forEach(category => {
      const link = document.createElement('a');
      link.href = `#category-${category.id}`;
      link.innerHTML = `<i class="fas fa-tag mr-1"></i> ${category.name}`;
      link.className = 'text-gray-600 hover:text-blue-600';
      categoriesDropdown.appendChild(link);

      const mobileLink = document.createElement('a');
      mobileLink.href = `#category-${category.id}`;
      mobileLink.innerHTML = `<i class="fas fa-tag mr-1"></i> ${category.name}`;
      mobileLink.className = 'block text-gray-600 hover:text-blue-600';
      mobileCategoriesMenu.appendChild(mobileLink);

      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = category.name;
      categoryFilter.appendChild(option);
    });

    // Grid de categorias destacadas
    data.slice(0, 4).forEach((category, index) => {
      const categoryCard = document.createElement('div');
      categoryCard.className = 'bg-white rounded-lg shadow-md overflow-hidden transition-transform transform hover:scale-105';
      categoryCard.innerHTML = `
        <img src="https://placehold.co/300x200" alt="${category.name}" class="w-full h-32 object-cover">
        <div class="p-4">
          <h3 class="text-lg font-semibold text-gray-900">${category.name}</h3>
          <a href="#category-${category.id}" class="text-blue-600 hover:underline"><i class="fas fa-arrow-right mr-1"></i> Explorar</a>
        </div>
      `;
      categoriesGrid.appendChild(categoryCard);
      gsap.from(categoryCard, { opacity: 0, y: 50, duration: 0.8, delay: index * 0.1 });
    });
  } catch (error) {
    console.error('Erro ao carregar categorias:', error);
  }
}

async function loadProducts() {
  if (isLoading) return;
  isLoading = true;
  document.getElementById('loading').classList.remove('hidden');
  document.getElementById('load-more').classList.add('hidden');

  try {
    const categoryId = document.getElementById('category-filter').value;
    const searchTerm = document.getElementById('search-bar').value || document.getElementById('mobile-search-bar').value;
    const sort = document.getElementById('sort-filter').value;
    let url = `${API_BASE_URL}/api/products?page=${currentPage}&limit=${productsPerPage}`;
    if (categoryId) url += `&categoryId=${categoryId}`;
    if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
    if (sort) url += `&sort=${sort}`;

    const response = await fetch(url);
    const { data, pagination } = await response.json();
    const productsGrid = document.getElementById('products-grid');

    data.forEach((product, index) => {
      const productCard = document.createElement('div');
      productCard.className = 'bg-white rounded-lg shadow-md overflow-hidden product-card';
      productCard.innerHTML = `
        <img src="${product.image_url || 'https://placehold.co/300x200'}" alt="${product.name}" class="w-full h-48 object-cover">
        <div class="p-4">
          <h3 class="text-lg font-semibold text-gray-900">${product.name}</h3>
          <p class="text-gray-600 mt-1">${product.description ? product.description.substring(0, 50) + '...' : ''}</p>
          <p class="text-blue-600 font-bold mt-2">R$ ${product.price.toFixed(2)}</p>
          <button class="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition" onclick="addToCart(${product.id}, '${product.name}', ${product.price})"><i class="fas fa-cart-plus mr-1"></i> Adicionar ao Carrinho</button>
        </div>
      `;
      productsGrid.appendChild(productCard);
      gsap.from(productCard, { opacity: 0, y: 50, duration: 0.8, delay: index * 0.1 });
    });

    if (currentPage < pagination.pages) {
      document.getElementById('load-more').classList.remove('hidden');
    }
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
  } finally {
    isLoading = false;
    document.getElementById('loading').classList.add('hidden');
  }
}

function setupInfiniteScroll() {
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !isLoading) {
      currentPage++;
      loadProducts();
    }
  }, { threshold: 0.1 });

  observer.observe(document.getElementById('loading'));
}

function setupCart() {
  cart = JSON.parse(localStorage.getItem('cart')) || [];
  updateCartUI();
  document.getElementById('checkout-btn').addEventListener('click', handleCheckout);
}

function addToCart(productId, productName, price) {
  const existingItem = cart.find(item => item.productId === productId);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ productId, productName, price, quantity: 1 });
  }
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartUI();
  showCart();
}

function updateCartUI() {
  const cartItems = document.getElementById('cart-items');
  const cartCount = document.getElementById('cart-count');
  const mobileCartCount = document.getElementById('mobile-cart-count');
  const cartTotal = document.getElementById('cart-total');

  cartItems.innerHTML = '';
  let total = 0;
  cart.forEach((item, index) => {
    total += item.price * item.quantity;
    const itemElement = document.createElement('div');
    itemElement.className = 'flex justify-between items-center border-b py-2';
    itemElement.innerHTML = `
      <div>
        <p class="font-semibold">${item.productName}</p>
        <p class="text-gray-600">R$ ${item.price.toFixed(2)} x ${item.quantity}</p>
      </div>
      <button class="text-red-600 hover:text-red-800" onclick="removeFromCart(${index})"><i class="fas fa-trash"></i></button>
    `;
    cartItems.appendChild(itemElement);
  });

  cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
  mobileCartCount.textContent = cartCount.textContent;
  cartTotal.textContent = total.toFixed(2);
}

function removeFromCart(index) {
  cart.splice(index, 1);
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartUI();
}

function showCart() {
  const modal = document.getElementById('cart-modal');
  modal.classList.remove('hidden');
  gsap.from(modal, { opacity: 0, y: -50, duration: 0.5 });
}

async function handleCheckout() {
  const token = localStorage.getItem('access_token');
  if (!token) {
    window.location.href = `${API_BASE_URL}/auth/discord`;
    return;
  }

  if (cart.length === 0) {
    alert('Carrinho vazio!');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const { user } = await response.json();
    const customerId = user.id;

    const order = {
      customerId,
      items: cart.map(item => ({ productId: item.productId, quantity: item.quantity })),
      status: 'pending'
    };

    const orderResponse = await fetch(`${API_BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(order)
    });
    const orderData = await orderResponse.json();

    const invoiceResponse = await fetch(`${API_BASE_URL}/api/invoices`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ orderId: orderData.id })
    });
    const invoiceData = await invoiceResponse.json();

    const paymentResponse = await fetch(`${API_BASE_URL}/api/payments/pix`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ invoiceId: invoiceData.id, amount: invoiceData.total })
    });
    const paymentData = await paymentResponse.json();

    const modal = document.getElementById('auth-modal');
    const modalMessage = document.getElementById('modal-message');
    const modalAction = document.getElementById('modal-action');

    modalMessage.innerHTML = `
      <p>Compra finalizada com sucesso! Escaneie o QR Code para pagar:</p>
      <img src="${paymentData.qrCode}" alt="QR Code PIX" class="mx-auto my-4">
      <p>Copia e Cola: ${paymentData.payload}</p>
    `;
    modalAction.innerHTML = '<i class="fas fa-check mr-1"></i> Concluído';
    modalAction.onclick = () => {
      cart = [];
      localStorage.setItem('cart', JSON.stringify(cart));
      updateCartUI();
      document.getElementById('cart-modal').classList.add('hidden');
      modal.classList.add('hidden');
      window.location.href = '/client.html';
    };
    modal.classList.remove('hidden');
    document.getElementById('cart-modal').classList.add('hidden');
    gsap.from(modal, { opacity: 0, y: -50, duration: 0.5 });
  } catch (error) {
    console.error('Erro ao finalizar compra:', error);
    alert('Erro ao finalizar compra. Tente novamente.');
  }
}