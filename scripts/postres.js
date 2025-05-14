// scripts/postres.js
import { PostreService } from "./services/postreService.js";
import { Postre } from "./models/postre.js";

console.log("Postres.js cargado"); // Depuración

// Variable para rastrear si estamos editando un postre y su ID
let editingPostreId = null;

// Renderizar lista de postres
async function renderPostres(retryCount = 0) {
  console.log("Iniciando renderPostres..."); // Depuración
  const postresList = document.getElementById("postres-list");
  if (!postresList) {
    console.error(
      "Elemento postres-list NO encontrado en el DOM. Verifica el HTML."
    );
    return;
  }

  postresList.innerHTML = "<p>Cargando postres...</p>";
  console.log("Mostrando 'Cargando postres...' en el DOM"); // Depuración

  try {
    const postres = await PostreService.getPostres();
    console.log("Datos de postres obtenidos de Firebase:", postres); // Depuración
    postresList.innerHTML = "";

    if (postres.length === 0) {
      console.log("No hay postres registrados en Firebase."); // Depuración
      postresList.innerHTML = "<p>No hay postres registrados.</p>";
      return;
    }

    postres.forEach((postre) => {
      console.log("Renderizando postre:", postre); // Depuración
      const card = document.createElement("div");
      card.className = "postre-item";
      card.innerHTML = `
            <div class="postre-item">
                <div class="postre-header">
                    <h4>${postre.nombre}</h4>
                </div>
                <div class="postre-precios">
                    <div class="postre-precio">
                        <span>Precio MXN:</span>
                        <span>$${postre.precioMx.toFixed(2)}</span>
                    </div>
                    <div class="postre-precio">
                        <span>Precio USD:</span>
                        <span>$${postre.precioUSD.toFixed(2)}</span>
                    </div>
                </div>
                <span class="postre-stock">
                    <i class="fas fa-box-open"></i> ${postre.stock || 0} en stock
                </span>
                <div class="postre-acciones">
                    <button class="editar"><i class="fas fa-edit"></i> Editar</button>
                    <button class="eliminar"><i class="fas fa-trash-alt"></i> Eliminar</button>
                </div>
            </div>
        `;
      postresList.appendChild(card);
    });
  } catch (error) {
    console.error("Error en renderPostres:", error);
    const statusLabel = document.getElementById("statusLabel");
    if (statusLabel) {
      statusLabel.textContent = `Error al cargar los postres: ${error.message}`;
      statusLabel.style.display = "block";
    }
    if (retryCount < 3) {
      console.warn("Reintentando conexión...", retryCount + 1);
      setTimeout(() => renderPostres(retryCount + 1), 1000); // Reintenta después de 1 segundo
    } else {
      postresList.innerHTML =
        "<p>Error al cargar los postres. Verifica tu conexión o Firebase.</p>";
    }
  }
}

// Filtrar postres por nombre
function filterPostres() {
  const filtroNombre = document
    .getElementById("filtroNombre")
    .value.toLowerCase();
  const buscarPostre = document
    .getElementById("buscarPostre")
    .value.toLowerCase();
  const postresList = document.getElementById("postres-list");
  const cards = postresList.getElementsByClassName("postre-item");

  Array.from(cards).forEach((card) => {
    const nombre = card.querySelector("h3").textContent.toLowerCase();
    const matchesFiltro = filtroNombre === "" || nombre === filtroNombre;
    const matchesBusqueda = nombre.includes(buscarPostre);
    card.style.display = matchesFiltro && matchesBusqueda ? "block" : "none";
  });
}

// Registrar o actualizar un postre
async function registerPostre() {
  const nombre = document.getElementById("nombre")?.value;
  const precioMx =
    parseFloat(document.getElementById("precioMx")?.value) || 0.0;
  const precioUSD =
    parseFloat(document.getElementById("precioUSD")?.value) || 0.0;
  const stock = parseInt(document.getElementById("stock")?.value) || 0;
  const statusLabel = document.getElementById("statusLabel");

  if (!nombre) {
    if (statusLabel) {
      statusLabel.textContent = "El nombre del postre es requerido.";
      statusLabel.style.display = "block";
    }
    return;
  }

  // Obtener todos los postres para verificar duplicados
  const postres = await PostreService.getPostres();

  // Si estamos editando, obtener el nombre original del postre
  let originalNombre = null;
  if (editingPostreId) {
    const postreActual = postres.find(
      (postre) => postre.id === editingPostreId
    );
    if (postreActual) {
      originalNombre = postreActual.nombre;
    }
  }

  // Verificar si el postre ya está registrado (excepto si es el mismo nombre del postre que estamos editando)
  const isRegistered = postres.some(
    (postre) =>
      postre.nombre === nombre &&
      postre.id !== editingPostreId &&
      (!editingPostreId || nombre !== originalNombre)
  );

  if (isRegistered) {
    if (statusLabel) {
      statusLabel.textContent = "El postre ya está registrado.";
      statusLabel.style.display = "block";
    }
    return;
  }

  let success;
  if (editingPostreId) {
    // Modo edición: actualizar postre existente
    const postre = new Postre({
      id: editingPostreId,
      nombre,
      precioMx,
      precioUSD,
      stock,
    });
    try {
      await PostreService.updatePostre(editingPostreId, postre);
      success = true;
    } catch (error) {
      success = false;
    }

    if (success) {
      if (statusLabel) {
        statusLabel.textContent = "Postre actualizado correctamente.";
        statusLabel.style.backgroundColor = "#28a745";
        statusLabel.style.display = "block";
      }
      editingPostreId = null; // Limpiar modo edición
    } else {
      if (statusLabel) {
        statusLabel.textContent = "Error al actualizar el postre.";
        statusLabel.style.display = "block";
      }
      return;
    }
  } else {
    // Modo registro: crear nuevo postre
    const postre = new Postre({
      nombre,
      precioMx,
      precioUSD,
      stock,
    });
    try {
      await PostreService.registerPostre(postre);
      success = true;
    } catch (error) {
      success = false;
    }

    if (success) {
      if (statusLabel) {
        statusLabel.textContent = "Postre registrado correctamente.";
        statusLabel.style.backgroundColor = "#28a745";
        statusLabel.style.display = "block";
      }
    } else {
      if (statusLabel) {
        statusLabel.textContent = "Error al registrar el postre.";
        statusLabel.style.display = "block";
      }
      return;
    }
  }

  // Limpiar el formulario y actualizar la lista
  document.getElementById("nombre").value = "";
  document.getElementById("precioMx").value = "";
  document.getElementById("precioUSD").value = "";
  document.getElementById("stock").value = "";
  await renderPostres();
}

// Eliminar un postre por nombre
async function deletePostreByName(name) {
  if (!name) {
    alert("Ingresa un nombre para eliminar.");
    return;
  }
  const postres = await PostreService.getPostres();
  const postre = postres.find((p) => p.nombre === name);
  if (postre) {
    const success = await PostreService.deletePostre(postre.id);
    if (success) {
      await renderPostres();
      document.getElementById("nombre").value = ""; // Limpiar el input
      const statusLabel = document.getElementById("statusLabel");
      if (statusLabel) {
        statusLabel.textContent = "Postre eliminado correctamente.";
        statusLabel.style.backgroundColor = "#28a745";
        statusLabel.style.display = "block";
      }
      // Limpiar modo edición si el postre eliminado era el que se estaba editando
      if (editingPostreId === postre.id) {
        editingPostreId = null;
      }
    } else {
      const statusLabel = document.getElementById("statusLabel");
      if (statusLabel) {
        statusLabel.textContent = "Error al eliminar el postre.";
        statusLabel.style.display = "block";
      }
    }
  } else {
    const statusLabel = document.getElementById("statusLabel");
    if (statusLabel) {
      statusLabel.textContent = "Postre no encontrado.";
      statusLabel.style.display = "block";
    }
  }
}

// Editar un postre
async function editPostre(id) {
  const postre = await PostreService.getPostreById(id);
  if (postre) {
    editingPostreId = id; // Establecer el ID del postre que se está editando
    document.getElementById("nombre").value = postre.nombre;
    document.getElementById("precioMx").value = postre.precioMx;
    document.getElementById("precioUSD").value = postre.precioUSD;
    document.getElementById("stock").value = postre.stock;
    const statusLabel = document.getElementById("statusLabel");
    if (statusLabel) {
      statusLabel.textContent = `Editando postre: ${postre.nombre}. Usa Registrar para guardar cambios.`;
      statusLabel.style.display = "block";
    }
  }
}

// Eliminar un postre (para las cards)
async function deletePostre(id) {
  if (confirm("¿Estás seguro de eliminar este postre?")) {
    const success = await PostreService.deletePostre(id);
    if (success) {
      await renderPostres();
      // Limpiar modo edición si el postre eliminado era el que se estaba editando
      if (editingPostreId === id) {
        editingPostreId = null;
        document.getElementById("nombre").value = "";
        document.getElementById("precioMx").value = "";
        document.getElementById("precioUSD").value = "";
        document.getElementById("stock").value = "";
        const statusLabel = document.getElementById("statusLabel");
        if (statusLabel) {
          statusLabel.textContent = "Postre eliminado.";
          statusLabel.style.backgroundColor = "#28a745";
          statusLabel.style.display = "block";
        }
      }
    } else {
      alert("Error al eliminar el postre.");
    }
  }
}

// Volver atrás
function goBack() {
  editingPostreId = null; // Limpiar modo edición al salir
  window.cargarVista("home");
}

// Exponer funciones al ámbito global para eventos onclick
window.registerPostre = registerPostre;
window.deletePostreByName = deletePostreByName;
window.editPostre = editPostre;
window.filterPostres = filterPostres;
window.deletePostre = deletePostre;
window.renderPostres = renderPostres;
