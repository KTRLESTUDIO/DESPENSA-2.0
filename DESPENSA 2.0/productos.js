// Ajustamos IDs y variables para que coincidan con tu HTML
const airtableApiKey = 'patf1beON7sMHYpeM.e785f7a4e196f4491314bf064c61f5959922c9d30067a87a78ae27ac16ef8a38'; // Tu API Key de Airtable
const airtableBaseId = 'appjq5GDjkYpLqyXx';
const airtableTable = 'Productos';

let productos = [];
let carrito = [];

let listaProductos, inputBusqueda, modalEdit, modalTitle, inputNombre, inputCategoria, inputPrecio, inputStock, saveBtn;
let btnVistaLista, btnVistaCuadricula;

const imagenPorDefecto = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT-ytBNU72ZNhsQfEFpoW2iLtpl80L4ug8AJg&s';

window.addEventListener('DOMContentLoaded', async () => {
  listaProductos = document.getElementById('product-list');       // Cambiado de productos-container a product-list
  inputBusqueda = document.getElementById('search');               // Cambiado de busqueda a search
  modalEdit = document.getElementById('modal-add');
  modalTitle = modalEdit.querySelector('h3');                      // En tu modal el título está en h3, no en .modal-title
  inputNombre = modalEdit.querySelector('input[name="name"]');
  inputCategoria = modalEdit.querySelector('select[name="category"]'); // Nuevo: categoría
  inputPrecio = modalEdit.querySelector('input[name="price"]');
  inputStock = modalEdit.querySelector('input[name="stock"]');
  saveBtn = modalEdit.querySelector('button[type="submit"]');

  btnVistaLista = document.getElementById('vista-lista');
  btnVistaCuadricula = document.getElementById('vista-cuadricula');

  productos = await obtenerProductosAirtable();
  renderizarProductos();

  inputBusqueda?.focus();

  inputBusqueda?.addEventListener('input', e => {
    renderizarProductos(e.target.value);
  });

  btnVistaLista?.addEventListener('click', () => {
    document.body.classList.remove('grid-view');
    document.body.classList.add('list-view');
    renderizarProductos(inputBusqueda.value);
  });

  btnVistaCuadricula?.addEventListener('click', () => {
    document.body.classList.remove('list-view');
    document.body.classList.add('grid-view');
    renderizarProductos(inputBusqueda.value);
  });

  // Formulario agregar/editar
  document.getElementById('add-form').addEventListener('submit', async e => {
    e.preventDefault();
    await guardarProducto();
  });

  document.getElementById('close-modal').addEventListener('click', () => {
    modalEdit.classList.remove('show');
  });

  document.getElementById('cancel-add').addEventListener('click', () => {
    modalEdit.classList.remove('show');
  });
});

// Obtener productos desde Airtable
async function obtenerProductosAirtable() {
  const urlBase = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTable}`;
  let productos = [];
  let offset = null;

  try {
    do {
      const url = offset ? `${urlBase}?offset=${offset}` : urlBase;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${airtableApiKey}`
        }
      });
      if (!res.ok) throw new Error('Error al obtener productos de Airtable');
      const datos = await res.json();

      productos = productos.concat(datos.records.map(record => ({
        id: record.id,
        Nombre: record.fields.Nombre || '',
        Categoria: record.fields.Categoria || '',
        Cantidad: record.fields.Cantidad || record.fields.Stock || 0, // Aceptar ambos nombres
        Precio: record.fields.Precio || 0,
        Imagen: record.fields.Imagen ? record.fields.Imagen[0].url : null
      })));

      offset = datos.offset;
    } while (offset);

    guardarProductosEnLocalStorage(productos);
    return productos;
  } catch (error) {
    console.warn('Sin conexión, cargando desde localStorage');
    return cargarProductosDesdeLocalStorage();
  }
}

function guardarProductosEnLocalStorage(productos) {
  localStorage.setItem('productos', JSON.stringify(productos));
}

function cargarProductosDesdeLocalStorage() {
  const data = localStorage.getItem('productos');
  return data ? JSON.parse(data) : [];
}

// Renderizar productos según vista y filtro
function renderizarProductos(filtro = '') {
  listaProductos.innerHTML = '';

  const vista = document.body.classList.contains('grid-view') ? 'grid' : 'list';

  productos.forEach(producto => {
    const textoProducto = `${producto.Nombre} ${producto.Categoria} ${producto.Marca || ''} ${producto.Cantidad} ${producto.Precio}`;
    if (!textoProducto.toLowerCase().includes(filtro.toLowerCase())) return;

    const card = document.createElement('div');
    card.className = `producto-card ${vista}`;
    card.innerHTML = `
      <img src="${producto.Imagen || imagenPorDefecto}" alt="${producto.Nombre}" class="producto-imagen" />
      <div class="producto-info">
        <h4>${producto.Nombre || 'Sin nombre'}</h4>
        <p>Categoria: ${producto.Categoria || ''}</p>
        <p>Cant: ${producto.Cantidad || 0}</p>
        <p><strong>$${producto.Precio?.toFixed(2) || '0.00'}</strong></p>
      </div>
      <div class="producto-acciones">
        <button onclick="editarProducto('${producto.id}')">Editar</button>
        <button onclick="agregarAlCarrito('${producto.id}')">+</button>
      </div>
    `;
    listaProductos.appendChild(card);
  });
}

// Editar producto - cargar datos al modal
function editarProducto(id) {
  const prod = productos.find(p => p.id === id);
  if (!prod) return;

  modalTitle.textContent = 'Editar producto';
  inputNombre.value = prod.Nombre || '';
  inputCategoria.value = prod.Categoria || '';
  inputPrecio.value = prod.Precio || '';
  inputStock.value = prod.Cantidad || '';

  modalEdit.dataset.productId = id;
  modalEdit.classList.add('show');
  inputNombre.focus();
}

// Guardar producto (editar o nuevo)
async function guardarProducto() {
  const id = modalEdit.dataset.productId;

  if (id) {
    // Editar producto existente
    const index = productos.findIndex(p => p.id === id);
    if (index === -1) return;

    const actualizado = {
      ...productos[index],
      Nombre: inputNombre.value,
      Categoria: inputCategoria.value,
      Cantidad: parseInt(inputStock.value) || 0,
      Precio: parseFloat(inputPrecio.value) || 0,
    };

    productos[index] = actualizado;
    guardarProductosEnLocalStorage(productos);
    renderizarProductos(inputBusqueda.value);

    await actualizarProductoEnAirtable(id, {
      Nombre: actualizado.Nombre,
      Categoria: actualizado.Categoria,
      Cantidad: actualizado.Cantidad,
      Precio: actualizado.Precio,
    });

  } else {
    // Aquí puedes agregar lógica para crear nuevo producto si quieres
    alert('Función para agregar producto no implementada');
  }

  modalEdit.classList.remove('show');
}

// Actualizar en Airtable
async function actualizarProductoEnAirtable(id, campos) {
  const res = await fetch(`https://api.airtable.com/v0/${airtableBaseId}/${airtableTable}/${id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${airtableApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fields: campos })
  });

  if (!res.ok) {
    console.warn('Error al actualizar en Airtable');
  }
}

// Funciones ejemplo para carrito (debes completar según tu lógica)
function agregarAlCarrito(id) {
  // Aquí la lógica para agregar producto al carrito
  alert(`Agregar producto ${id} al carrito (función por implementar)`);
}