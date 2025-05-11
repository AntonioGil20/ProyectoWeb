
document.addEventListener('DOMContentLoaded', function() {
  // Inicialización de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB_yszsrG6VgYg2Dt9tnSTXBjD0zNPixRE",
  authDomain: "tacosypapasdb.firebaseapp.com",
  databaseURL: "https://tacosypapasdb-default-rtdb.firebaseio.com",
  projectId: "tacosypapasdb",
  storageBucket: "tacosypapasdb.appspot.com",
  messagingSenderId: "977630886123",
  appId: "1:977630886123:web:40f8b2dbe551e6ff3266ae",
};
  
  // Inicializar Firebase
  firebase.initializeApp(firebaseConfig);
  const database = firebase.database();

  // Variables globales
  let mesaSeleccionada = null;
  let pedidos = [];
  const PARA_LLEVAR_ID = "pedido_para_llevar";
  // Variables globales adicionales
let productoSeleccionado = null;
let categoriaSeleccionada = null;

  
  // Elementos del DOM
  const mesasGrid = document.getElementById('mesas-grid');
  const pedidosContainer = document.getElementById('pedidos-container');
  const nombreMesaElement = document.getElementById('nombre-mesa');
  const totalMxnElement = document.getElementById('total-mxn');
  const totalUsdElement = document.getElementById('total-usd');
  const btnPagar = document.getElementById('btn-pagar');
  const btnAgregar = document.getElementById('btn-agregar');
  const btnTicket = document.getElementById('btn-ticket');
  const modalPedido = document.getElementById('modal-pedido');
  const modalBody = document.getElementById('modal-body');
  const modalClose = document.getElementById('modal-close');
  const spinner = document.getElementById('spinner');

  // Cargar mesas al iniciar
  cargarMesas();

  // Función para cargar las mesas desde Firebase
async function cargarMesas() {
  showSpinner();
  try {
    const snapshot = await database.ref('Mesas').once('value');
    const mesas = snapshot.val();
    
    mesasGrid.innerHTML = '';
    
    if (mesas) {
      // 1. Encontrar el máximo de filas y columnas
      const maxFilas = Math.max(...Object.values(mesas).map(m => m.Fila)) + 1;
      const maxColumnas = Math.max(...Object.values(mesas).map(m => m.Columna)) + 1;
      
      // 2. Configurar el grid CSS dinámicamente
      mesasGrid.style.gridTemplateColumns = `repeat(${maxColumnas}, 1fr)`;
      mesasGrid.style.gridTemplateRows = `repeat(${maxFilas}, auto)`;
      
      // 3. Crear un mapa para acceder rápido a las mesas por posición
      const mapaMesas = {};
      Object.values(mesas).forEach(mesa => {
        if (!mapaMesas[mesa.Fila]) mapaMesas[mesa.Fila] = {};
        mapaMesas[mesa.Fila][mesa.Columna] = mesa;
      });
      
      // 4. Renderizar en orden de fila/columna
      for (let fila = 0; fila < maxFilas; fila++) {
        for (let columna = 0; columna < maxColumnas; columna++) {
          const mesa = mapaMesas[fila]?.[columna];
          const mesaCard = document.createElement('div');
          
          if (mesa) {
            // Mesa existente
            mesaCard.className = `mesa-card ${getEstadoClass(mesa.Estado)}`;
            mesaCard.innerHTML = `
              <div class="mesa-icon"><i class="fas fa-utensils"></i></div>
              <div class="mesa-nombre">${mesa.NombreMesa}</div>
              <div class="mesa-estado">${mesa.Estado}</div>
            `;
            mesaCard.dataset.nombre = mesa.NombreMesa;
            mesaCard.addEventListener('click', () => seleccionarMesa(mesa));
          } else {
            // Celda vacía (sin mesa)
            mesaCard.className = 'mesa-card empty';
            mesaCard.innerHTML = '<div class="mesa-icon"><i class="fas fa-times"></i></div>';
            mesaCard.style.visibility = 'hidden'; // O usar opacity: 0.5 para celdas vacías visibles
          }
          
          // Posicionamiento absoluto en el grid
          mesaCard.style.gridRow = fila + 1;
          mesaCard.style.gridColumn = columna + 1;
          
          mesasGrid.appendChild(mesaCard);
        }
      }
            // Hacer las mesas arrastrables
      document.querySelectorAll('.mesa-card:not(.empty)').forEach(card => {
        card.setAttribute('draggable', 'true');
      });
      
      // Inicializar drag and drop
      setupDragAndDrop();
    }
  } catch (error) {
    console.error('Error al cargar mesas:', error);
    alert('Error al cargar las mesas');
  } finally {
    hideSpinner();
  }
}

function setupDragAndDrop() {
  const mesasGrid = document.getElementById('mesas-grid');
  let draggedItem = null;
  let originalPosition = null;

  // Evento cuando comienza el arrastre
  mesasGrid.addEventListener('dragstart', function(e) {
    if (e.target.classList.contains('mesa-card') && !e.target.classList.contains('empty')) {
      draggedItem = e.target;
      originalPosition = {
        gridRow: draggedItem.style.gridRow,
        gridColumn: draggedItem.style.gridColumn
      };
      
      e.target.classList.add('dragging');
      e.dataTransfer.setData('text/plain', e.target.dataset.nombre);
      e.dataTransfer.effectAllowed = 'move';
      
      // Para Firefox
      e.dataTransfer.setDragImage(e.target, 0, 0);
    }
  });

  // Evento durante el arrastre
  mesasGrid.addEventListener('drag', function(e) {
    // Puedes agregar lógica adicional durante el arrastre si es necesario
  });

  // Evento cuando se entra en una zona de soltar
  mesasGrid.addEventListener('dragenter', function(e) {
    if (e.target.classList.contains('mesa-card') || e.target.classList.contains('mesas-grid')) {
      e.preventDefault();
      if (e.target !== draggedItem) {
        e.target.classList.add('dropzone');
      }
    }
  });

  // Evento cuando se sale de una zona de soltar
  mesasGrid.addEventListener('dragleave', function(e) {
    if (e.target.classList.contains('mesa-card')) {
      e.target.classList.remove('dropzone');
    }
  });

  // Evento cuando se está sobre una zona de soltar
  mesasGrid.addEventListener('dragover', function(e) {
    if (e.target.classList.contains('mesa-card') || e.target.classList.contains('mesas-grid')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  });

  // Evento cuando se suelta el elemento
  mesasGrid.addEventListener('drop', async function(e) {
    e.preventDefault();
    if (!draggedItem) return;

    const targetMesa = e.target.closest('.mesa-card');
    if (!targetMesa || targetMesa === draggedItem) {
      resetDragState();
      return;
    }

    // Intercambiar posiciones
    const tempRow = targetMesa.style.gridRow;
    const tempCol = targetMesa.style.gridColumn;
    
    targetMesa.style.gridRow = originalPosition.gridRow;
    targetMesa.style.gridColumn = originalPosition.gridColumn;
    
    draggedItem.style.gridRow = tempRow;
    draggedItem.style.gridColumn = tempCol;

    // Actualizar posiciones en Firebase
    try {
      await updateMesaPositions(draggedItem, targetMesa);
    } catch (error) {
      console.error('Error al actualizar posiciones:', error);
      // Revertir cambios visuales si falla la actualización
      draggedItem.style.gridRow = originalPosition.gridRow;
      draggedItem.style.gridColumn = originalPosition.gridColumn;
      targetMesa.style.gridRow = tempRow;
      targetMesa.style.gridColumn = tempCol;
    }

    resetDragState();
  });

  // Evento cuando termina el arrastre (incluso si no se soltó en un lugar válido)
  mesasGrid.addEventListener('dragend', function() {
    resetDragState();
  });

  function resetDragState() {
    if (draggedItem) {
      draggedItem.classList.remove('dragging');
      draggedItem = null;
    }
    
    document.querySelectorAll('.mesa-card').forEach(card => {
      card.classList.remove('dropzone');
    });
  }

  async function updateMesaPositions(mesa1, mesa2) {
    showSpinner();
    try {
      // Obtener datos actuales de Firebase
      const snapshot = await database.ref('Mesas').once('value');
      const mesas = snapshot.val();
      
      // Encontrar las mesas en los datos
      const mesa1Data = Object.values(mesas).find(m => m.NombreMesa === mesa1.dataset.nombre);
      const mesa2Data = Object.values(mesas).find(m => m.NombreMesa === mesa2.dataset.nombre);
      
      if (!mesa1Data || !mesa2Data) {
        throw new Error('No se encontraron los datos de las mesas');
      }
      
      // Obtener las keys de Firebase
      const mesa1Key = Object.keys(mesas).find(key => mesas[key].NombreMesa === mesa1.dataset.nombre);
      const mesa2Key = Object.keys(mesas).find(key => mesas[key].NombreMesa === mesa2.dataset.nombre);
      
      // Intercambiar posiciones en Firebase
      const updates = {};
      updates[`Mesas/${mesa1Key}/Fila`] = parseInt(mesa2.style.gridRow) - 1;
      updates[`Mesas/${mesa1Key}/Columna`] = parseInt(mesa2.style.gridColumn) - 1;
      updates[`Mesas/${mesa2Key}/Fila`] = parseInt(mesa1.style.gridRow) - 1;
      updates[`Mesas/${mesa2Key}/Columna`] = parseInt(mesa1.style.gridColumn) - 1;
      
      await database.ref().update(updates);
    } finally {
      hideSpinner();
    }
  }
}

  // Función para obtener la clase CSS según el estado
  function getEstadoClass(estado) {
    switch(estado) {
      case 'Ocupada': return 'ocupada';
      case 'Fuera de servicio': return 'fuera-servicio';
      default: return '';
    }
  }

  // Función para seleccionar una mesa
async function seleccionarMesa(mesa) {
  // Caso especial para "Para llevar"
  if (mesa.ID === PARA_LLEVAR_ID || mesa.NombreMesa === "Para llevar") {
    mesa.Estado = "Ocupada"; // Forzar estado para permitir pedifdos
    mesa.EsParaLlevar = true; // Bandera para lógica posterior
  }
    showSpinner();
    mesaSeleccionada = mesa;
    nombreMesaElement.textContent = `Mesa: ${mesa.NombreMesa}`;
    
    // Resaltar mesa seleccionada
    document.querySelectorAll('.mesa-card').forEach(card => {
      card.classList.remove('selected');
      if (card.dataset.nombre === mesa.NombreMesa) {
        card.classList.add('selected');
      }
    });
    
    // Cargar pedidos de la mesa
    await cargarPedidos(mesa.NombreMesa);
    
    // Habilitar botones
    btnPagar.disabled = false;
    btnAgregar.disabled = false;
    btnTicket.disabled = false;
    
    hideSpinner();
  }

  // Función para cargar los pedidos de una mesa
  async function cargarPedidos(nombreMesa) {
    try {
      const snapshot = await database.ref('Cuenta')
        .orderByChild('Mesa')
        .equalTo(nombreMesa)
        .once('value');
      
      pedidos = [];
      const pedidosData = snapshot.val();
      
      pedidosContainer.innerHTML = '';
      
      if (pedidosData) {
        Object.entries(pedidosData).forEach(([id, pedido]) => {
          pedido.Id = id;
          pedidos.push(pedido);
          agregarPedidoALista(pedido);
        });
      } else {
        pedidosContainer.innerHTML = '<div class="empty-state">No hay pedidos para esta mesa</div>';
      }
      
      calcularTotales();
    } catch (error) {
      console.error('Error al cargar pedidos:', error);
      alert('Error al cargar los pedidos');
    }
  }

  // Función para agregar un pedido a la lista
  function agregarPedidoALista(pedido) {
    const pedidoItem = document.createElement('div');
    pedidoItem.className = 'pedido-item';
    pedidoItem.dataset.id = pedido.Id;
    pedidoItem.innerHTML = `
      <div class="pedido-info">
        <div class="pedido-cantidad">${pedido.Cantidad}</div>
        <div class="pedido-nombre">${pedido.Producto}</div>
      </div>
      <div class="pedido-precio">$${pedido.PrecioMx.toFixed(2)}</div>
      <button class="btn-eliminar" data-id="${pedido.Id}">
        <i class="fas fa-trash"></i>
      </button>
    `;
    pedidosContainer.appendChild(pedidoItem);
    
    // Agregar evento de eliminación
    pedidoItem.querySelector('.btn-eliminar').addEventListener('click', eliminarPedido);
  }

  async function eliminarPedido(event) {
    if (!event?.currentTarget) return;
    
    const idPedido = event.currentTarget.getAttribute('data-id');
    if (!idPedido) return;

    if (!confirm('¿Estás seguro de eliminar este pedido?')) return;

    showSpinner();
    try {
      await database.ref(`Cuenta/${idPedido}`).remove();
      actualizarUIpostEliminacion(idPedido);
    } catch (error) {
      console.error("Error real:", error);
      if (error.code !== 'PERMISSION_DENIED') {
        alert("Error de conexión. Los cambios se aplicarán cuando recuperes conexión");
      }
    } finally {
      hideSpinner();
    }
  }

  function actualizarUIpostEliminacion(idPedido) {
    pedidos = pedidos.filter(p => p.Id !== idPedido);
    
    const elementoPedido = document.querySelector(`.pedido-item[data-id="${idPedido}"]`);
    if (elementoPedido) {
      elementoPedido.remove();
    } else {
      renderizarListaPedidos(pedidos);
    }
    
    calcularTotales();
    
    if (pedidos.length === 0) {
      actualizarEstadoUIMesa(mesaSeleccionada.NombreMesa, 'Libre');
    }
  }

  function actualizarEstadoUIMesa(nombreMesa, nuevoEstado) {
    document.querySelectorAll('.mesa-card').forEach(card => {
      if (card.dataset.nombre === nombreMesa) {
        card.classList.remove('ocupada', 'fuera-servicio');
        
        if (nuevoEstado !== 'Libre') {
          card.classList.add(nuevoEstado.toLowerCase().replace(' ', '-'));
        }
        
        const estadoElement = card.querySelector('.mesa-estado');
        if (estadoElement) {
          estadoElement.textContent = nuevoEstado;
        }
      }
    });
    
    if (mesaSeleccionada?.NombreMesa === nombreMesa) {
      mesaSeleccionada.Estado = nuevoEstado;
    }
    
    if (nuevoEstado === 'Libre') {
      btnPagar.disabled = true;
      btnAgregar.disabled = true;
      btnTicket.disabled = true;
    }
    
    actualizarEstadoMesaFirebase(nombreMesa, nuevoEstado);
  }

  async function actualizarEstadoMesaFirebase(nombreMesa, estado) {
    try {
      const snapshot = await database.ref('Mesas')
        .orderByChild('NombreMesa')
        .equalTo(nombreMesa)
        .once('value');
        
      if (snapshot.exists()) {
        const mesaKey = Object.keys(snapshot.val())[0];
        await database.ref(`Mesas/${mesaKey}`).update({ Estado: estado });
      }
    } catch (error) {
      console.error("Error al actualizar estado en Firebase:", error);
    }
  }

  function renderizarListaPedidos(listaPedidos) {
    const contenedor = document.getElementById('pedidos-container');
    
    if (listaPedidos.length === 0) {
      contenedor.innerHTML = '<div class="empty-state">No hay pedidos para esta mesa</div>';
      return;
    }
    
    contenedor.innerHTML = '';
    
    listaPedidos.forEach(pedido => {
      const pedidoElement = document.createElement('div');
      pedidoElement.className = 'pedido-item';
      pedidoElement.dataset.id = pedido.Id;
      
      pedidoElement.innerHTML = `
        <div class="pedido-info">
          <div class="pedido-cantidad">${pedido.Cantidad}</div>
          <div class="pedido-nombre">${pedido.Producto}</div>
        </div>
        <div class="pedido-precio">$${pedido.PrecioMx?.toFixed(2) || '0.00'}</div>
        <button class="btn-eliminar" data-id="${pedido.Id}">
          <i class="fas fa-trash"></i>
        </button>
      `;
      
      pedidoElement.querySelector('.btn-eliminar').addEventListener('click', eliminarPedido);
      contenedor.appendChild(pedidoElement);
    });
  }

  // Función para calcular totales
  function calcularTotales() {
    const totalMxn = pedidos.reduce((sum, pedido) => sum + (pedido.PrecioMx * pedido.Cantidad), 0);
    const totalUsd = pedidos.reduce((sum, pedido) => sum + (pedido.PrecioUSD * pedido.Cantidad), 0);
    
    totalMxnElement.textContent = `$${totalMxn.toFixed(2)}`;
    totalUsdElement.textContent = `$${totalUsd.toFixed(2)}`;
  }

  async function actualizarEstadoMesa(nombreMesa, nuevoEstado) {
    try {
      const snapshot = await database.ref('Mesas')
        .orderByChild('NombreMesa')
        .equalTo(nombreMesa)
        .once('value');
      
      if (snapshot.exists()) {
        const mesaKey = Object.keys(snapshot.val())[0];
        await database.ref(`Mesas/${mesaKey}`).update({ 
          Estado: nuevoEstado 
        });
        
        if (mesaSeleccionada && mesaSeleccionada.NombreMesa === nombreMesa) {
          mesaSeleccionada.Estado = nuevoEstado;
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error en actualizarEstadoMesa:', error);
      throw error;
    }
  }

  // Función para pagar la cuenta
  async function pagarCuenta() {

  if (mesaSeleccionada?.EsParaLlevar) {
    if (confirm("¿Confirmar pedido para llevar?")) {
      showSpinner();
      try {
        // Elimina pedidos como en el pago normal
        const deletePromises = pedidos.map(pedido => 
          database.ref(`Cuenta/${pedido.Id}`).remove()
        );
        await Promise.all(deletePromises);
        
        // Restablece la UI
        pedidos = [];
        pedidosContainer.innerHTML = '<div class="empty-state">Pedido completado</div>';
        calcularTotales();
        alert('Pedido para llevar listo');
      } finally {
        hideSpinner();
      }
    }
    return;
  }

    if (!mesaSeleccionada || pedidos.length === 0) return;
    
    const confirmar = confirm(`¿Confirmar pago de la cuenta para ${mesaSeleccionada.NombreMesa}?`);
    
    if (confirmar) {
      showSpinner();
      try {
        const conTarjeta = confirm('¿El pago es con tarjeta?');
        
        const deletePromises = pedidos.map(pedido => 
          database.ref(`Cuenta/${pedido.Id}`).remove()
        );
        
        await Promise.all(deletePromises);
        await actualizarEstadoMesa(mesaSeleccionada.NombreMesa, 'Libre');
        
        pedidos = [];
        pedidosContainer.innerHTML = '<div class="empty-state">Cuenta pagada</div>';
        totalMxnElement.textContent = '$0.00';
        totalUsdElement.textContent = '$0.00';
        
        btnPagar.disabled = true;
        btnAgregar.disabled = true;
        btnTicket.disabled = true;
        
        await cargarMesas();
        alert('Ticket generado (simulado)');
      } catch (error) {
        console.error('Error al pagar cuenta:', error);
        alert('Error al procesar el pago');
      } finally {
        hideSpinner();
      }
    }
  }

// función mostrarModalAgregar
function mostrarModalAgregar() {
    modalBody.innerHTML = `
        <h3>Seleccione una categoría</h3>
        <div class="categorias-container">
            <button class="categoria-btn" data-categoria="Alimentos">Alimentos</button>
            <button class="categoria-btn" data-categoria="Bebidas">Bebidas</button>
            <button class="categoria-btn" data-categoria="Postres">Postres</button>
        </div>
    `;
    
    document.querySelectorAll('.categoria-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            categoriaSeleccionada = this.getAttribute('data-categoria');
            await mostrarProductos(categoriaSeleccionada);
        });
    });
    
    modalPedido.style.display = 'flex';
    document.getElementById('modal-pedido-footer').style.display = 'none';
}

// Función para mostrar productos de una categoría
async function mostrarProductos(categoria) {
    showSpinner();
    try {
        let productos = [];
        let titulo = '';
        
        // Obtener y normalizar datos según la categoría
        if (categoria === 'Alimentos') {
            const alimentos = await database.ref('Alimentos').once('value');
            productos = Object.entries(alimentos.val() || {}).map(([id, data]) => ({
                id,
                nombre: data.ingrediente || data.Ingrediente || "Sin nombre",
                categoria: data.tipoPlatillo || data.TipoPlatillo || "Sin categoría",
                precioMx: data.precioMx || data.PrecioMx || 0,
                precioUSD: data.precioUSD || data.PrecioUSD || 0
            }));
            titulo = 'Alimentos';
            
        } else if (categoria === 'Bebidas') {
            const bebidas = await database.ref('Bebidas').once('value');
            productos = Object.entries(bebidas.val() || {}).map(([id, data]) => ({
                id,
                nombre: data.nombre || data.Nombre || "Sin nombre",
                categoria: data.tipoBebidas || data.TipoBebidas || "Sin categoría",
                precioMx: data.precioMx || data.PrecioMx || 0,
                precioUSD: data.precioUSD || data.PrecioUSD || 0
            }));
            titulo = 'Bebidas';
            
        } else if (categoria === 'Postres') {
            const postres = await database.ref('Postres').once('value');
            productos = Object.entries(postres.val() || {}).map(([id, data]) => ({
                id,
                nombre: data.nombre || data.Nombre || "Sin nombre",
                categoria: "Postre", // Categoría fija para postres
                precioMx: data.precioMx || data.PrecioMx || 0,
                precioUSD: data.precioUSD || data.PrecioUSD || 0,
                stock: data.stock || data.Stock || 0
            }));
            titulo = 'Postres';
        }
        
        // Generar HTML para los productos
modalBody.innerHTML = `
    <h3>${titulo}</h3>
    <div class="productos-container">
        ${productos.map(prod => `
            <div class="producto-item" data-id="${prod.id}">
                <div class="producto-info">
                    ${prod.categoria ? `<p class="producto-categoria">${prod.categoria}</p>` : ''}
                    <h4>${prod.nombre}</h4>
                    <p class="producto-precio">$${prod.precioMx.toFixed(2)} MXN</p>
                    ${prod.stock !== undefined ? `<p class="producto-stock">Disponibles: ${prod.stock}</p>` : ''}
                </div>
                <button class="btn-seleccionar" data-id="${prod.id}">Seleccionar</button>
            </div>
        `).join('')}
    </div>
    <button class="btn-volver" id="btn-volver">Volver</button>
`;
        
        // Configurar eventos
        document.getElementById('btn-volver').addEventListener('click', mostrarModalAgregar);
        
        document.querySelectorAll('.btn-seleccionar').forEach(btn => {
            btn.addEventListener('click', function() {
                const productoId = this.getAttribute('data-id');
                seleccionarProducto(productoId, categoria);
            });
        });
        
        // Configurar secciones adicionales del modal
        document.getElementById('modal-pedido-footer').style.display = 'block';
        document.getElementById('ingredientes-container').style.display = 
            categoria === 'Alimentos' ? 'block' : 'none';
        
        if (categoria === 'Alimentos') {
            await cargarIngredientes();
        }
        
    } catch (error) {
        console.error('Error al cargar productos:', error);
        modalBody.innerHTML = `
            <p class="error-message">Error al cargar los productos. Intente nuevamente.</p>
            <button class="btn-reintentar" id="btn-reintentar">Reintentar</button>
        `;
        document.getElementById('btn-reintentar').addEventListener('click', () => mostrarProductos(categoria));
    } finally {
        hideSpinner();
    }
}


// Función para cargar ingredientes
async function cargarIngredientes() {
    try {
        const ingredientesSnapshot = await database.ref('Ingredientes').once('value');
        const ingredientes = Object.values(ingredientesSnapshot.val() || {});
        
        const container = document.getElementById('ingredientes-container');
        container.innerHTML = '<h4>Ingredientes adicionales:</h4>';
        
        ingredientes.forEach(ing => {
            const div = document.createElement('div');
            div.className = 'ingrediente-option';
            div.innerHTML = `
                <input type="checkbox" id="ing-${ing.id || ing.ID}" 
                       value="${ing.elemento || ing.Elemento}">
                <label for="ing-${ing.id || ing.ID}">${ing.elemento || ing.Elemento}</label>
            `;
            container.appendChild(div);
        });
    } catch (error) {
        console.error('Error al cargar ingredientes:', error);
    }
}

// Función para seleccionar un producto
function seleccionarProducto(productoId, categoria) {
    productoSeleccionado = { id: productoId, categoria };
    // Aquí podrías resaltar el producto seleccionado si lo deseas
}
// Modificar el evento del botón confirmar
document.getElementById('confirmar-pedido').addEventListener('click', async function() {
    if (!productoSeleccionado || !mesaSeleccionada) return;
    
    showSpinner();
    try {
        // Obtener detalles del producto
        const productoSnapshot = await database.ref(productoSeleccionado.categoria)
            .child(productoSeleccionado.id).once('value');
        const producto = productoSnapshot.val();
        
        // Obtener ingredientes seleccionados (solo para alimentos)
        let ingredientesSeleccionados = [];
        if (productoSeleccionado.categoria === 'Alimentos') {
            const checkboxes = document.querySelectorAll('#ingredientes-container input[type="checkbox"]:checked');
            ingredientesSeleccionados = Array.from(checkboxes).map(cb => cb.value);
        }
        
        // Obtener cantidad y comentario
        const cantidad = parseInt(document.getElementById('pedido-cantidad').value) || 1;
        const comentario = document.getElementById('pedido-comentario').value || '';
        
        // Crear objeto de pedido
        const nuevoPedido = {
            Producto: producto.nombre || producto.Nombre || producto.ingrediente || producto.Ingrediente,
            Cantidad: cantidad,
            PrecioMx: producto.precioMx || producto.PrecioMx || 0,
            PrecioUSD: producto.precioUSD || producto.PrecioUSD || 0,
            Mesa: mesaSeleccionada.NombreMesa,
            Comentario: comentario,
            Ingredientes: ingredientesSeleccionados.join(', '),
            Fecha: new Date().toISOString()
        };
        
        // Guardar en Firebase
        await database.ref('Cuenta').push(nuevoPedido);
        
        // Actualizar estado de la mesa si no está ocupada
        if (mesaSeleccionada.Estado !== 'Ocupada') {
            await actualizarEstadoMesa(mesaSeleccionada.NombreMesa, 'Ocupada');
            await cargarMesas();
        }
        
        // Recargar pedidos y cerrar modal
        await cargarPedidos(mesaSeleccionada.NombreMesa);
        modalPedido.style.display = 'none';
        
    } catch (error) {
        console.error('Error al agregar pedido:', error);
        alert('Error al agregar el pedido');
    } finally {
        hideSpinner();
    }
});

// Modificar la función agregarPedidoALista para mostrar los nuevos campos
function agregarPedidoALista(pedido) {
    const pedidoItem = document.createElement('div');
    pedidoItem.className = 'pedido-item';
    pedidoItem.dataset.id = pedido.Id;
    pedidoItem.innerHTML = `
        <div class="pedido-info">
            <div class="pedido-cantidad">${pedido.Cantidad}</div>
            <div class="pedido-nombre">
                ${pedido.Producto}
                ${pedido.Comentario ? `<div class="pedido-comentario">${pedido.Comentario}</div>` : ''}
                ${pedido.Ingredientes ? `<div class="pedido-ingredientes">Ingredientes: ${pedido.Ingredientes}</div>` : ''}
            </div>
        </div>
        <div class="pedido-precio">$${pedido.PrecioMx.toFixed(2)}</div>
        <button class="btn-eliminar" data-id="${pedido.Id}">
            <i class="fas fa-trash"></i>
        </button>
    `;
    pedidosContainer.appendChild(pedidoItem);
    
    // Agregar evento de eliminación
    pedidoItem.querySelector('.btn-eliminar').addEventListener('click', eliminarPedido);
}
 

  // Función para generar ticket
  async function generarTicket() {
    if (!mesaSeleccionada || pedidos.length === 0) return;
    
    showSpinner();
    try {
      alert(`Ticket generado para ${mesaSeleccionada.NombreMesa}\nTotal: ${totalMxnElement.textContent}`);
    } catch (error) {
      console.error('Error al generar ticket:', error);
      alert('Error al generar el ticket');
    } finally {
      hideSpinner();
    }
  }

  // Funciones para mostrar/ocultar spinner
  function showSpinner() {
    spinner.style.display = 'block';
  }

  function hideSpinner() {
    spinner.style.display = 'none';
  }

  // Event listeners
  btnPagar.addEventListener('click', pagarCuenta);
  btnAgregar.addEventListener('click', mostrarModalAgregar);
  btnTicket.addEventListener('click', generarTicket);
  modalClose.addEventListener('click', () => modalPedido.style.display = 'none');
  
  modalPedido.addEventListener('click', (e) => {
    if (e.target === modalPedido) {
      modalPedido.style.display = 'none';
    }
  });
document.getElementById('paraLlevarCard').addEventListener('click', () => {
  const mesaVirtual = {
    ID: PARA_LLEVAR_ID,
    NombreMesa: "Para llevar",
    Estado: "Ocupada",
    EsParaLlevar: true, // ¡Esta línea es crítica!
    Fila: -1,
    Columna: -1,
    Pedidos: []
  };
  
  console.log("Mesa virtual creada:", mesaVirtual); // Para debug
  seleccionarMesa(mesaVirtual);
});


});
