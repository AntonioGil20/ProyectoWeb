// scripts/bebidas.js
import { BebidaService } from "./services/bebidaService.js";
import { Bebida } from "./models/bebida.js";

console.log("Bebidas.js cargado"); // Depuración

// Variable para rastrear si estamos editando una bebida y su ID
let editingBebidaId = null;

// Renderizar lista de bebidas
async function renderBebidas(retryCount = 0) {
  console.log("Iniciando renderBebidas..."); // Depuración
  const bebidasList = document.getElementById("bebidas-list");
  if (!bebidasList) {
    console.error(
      "Elemento bebidas-list NO encontrado en el DOM. Verifica el HTML."
    );
    return;
  }

  bebidasList.innerHTML = "<p>Cargando bebidas...</p>";
  console.log("Mostrando 'Cargando bebidas...' en el DOM"); // Depuración

  try {
    const bebidas = await BebidaService.getBebidas();
    console.log("Datos de bebidas obtenidos de Firebase:", bebidas); // Depuración
    bebidasList.innerHTML = "";

    if (bebidas.length === 0) {
      console.log("No hay bebidas registradas en Firebase."); // Depuración
      bebidasList.innerHTML = "<p>No hay bebidas registradas.</p>";
      return;
    }

    bebidas.forEach((bebida) => {
      console.log("Renderizando bebida:", bebida); // Depuración
      const card = document.createElement("div");
      card.className = "bebida-item";
      card.innerHTML = `
                <div class="bebida-info">
                    <h3>${bebida.nombre}</h3>
                    <p>Tipo: ${bebida.tipoBebidas}</p>
                    <p>Precio MXN: $${bebida.precioMx.toFixed(2)}</p>
                    <p>Precio USD: $${bebida.precioUSD.toFixed(2)}</p>
                    <div class="acciones">
                        <button class="editar" onclick="editBebida('${
                          bebida.id
                        }')">Editar</button>
                        <button class="eliminar" onclick="deleteBebida('${
                          bebida.id
                        }')">Eliminar</button>
                    </div>
                </div>
            `;
      bebidasList.appendChild(card);
    });
  } catch (error) {
    console.error("Error en renderBebidas:", error);
    const statusLabel = document.getElementById("statusLabel");
    if (statusLabel) {
      statusLabel.textContent = `Error al cargar las bebidas: ${error.message}`;
      statusLabel.style.display = "block";
    }
    if (retryCount < 3) {
      console.warn("Reintentando conexión...", retryCount + 1);
      setTimeout(() => renderBebidas(retryCount + 1), 1000); // Reintenta después de 1 segundo
    } else {
      bebidasList.innerHTML =
        "<p>Error al cargar las bebidas. Verifica tu conexión o Firebase.</p>";
    }
  }
}

// Filtrar bebidas por tipo y nombre
function filterBebidas() {
  const filtroTipo = document.getElementById("filtroTipo").value.toLowerCase();
  const buscarBebida = document
    .getElementById("buscarBebida")
    .value.toLowerCase();
  const bebidasList = document.getElementById("bebidas-list");
  const cards = bebidasList.getElementsByClassName("bebida-item");

  Array.from(cards).forEach((card) => {
    const tipo = card
      .querySelector("p:nth-child(2)")
      .textContent.toLowerCase()
      .replace("tipo: ", "");
    const nombre = card.querySelector("h3").textContent.toLowerCase();
    const matchesTipo = filtroTipo === "" || tipo === filtroTipo;
    const matchesNombre = nombre.includes(buscarBebida);
    card.style.display = matchesTipo && matchesNombre ? "block" : "none";
  });
}

// Registrar o actualizar una bebida
async function registerBebida() {
  const nombre = document.getElementById("nombre")?.value;
  const tipoBebidas = document.getElementById("tipoBebidas")?.value;
  const precioMx =
    parseFloat(document.getElementById("precioMx")?.value) || 0.0;
  const precioUSD =
    parseFloat(document.getElementById("precioUSD")?.value) || 0.0;
  const statusLabel = document.getElementById("statusLabel");

  if (!nombre) {
    if (statusLabel) {
      statusLabel.textContent = "El nombre de la bebida es requerido.";
      statusLabel.style.display = "block";
    }
    return;
  }

  // Obtener todas las bebidas para verificar duplicados
  const bebidas = await BebidaService.getBebidas();

  // Si estamos editando, obtener el nombre original de la bebida
  let originalNombre = null;
  if (editingBebidaId) {
    const bebidaActual = bebidas.find(
      (bebida) => bebida.id === editingBebidaId
    );
    if (bebidaActual) {
      originalNombre = bebidaActual.nombre;
    }
  }

  // Verificar si la bebida ya está registrada (excepto si es el mismo nombre de la bebida que estamos editando)
  const isRegistered = bebidas.some(
    (bebida) =>
      bebida.nombre === nombre &&
      bebida.id !== editingBebidaId &&
      (!editingBebidaId || nombre !== originalNombre)
  );

  if (isRegistered) {
    if (statusLabel) {
      statusLabel.textContent = "La bebida ya está registrada.";
      statusLabel.style.display = "block";
    }
    return;
  }

  let success;
  if (editingBebidaId) {
    // Modo edición: actualizar bebida existente
    const bebida = new Bebida({
      id: editingBebidaId,
      nombre,
      nombreTicket: nombre, // Usamos el mismo nombre por ahora
      tipoBebidas,
      precioMx,
      precioUSD,
    });
    try {
      await BebidaService.updateBebida(editingBebidaId, bebida);
      success = true;
    } catch (error) {
      success = false;
    }

    if (success) {
      if (statusLabel) {
        statusLabel.textContent = "Bebida actualizada correctamente.";
        statusLabel.style.backgroundColor = "#28a745";
        statusLabel.style.display = "block";
      }
      editingBebidaId = null; // Limpiar modo edición
    } else {
      if (statusLabel) {
        statusLabel.textContent = "Error al actualizar la bebida.";
        statusLabel.style.display = "block";
      }
      return;
    }
  } else {
    // Modo registro: crear nueva bebida
    const bebida = new Bebida({
      nombre,
      nombreTicket: nombre, // Usamos el mismo nombre por ahora
      tipoBebidas,
      precioMx,
      precioUSD,
    });
    try {
      await BebidaService.registerBebida(bebida);
      success = true;
    } catch (error) {
      success = false;
    }

    if (success) {
      if (statusLabel) {
        statusLabel.textContent = "Bebida registrada correctamente.";
        statusLabel.style.backgroundColor = "#28a745";
        statusLabel.style.display = "block";
      }
    } else {
      if (statusLabel) {
        statusLabel.textContent = "Error al registrar la bebida.";
        statusLabel.style.display = "block";
      }
      return;
    }
  }

  // Limpiar el formulario y actualizar la lista
  document.getElementById("nombre").value = "";
  document.getElementById("tipoBebidas").value = "Sin alcohol";
  document.getElementById("precioMx").value = "";
  document.getElementById("precioUSD").value = "";
  await renderBebidas();
}

// Eliminar una bebida por nombre
async function deleteBebidaByName(name) {
  if (!name) {
    alert("Ingresa un nombre para eliminar.");
    return;
  }
  const bebidas = await BebidaService.getBebidas();
  const bebida = bebidas.find((b) => b.nombre === name);
  if (bebida) {
    const success = await BebidaService.deleteBebida(bebida.id);
    if (success) {
      await renderBebidas();
      document.getElementById("nombre").value = ""; // Limpiar el input
      const statusLabel = document.getElementById("statusLabel");
      if (statusLabel) {
        statusLabel.textContent = "Bebida eliminada correctamente.";
        statusLabel.style.backgroundColor = "#28a745";
        statusLabel.style.display = "block";
      }
      // Limpiar modo edición si la bebida eliminada era la que se estaba editando
      if (editingBebidaId === bebida.id) {
        editingBebidaId = null;
      }
    } else {
      const statusLabel = document.getElementById("statusLabel");
      if (statusLabel) {
        statusLabel.textContent = "Error al eliminar la bebida.";
        statusLabel.style.display = "block";
      }
    }
  } else {
    const statusLabel = document.getElementById("statusLabel");
    if (statusLabel) {
      statusLabel.textContent = "Bebida no encontrada.";
      statusLabel.style.display = "block";
    }
  }
}

// Editar una bebida
async function editBebida(id) {
  const bebida = await BebidaService.getBebidaById(id);
  if (bebida) {
    editingBebidaId = id; // Establecer el ID de la bebida que se está editando
    document.getElementById("nombre").value = bebida.nombre;
    document.getElementById("tipoBebidas").value = bebida.tipoBebidas;
    document.getElementById("precioMx").value = bebida.precioMx;
    document.getElementById("precioUSD").value = bebida.precioUSD;
    const statusLabel = document.getElementById("statusLabel");
    if (statusLabel) {
      statusLabel.textContent = `Editando bebida: ${bebida.nombre}. Usa Registrar para guardar cambios.`;
      statusLabel.style.display = "block";
    }
  }
}

// Eliminar una bebida (para las cards)
async function deleteBebida(id) {
  if (confirm("¿Estás seguro de eliminar esta bebida?")) {
    const success = await BebidaService.deleteBebida(id);
    if (success) {
      await renderBebidas();
      // Limpiar modo edición si la bebida eliminada era la que se estaba editando
      if (editingBebidaId === id) {
        editingBebidaId = null;
        document.getElementById("nombre").value = "";
        document.getElementById("tipoBebidas").value = "Sin alcohol";
        document.getElementById("precioMx").value = "";
        document.getElementById("precioUSD").value = "";
        const statusLabel = document.getElementById("statusLabel");
        if (statusLabel) {
          statusLabel.textContent = "Bebida eliminada.";
          statusLabel.style.backgroundColor = "#28a745";
          statusLabel.style.display = "block";
        }
      }
    } else {
      alert("Error al eliminar la bebida.");
    }
  }
}

// Volver atrás
function goBack() {
  editingBebidaId = null; // Limpiar modo edición al salir
  window.cargarVista("home");
}

// Exponer funciones al ámbito global para eventos onclick
window.registerBebida = registerBebida;
window.deleteBebidaByName = deleteBebidaByName;
window.editBebida = editBebida;
window.filterBebidas = filterBebidas;
window.deleteBebida = deleteBebida;
window.renderBebidas = renderBebidas;
