// Esperar al DOM cargado
window.addEventListener('DOMContentLoaded', () => {
  // Elementos de referencia
  const searchInput = document.getElementById('search');
  const menuToggle = document.getElementById('menu-toggle');
  const dropdownMenu = document.getElementById('dropdown-menu');
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  const productModal = document.getElementById('modal-add');
  const closeModalBtn = document.getElementById('close-modal');
  const viewToggle = document.getElementById('view-toggle');
  const productList = document.getElementById('product-list');

const openModalBtn = document.getElementById('floating-add-btn');


  // Foco inicial en búsqueda
  if (searchInput) searchInput.focus();

  // Alternar menú desplegable
  menuToggle?.addEventListener('click', () => {
    dropdownMenu?.classList.toggle('hidden');
  });

  // Activar/desactivar modo oscuro
  darkModeToggle?.addEventListener('change', () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('dark-mode', document.body.classList.contains('dark-mode'));
  });

  // Mantener modo oscuro si ya estaba activado
  if (localStorage.getItem('dark-mode') === 'true') {
    document.body.classList.add('dark-mode');
    if (darkModeToggle) darkModeToggle.checked = true;
  }

  // Mostrar modal
openModalBtn?.addEventListener('click', () => {
  productModal.classList.add('show');
  const nameInput = productModal.querySelector('input[name="name"]');
  nameInput?.focus();
});

// Ocultar modal
const closeModal = () => {
  productModal.classList.remove('show');
};

closeModalBtn?.addEventListener('click', closeModal);

// Cerrar con ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
  }
});


  // Alternar vista de productos (lista/cuadrícula)
  viewToggle?.addEventListener('click', () => {
    productList.classList.toggle('grid-view');
    localStorage.setItem('grid-view', productList.classList.contains('grid-view'));
  });

  // Aplicar vista previa si ya se había activado
  if (localStorage.getItem('grid-view') === 'true') {
    productList.classList.add('grid-view');
  }

  // Navegación con flechas (solo marcador visual, depende del uso futuro)
  document.addEventListener('keydown', (e) => {
    if (['ArrowDown', 'ArrowUp'].includes(e.key)) {
      const items = document.querySelectorAll('#product-list .product-item');
      const focused = document.activeElement;
      const index = [...items].indexOf(focused);
      if (index >= 0) {
        const nextIndex = e.key === 'ArrowDown' ? index + 1 : index - 1;
        if (items[nextIndex]) items[nextIndex].focus();
      } else if (items.length) {
        items[0].focus();
      }
    }
  });
});