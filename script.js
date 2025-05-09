// script.js

// Función principal para cargar vistas
function cargarVista(vista) {
  const viewContainer = document.getElementById("view-container");
  const errorMessage = document.getElementById("errorMessage");

  if (!viewContainer) {
    console.error("Contenedor de vistas no encontrado.");
    return;
  }

  // Mapeo de vistas a rutas
  const rutas = {
    home: "views/home.html",
    menu: "views/menu.html",
    bebidas: "views/bebidas.html",
    postres: "views/postres.html",
    ingredientes: "views/ingredientes.html",
    mesas: "views/mesas.html",
    editarMesas: "views/editarMesas.html",
    inventario: "views/inventario.html",
    arqueos: "views/arqueos.html",
    usuarios: "views/usuarios.html",
    config: "views/config.html",
  };

  const ruta = rutas[vista] || rutas.home;

  // Limpiar mensajes previos y mostrar carga
  if (errorMessage) errorMessage.textContent = "";
  viewContainer.innerHTML = "<p>Cargando...</p>";

  fetch(ruta)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Error ${response.status} al cargar ${ruta}`);
      }
      return response.text();
    })
    .then((html) => {
      viewContainer.innerHTML = html;

      // Cargar scripts específicos para cada vista
      if (vista === "inventario") {
        import("./scripts/inventario.js")
          .then((module) => {
            console.log("Módulo de inventario cargado");
            if (module.renderInventory) module.renderInventory();
          })
          .catch((err) => {
            console.error("Error al cargar inventario.js:", err);
            if (errorMessage) {
              errorMessage.textContent =
                "Error al cargar funciones de inventario";
            }
          });
      } else if (vista === "usuarios") {
        import("./scripts/usuarios.js")
          .then((module) => {
            console.log("Módulo de usuarios cargado");
            if (window.renderMeseros) {
              window.renderMeseros();
            }
          })
          .catch((err) => {
            console.error("Error al cargar usuarios.js:", err);
            if (errorMessage) {
              errorMessage.textContent =
                "Error al cargar funciones de usuarios";
            }
          });
      } else if (vista === "editarMesas") {
        import("./scripts/editarMesas.js")
          .then((module) => {
            console.log("Módulo de mesas cargado");
            // Llamar a renderMesas directamente cada vez que se carga la vista
            if (window.renderMesas) {
              window.renderMesas();
            } else {
              console.error("renderMesas no está definido en el módulo.");
            }
          })
          .catch((err) => {
            console.error("Error al cargar editarMesas.js:", err);
            if (errorMessage) {
              errorMessage.textContent = "Error al cargar funciones de mesas";
            }
          });
      }
    })
    .catch((err) => {
      console.error("Error:", err);
      viewContainer.innerHTML =
        "<p>Error al cargar la vista. Intente nuevamente.</p>";
      if (errorMessage) {
        errorMessage.textContent = `Error: ${err.message}`;
      }
    });
}

// Función para cerrar sesión
function cerrarSesion() {
  localStorage.removeItem("isAuthenticated");
  window.location.href = "index.html";
}

// Actualizar fecha y hora
function actualizarFechaHora() {
  const ahora = new Date();
  const opcionesFecha = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  const fechaElement = document.getElementById("fecha");
  const horaElement = document.getElementById("hora");

  if (fechaElement) {
    fechaElement.textContent = ahora.toLocaleDateString("es-MX", opcionesFecha);
  }
  if (horaElement) {
    horaElement.textContent = ahora.toLocaleTimeString("es-MX");
  }
}

// Inicialización de la aplicación
window.addEventListener("DOMContentLoaded", () => {
  window.cargarVista = cargarVista;
  actualizarFechaHora();
  setInterval(actualizarFechaHora, 1000);
  cargarVista("home");
});
