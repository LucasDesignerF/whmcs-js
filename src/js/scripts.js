const API_BASE_URL = 'https://whmcs-js.ofc-rede.workers.dev';
let currentPage = 1;
const productsPerPage = 8;

document.addEventListener('DOMContentLoaded', () => {
  // Inicializar autenticação
  checkAuthStatus();
  
  // Carregar categorias e produtos
  loadCategories();
  loadProducts();

  // Menu mobile
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  mobileMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
  });

  // Carregar mais produtos
  document.getElementById('load-more').addEventListener('click', () => {
    currentPage++;
    loadProducts();
  });
});

async function checkAuthStatus() {
  const token = localStorage.getItem('access_token');
  const authLink = document.getElementById('auth-link');
  const mobileAuthLink = document.getElementById('mobile-auth-link');

  if (token) {
    authLink.textContent = 'Logout';
    mobileAuthLink.textContent = 'Logout';
    authLink.addEventListener('click', handleLogout);
    mobileAuthLink.addEventListener('click', handleLogout);
  } else {
    authLink.href = `${API_BASE_URL}/api/auth/discord`;
    mobileAuthLink.href = `${API_BASE_URL}/api/auth/discord`;
  }

  // Verificar callback do Discord
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  if (code && window.location.pathname.includes('/api/auth/discord/callback')) {
    handleDiscordCallback(code);
  }
}

async function handleDiscordCallback(code) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/discord/callback?code=${code}`, {
      method: 'GET',
    });
    const data = await response.json();
    if (data.token) {
      localStorage.setItem('access_token', data.token);
      window.location.href = '/'; // Redirecionar para a página inicial
    } else {
      console.error('Erro na autenticação:', data.error);
    }
  } catch (error) {
    console.error('Erro ao processar callback:', error);
  }
}

function handleLogout() {
  localStorage.removeItem('access_token');
  window.location.reload();
}

async function loadCategories() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/categories`);
    const categories = await response.json();
    const categoriesMenu = document.getElementById('categories-menu');
    const mobileCategoriesMenu = document.getElementById('mobile-categories-menu');
    
    categories.forEach(category => {
      const link = document.createElement('a');
      link.href = `#category-${category.id}`;
      link.textContent = category.name;
      link.className = 'text-gray-600 hover:text-indigo-600';
      categoriesMenu.appendChild(link);

      const mobileLink = document.createElement('a');
      mobileLink.href = `#category-${category.id}`;
      mobileLink.textContent = category.name;
      mobileLink.className = 'block text-gray-600 hover:text-indigo-600';
      mobileCategoriesMenu.appendChild(mobileLink);
    });
  } catch (error) {
    console.error('Erro ao carregar categorias:', error);
  }
}

async function loadProducts() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products?page=${currentPage}&limit=${productsPerPage}`);
    const products = await response.json();
    const productsGrid = document.getElementById('products-grid');

    products.forEach(product => {
      const productCard = document.createElement('div');
      productCard.className = 'bg-white rounded-lg shadow-md overflow-hidden transition-transform transform hover:scale-105';
      productCard.innerHTML = `
        <img src="${product.image_url || 'https://via.placeholder.com/300'}" alt="${product.name}" class="w-full h-48 object-cover">
        <div class="p-4">
          <h3 class="text-lg font-semibold">${product.name}</h3>
          <p class="text-gray-600 mt-1">${product.description ? product.description.substring(0, 50) + '...' : ''}</p>
          <p class="text-indigo-600 font-bold mt-2">R$ ${product.price.toFixed(2)}</p>
          <button class="mt-4 w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition">Adicionar ao Carrinho</button>
        </div>
      `;
      productsGrid.appendChild(productCard);
    });

    // Esconder botão "Carregar Mais" se não houver mais produtos
    if (products.length < productsPerPage) {
      document.getElementById('load-more').classList.add('hidden');
    }
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
  }
}