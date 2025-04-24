const API_BASE_URL = 'https://whmcs-js.ofc-rede.workers.dev';
let currentPage = 1;
const productsPerPage = 8;
let isLoading = false;

document.addEventListener('DOMContentLoaded', () => {
  checkAuthStatus();
  loadCategories();
  loadProducts();
  setupInfiniteScroll();

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
    addProduct.classList.remove('hidden');
    mobileAddProduct.classList.remove('hidden');
  } else {
    authLink.href = `${API_BASE_URL}/api/auth/discord`;
    mobileAuthLink.href = `${API_BASE_URL}/api/auth/discord`;
    addProduct.classList.add('hidden');
    mobileAddProduct.classList.add('hidden');
  }

  // Verificar callback do Discord
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  if (code && window.location.pathname.includes('/api/auth/discord/callback')) {
    handleDiscordCallback(code);
  }
}

async function handleDiscordCallback(code) {
  const modal = document.getElementById('auth-modal');
  const modalMessage = document.getElementById('modal-message');
  const modalAction = document.getElementById('modal-action');
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/discord/callback?code=${code}`, {
      method: 'GET',
    });
    const data = await response.json();
    if (data.token) {
      localStorage.setItem('access_token', data.token);
      modalMessage.textContent = 'Autenticação realizada com sucesso!';
      modalAction.innerHTML = '<i class="fas fa-check mr-1"></i> Continuar';
      modalAction.onclick = () => {
        modal.classList.add('hidden');
        window.location.href = '/';
      };
      modal.classList.remove('hidden');
      gsap.from(modal, { opacity: 0, y: -50, duration: 0.5 });
    } else {
      modalMessage.textContent = 'Erro na autenticação. Tente novamente.';
      modalAction.innerHTML = '<i class="fas fa-redo mr-1"></i> Tentar Novamente';
      modalAction.onclick = () => {
        window.location.href = `${API_BASE_URL}/api/auth/discord`;
      };
      modal.classList.remove('hidden');
      gsap.from(modal, { opacity: 0, y: -50, duration: 0.5 });
    }
  } catch (error) {
    modalMessage.textContent = 'Erro ao processar autenticação. Tente novamente.';
    modalAction.innerHTML = '<i class="fas fa-redo mr-1"></i> Tentar Novamente';
    modalAction.onclick = () => {
      window.location.href = `${API_BASE_URL}/api/auth/discord`;
    };
    modal.classList.remove('hidden');
    gsap.from(modal, { opacity: 0, y: -50, duration: 0.5 });
  }
}

function handleLogout() {
  localStorage.removeItem('access_token');
  document.getElementById('auth-modal').classList.add('hidden');
  window.location.reload();
}

function handleAddProduct(e) {
  e.preventDefault();
  const token = localStorage.getItem('access_token');
  if (!token) {
    window.location.href = `${API_BASE_URL}/api/auth/discord`;
  } else {
    alert('Funcionalidade de adicionar produto será implementada em breve!'); // Placeholder
  }
}

async function loadCategories() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/categories`);
    const categories = await response.json();
    const categoriesDropdown = document.getElementById('categories-dropdown');
    const mobileCategoriesMenu = document.getElementById('mobile-categories-menu');
    const categoryFilter = document.getElementById('category-filter');
    const categoriesGrid = document.getElementById('categories-grid');

    // Dropdown e Filtro
    categories.forEach(category => {
      // Dropdown desktop
      const link = document.createElement('a');
      link.href = `#category-${category.id}`;
      link.innerHTML = `<i class="fas fa-tag mr-1"></i> ${category.name}`;
      link.className = 'text-gray-600 hover:text-blue-600';
      categoriesDropdown.appendChild(link);

      // Menu mobile
      const mobileLink = document.createElement('a');
      mobileLink.href = `#category-${category.id}`;
      mobileLink.innerHTML = `<i class="fas fa-tag mr-1"></i> ${category.name}`;
      mobileLink.className = 'block text-gray-600 hover:text-blue-600';
      mobileCategoriesMenu.appendChild(mobileLink);

      // Filtro de categorias
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = category.name;
      categoryFilter.appendChild(option);
    });

    // Grid de categorias destacadas
    categories.slice(0, 4).forEach((category, index) => {
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

  try {
    const categoryId = document.getElementById('category-filter').value;
    const searchTerm = document.getElementById('search-bar').value || document.getElementById('mobile-search-bar').value;
    const sort = document.getElementById('sort-filter').value;
    let url = `${API_BASE_URL}/api/products?page=${currentPage}&limit=${productsPerPage}`;
    if (categoryId) url += `&category_id=${categoryId}`;
    if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
    if (sort) url += `&sort=${sort}`;

    const response = await fetch(url);
    const products = await response.json();
    const productsGrid = document.getElementById('products-grid');

    products.forEach((product, index) => {
      const productCard = document.createElement('div');
      productCard.className = 'bg-white rounded-lg shadow-md overflow-hidden transition-transform transform hover:scale-105';
      productCard.innerHTML = `
        <img src="${product.image_url || 'https://placehold.co/300x200'}" alt="${product.name}" class="w-full h-48 object-cover">
        <div class="p-4">
          <h3 class="text-lg font-semibold text-gray-900">${product.name}</h3>
          <p class="text-gray-600 mt-1">${product.description ? product.description.substring(0, 50) + '...' : ''}</p>
          <p class="text-blue-600 font-bold mt-2">R$ ${product.price.toFixed(2)}</p>
          <button class="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"><i class="fas fa-cart-plus mr-1"></i> Adicionar ao Carrinho</button>
        </div>
      `;
      productsGrid.appendChild(productCard);
      gsap.from(productCard, { opacity: 0, y: 50, duration: 0.8, delay: index * 0.1 });
    });

    if (products.length < productsPerPage) {
      document.getElementById('loading').classList.add('hidden');
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