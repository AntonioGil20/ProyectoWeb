// script.js - Versión optimizada

// Configuración centralizada
const APP_CONFIG = {
  views: {
    home: { path: "views/home.html", script: null },
    menu: { path: "views/menu.html", script: "alimentos.js" },
    alimentos: { path: "views/menu.html", script: "alimentos.js" },
    bebidas: { path: "views/bebidas.html", script: "bebidas.js" },
    postres: { path: "views/postres.html", script: "postres.js" },
    ingredientes: { path: "views/ingredientes.html", script: "ingredientes.js" },
    mesas: { path: "views/mesas.html", script: "mesas.js", requiresFirebase: true },
    editarMesas: { path: "views/editarMesas.html", script: "editarMesas.js" },
    inventario: { path: "views/inventario.html", script: "inventario.js" },
    arqueos: { path: "views/arqueos.html", script: "arqueos.js" },
    usuarios: { path: "views/usuarios.html", script: "usuarios.js" },
    config: { path: "views/config.html", script: null },
    arqueosStats: { path: "views/arqueosStats.html", script: null }
  },
  defaultView: "home"
};

// Función principal optimizada
async function cargarVista(vista) {
  const viewContainer = document.getElementById("view-container");
  const errorMessage = document.getElementById("error-message");
  
  try {
    // Validaciones iniciales
    if (!viewContainer) throw new Error("Contenedor de vistas no encontrado");
    
    const viewConfig = APP_CONFIG.views[vista] || APP_CONFIG.views[APP_CONFIG.defaultView];
    
    // Mostrar estado de carga
    viewContainer.innerHTML = "<div class='loading-spinner'></div>";
    if (errorMessage) errorMessage.textContent = "";
    
    // Cargar el HTML de la vista
    const response = await fetch(viewConfig.path);
    if (!response.ok) throw new Error(`Error ${response.status} al cargar ${viewConfig.path}`);
    
    viewContainer.innerHTML = await response.text();
    
    // Cargar scripts dinámicos si es necesario
    if (viewConfig.script) {
      await loadViewScript(viewConfig.script, viewConfig.requiresFirebase);
    }
    
    // Actualizar estado de navegación
    updateActiveNavItem(vista);
    
  } catch (error) {
    console.error("Error al cargar vista:", error);
    handleViewError(viewContainer, errorMessage, error);
  }
}

// Función para cargar scripts dinámicos
async function loadViewScript(scriptName, requiresFirebase = false) {
  try {
    if (requiresFirebase) {
      await verifyFirebaseReady();
    }
    
    const module = await import(`./scripts/${scriptName}`);
    console.log(`Módulo ${scriptName} cargado correctamente`);
    
    // Ejecutar función de renderizado si existe
    const renderFunctionName = `render${scriptName.replace('.js', '').replace(/^\w/, c => c.toUpperCase())}`;
    if (module[renderFunctionName]) {
      module[renderFunctionName]();
    } else if (window[renderFunctionName]) {
      window[renderFunctionName]();
    }
  } catch (error) {
    console.error(`Error al cargar ${scriptName}:`, error);
    throw error;
  }
}

// Verificar estado de Firebase
function verifyFirebaseReady() {
  return new Promise((resolve) => {
    const check = () => {
      if (window.firebase && firebase.apps.length > 0) {
        resolve();
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  });
}

// Manejo de errores centralizado
function handleViewError(container, errorElement, error) {
  const errorHTML = `
    <div class="error-view">
      <i class="fas fa-exclamation-triangle"></i>
      <h3>Error al cargar la vista</h3>
      <p>${error.message}</p>
      <button onclick="cargarVista('home')">Volver al inicio</button>
    </div>
  `;
  
  if (container) container.innerHTML = errorHTML;
  if (errorElement) errorElement.textContent = error.message;
}

// Actualizar navegación activa
function updateActiveNavItem(currentView) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.view === currentView) {
      item.classList.add('active');
    }
  });
}

// Función para cerrar sesión (mejorada)
async function cerrarSesion() {
  try {
    // Cerrar sesión en Firebase si está activo
    if (window.firebase) {
      await firebase.auth().signOut();
    }
    
    // Limpiar almacenamiento local
    localStorage.removeItem("isAuthenticated");
    sessionStorage.clear();
    
    // Redirigir
    window.location.href = "index.html";
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
    window.location.href = "index.html";
  }
}

// Actualizar fecha y hora (optimizada)
function actualizarFechaHora() {
  const formatOptions = {
    fecha: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
    hora: { hour: '2-digit', minute: '2-digit', second: '2-digit' }
  };
  
  const ahora = new Date();
  document.querySelectorAll('[data-time="fecha"]').forEach(el => {
    el.textContent = ahora.toLocaleDateString('es-MX', formatOptions.fecha);
  });
  
  document.querySelectorAll('[data-time="hora"]').forEach(el => {
    el.textContent = ahora.toLocaleTimeString('es-MX', formatOptions.hora);
  });
}

// Inicialización de la aplicación
window.addEventListener("DOMContentLoaded", () => {
  // Exponer funciones globales
  window.cargarVista = cargarVista;
  window.cerrarSesion = cerrarSesion;
  
  // Configurar actualización de hora
  actualizarFechaHora();
  setInterval(actualizarFechaHora, 1000);
  
  // Cargar vista inicial
  cargarVista("home");
});
