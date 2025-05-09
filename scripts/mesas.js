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
    }
  } catch (error) {
    console.error('Error al cargar mesas:', error);
    alert('Error al cargar las mesas');
  } finally {
    hideSpinner();
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

  // Función para mostrar modal de agregar pedido
  function mostrarModalAgregar() {
    modalBody.innerHTML = `
      <h3>Seleccione una categoría</h3>
      <div class="categorias-container">
        <button class="categoria-btn" data-categoria="Tacos">Tacos</button>
        <button class="categoria-btn" data-categoria="Quesadillas">Quesadillas</button>
        <button class="categoria-btn" data-categoria="Tostadas">Tostadas</button>
        <button class="categoria-btn" data-categoria="Bebidas con alcohol">Bebidas con alcohol</button>
        <button class="categoria-btn" data-categoria="Bebidas sin alcohol">Bebidas sin alcohol</button>
        <button class="categoria-btn" data-categoria="Postres">Postres</button>
      </div>
    `;
    
    document.querySelectorAll('.categoria-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const categoria = this.getAttribute('data-categoria');
        mostrarProductos(categoria);
      });
    });
    
    modalPedido.style.display = 'flex';
  }

  // Función para mostrar productos de una categoría
  function mostrarProductos(categoria) {
    const productos = {
      'Tacos': ['Al pastor', 'Suadero', 'Longaniza', 'Tripa'],
      'Quesadillas': ['Queso', 'Huitlacoche', 'Flor de calabaza'],
      'Tostadas': ['Pata', 'Cuerito', 'Oreja'],
      'Bebidas con alcohol': ['Margarita', 'Michelada', 'Cerveza'],
      'Bebidas sin alcohol': ['Refresco', 'Agua', 'Jugo'],
      'Postres': ['Flan', 'Pastel', 'Helado']
    };
    
    modalBody.innerHTML = `
      <h3>${categoria}</h3>
      <div class="productos-container">
        ${productos[categoria].map(prod => `
          <div class="producto-item">
            <span>${prod}</span>
            <button class="btn-agregar-producto" data-producto="${prod}">Agregar</button>
          </div>
        `).join('')}
      </div>
      <button class="btn-volver" id="btn-volver">Volver</button>
    `;
    
    document.getElementById('btn-volver').addEventListener('click', mostrarModalAgregar);
    
    document.querySelectorAll('.btn-agregar-producto').forEach(btn => {
      btn.addEventListener('click', function() {
        const producto = this.getAttribute('data-producto');
        agregarProducto(producto, categoria);
      });
    });
  }

  // Función para agregar un producto a la cuenta
  async function agregarProducto(nombreProducto, categoria) {
    showSpinner();
    try {
      const precios = {
        'Tacos': { mxn: 15, usd: 0.75 },
        'Quesadillas': { mxn: 25, usd: 1.25 },
        'Tostadas': { mxn: 20, usd: 1.00 },
        'Bebidas con alcohol': { mxn: 50, usd: 2.50 },
        'Bebidas sin alcohol': { mxn: 20, usd: 1.00 },
        'Postres': { mxn: 30, usd: 1.50 }
      };
      
      const precio = precios[categoria] || { mxn: 0, usd: 0 };
      
      const nuevoPedido = {
        Cantidad: 1,
        Producto: nombreProducto,
        PrecioMx: precio.mxn,
        PrecioUSD: precio.usd,
        Mesa: mesaSeleccionada.NombreMesa,
        Mesero: 'Administrador'
      };
      
      const newRef = database.ref('Cuenta').push();
      await newRef.set(nuevoPedido);
      
      if (mesaSeleccionada.Estado !== 'Ocupada') {
        await actualizarEstadoMesa(mesaSeleccionada.NombreMesa, 'Ocupada');
        await cargarMesas();
      }
      
      await cargarPedidos(mesaSeleccionada.NombreMesa);
      modalPedido.style.display = 'none';
    } catch (error) {
      console.error('Error al agregar producto:', error);
      alert('Error al agregar el producto');
    } finally {
      hideSpinner();
    }
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
