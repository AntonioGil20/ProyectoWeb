import { db } from "./firebase-init.js";
import { Compra } from "./models/compra.js";
import {
  ref,
  set,
  get,
  child,
  update,
  remove,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";

let editingItemId = null; // Variable para almacenar el ID del item en edición

// Renderizar inventario
export function renderInventory() {
  const searchText =
    document.getElementById("searchText")?.value.toLowerCase() || "";
  const category = document.getElementById("categoryFilter")?.value || "Todas";
  const tableBody = document.getElementById("inventoryTable");
  const errorMessage = document.getElementById("errorMessage");
  if (!tableBody || !errorMessage) {
    console.error("Elementos de la interfaz no encontrados.");
    return;
  }

  tableBody.innerHTML = "<p>Cargando inventario...</p>";
  errorMessage.innerHTML = "";

  // Recuperamos el inventario de Firebase desde "Compras"
  get(child(ref(db), "Compras"))
    .then((snapshot) => {
      tableBody.innerHTML = ""; // Limpiar completamente el contenido
      if (snapshot.exists()) {
        const purchases = snapshot.val(); // Obtener el objeto completo de "Compras"
        const inventory = Object.entries(purchases).map(([id, data]) => {
          // Normalizar claves a minúsculas para consistencia
          return {
            id,
            nombreProducto:
              data.nombreProducto || data.NombreProducto || "Sin nombre",
            categoria: data.categoria || data.Categoria || "Sin categoría",
            cantidad:
              typeof data.cantidad === "number"
                ? data.cantidad
                : typeof data.Cantidad === "number"
                ? data.Cantidad
                : 0,
            unidad: data.unidad || data.Unidad || "Sin unidad",
            total:
              typeof data.total === "number"
                ? data.total
                : typeof data.Total === "number"
                ? data.Total
                : 0,
            fechaCompra: data.fechaCompra || data.FechaCompra || "Sin fecha",
          };
        });
        console.log("Datos normalizados:", inventory); // Depuración de datos normalizados
        const filteredInventory = inventory.filter(
          (item) =>
            (!searchText ||
              item.nombreProducto.toLowerCase().includes(searchText)) &&
            (category === "Todas" || item.categoria === category)
        );
        console.log("Datos filtrados:", filteredInventory); // Depuración adicional

        if (filteredInventory.length === 0) {
          tableBody.innerHTML =
            "<p>No se encontraron compras que coincidan con los filtros.</p>";
          return;
        }

        console.log("Iniciando renderizado de ítems...");
        filteredInventory.forEach((item, index) => {
          console.log(`Renderizando ítem ${index}:`, item); // Depuración por ítem
          try {
            const row = document.createElement("div");
            row.className = "table-row";
            // Depurar el HTML generado antes de asignarlo
            const rowHtml = `
              <span>${item.nombreProducto}</span>
              <span>${item.categoria}</span>
              <span>${item.cantidad.toFixed(2)}</span>
              <span>${item.unidad}</span>
              <span>${item.total.toFixed(2)}</span>
              <span>${
                item.fechaCompra instanceof Date
                  ? item.fechaCompra.toLocaleDateString()
                  : new Date(item.fechaCompra).toLocaleDateString()
              }</span>
              <button class="bi bi-pencil small-btn" title="Editar dato de la compra" onclick="window.editPurchase('${
                item.id
              }')"></button>
              <button class="bi bi-x-lg btn-danger" title="Eliminar Compra" onclick="window.deletePurchase('${
                item.id
              }')"></button>
            `;
            console.log(`HTML generado para ítem ${index}:`, rowHtml); // Depurar HTML
            row.innerHTML = rowHtml;
            tableBody.appendChild(row);
            console.log(`Ítem ${index} añadido al DOM`);
          } catch (error) {
            console.error(`Error al renderizar ítem ${index}:`, error);
          }
        });
        console.log(
          "Renderizado completo. Filas en la tabla:",
          tableBody.children.length
        );
        console.log("Contenido del DOM:", tableBody.innerHTML); // Depurar el HTML final
      } else {
        tableBody.innerHTML =
          "<p>No hay compras registradas en la base de datos.</p>";
      }
    })
    .catch((err) => {
      console.error("Error al cargar el inventario:", err);
      tableBody.innerHTML = "";
      errorMessage.innerHTML =
        "Error al cargar el inventario. Verifica la conexión a Firebase.";
    });
}

// Iniciar una nueva compra
export function startNewPurchase() {
  document.getElementById("nombreProducto").value = "";
  document.getElementById("categoria").value = "Carnes";
  document.getElementById("cantidad").value = "";
  document.getElementById("unidad").value = "Kg";
  document.getElementById("total").value = "";
  document.getElementById("relatedProduct").value = "";
  document.getElementById("relatedProductsList").innerHTML = "";
  document.getElementById("registerButton").style.display = "block";
  document.getElementById("saveButton").style.display = "none";
  editingItemId = null;
}

// Registrar una nueva compra
export function registerPurchase() {
  const errorMessage = document.getElementById("errorMessage");
  errorMessage.innerHTML = "";

  const compra = new Compra({
    nombreProducto: document.getElementById("nombreProducto").value,
    categoria: document.getElementById("categoria").value,
    cantidad: parseFloat(document.getElementById("cantidad").value) || 0,
    unidad: document.getElementById("unidad").value,
    total: parseFloat(document.getElementById("total").value) || 0,
  });

  if (!compra.nombreProducto || compra.cantidad <= 0 || compra.total <= 0) {
    errorMessage.innerHTML = "Por favor, completa todos los campos requeridos.";
    return;
  }

  // Guardar en Firebase bajo "Compras"
  set(ref(db, "Compras/" + compra.id), {
    id: compra.id,
    nombreProducto: compra.nombreProducto,
    categoria: compra.categoria,
    cantidad: compra.cantidad,
    unidad: compra.unidad,
    total: compra.total,
    fechaCompra: compra.fechaCompra.toISOString(),
  })
    .then(() => {
      alert("Compra registrada correctamente");
      startNewPurchase();
      renderInventory();
    })
    .catch((error) => {
      console.error("Error al registrar la compra: ", error);
      errorMessage.innerHTML = "Error al registrar la compra.";
    });
}

// Eliminar una compra
export function deletePurchase(id) {
  const errorMessage = document.getElementById("errorMessage");
  errorMessage.innerHTML = "";

  console.log("Eliminando compra con ID:", id); // Depuración
  remove(ref(db, "Compras/" + id))
    .then(() => {
      alert("Compra eliminada correctamente");
      renderInventory();
    })
    .catch((error) => {
      console.error("Error al eliminar la compra: ", error);
      errorMessage.innerHTML = "Error al eliminar la compra.";
    });
}

// Editar una compra
export function editPurchase(id) {
  const errorMessage = document.getElementById("errorMessage");
  errorMessage.innerHTML = "";

  console.log("Editando compra con ID:", id); // Depuración
  const compraRef = ref(db, "Compras/" + id);
  get(compraRef)
    .then((snapshot) => {
      console.log("Datos recuperados de Firebase:", snapshot.val()); // Depuración
      if (snapshot.exists()) {
        const item = snapshot.val();
        // Normalizar claves como en renderInventory
        const normalizedItem = {
          nombreProducto: item.nombreProducto || item.NombreProducto || "",
          categoria: item.categoria || item.Categoria || "Carnes",
          cantidad:
            item.cantidad !== undefined
              ? item.cantidad
              : item.Cantidad !== undefined
              ? item.Cantidad
              : "",
          unidad: item.unidad || item.Unidad || "Kg",
          total:
            item.total !== undefined
              ? item.total
              : item.Total !== undefined
              ? item.Total
              : "",
        };
        console.log("Datos normalizados para formulario:", normalizedItem); // Depuración
        // Verificar y asignar valores al formulario
        const nombreProductoField = document.getElementById("nombreProducto");
        const categoriaField = document.getElementById("categoria");
        const cantidadField = document.getElementById("cantidad");
        const unidadField = document.getElementById("unidad");
        const totalField = document.getElementById("total");
        if (
          nombreProductoField &&
          categoriaField &&
          cantidadField &&
          unidadField &&
          totalField
        ) {
          nombreProductoField.value = normalizedItem.nombreProducto;
          categoriaField.value = normalizedItem.categoria;
          cantidadField.value = normalizedItem.cantidad;
          unidadField.value = normalizedItem.unidad;
          totalField.value = normalizedItem.total;
          document.getElementById("registerButton").style.display = "none";
          document.getElementById("saveButton").style.display = "block";
          editingItemId = id;
          console.log("Formulario actualizado con:", normalizedItem);
        } else {
          console.error("Uno o más campos del formulario no encontrados:", {
            nombreProductoField,
            categoriaField,
            cantidadField,
            unidadField,
            totalField,
          });
          errorMessage.innerHTML =
            "Error al cargar el formulario. Verifica los campos.";
        }
      } else {
        errorMessage.innerHTML = "Compra no encontrada.";
      }
    })
    .catch((error) => {
      console.error("Error al cargar la compra: ", error);
      errorMessage.innerHTML = "Error al cargar la compra.";
    });
}

// Guardar los cambios de edición
export function saveChanges() {
  const errorMessage = document.getElementById("errorMessage");
  errorMessage.innerHTML = "";

  if (!editingItemId) {
    errorMessage.innerHTML =
      "No se ha seleccionado ninguna compra para editar.";
    return;
  }

  const updatedCompra = new Compra({
    id: editingItemId,
    nombreProducto: document.getElementById("nombreProducto").value,
    categoria: document.getElementById("categoria").value,
    cantidad: parseFloat(document.getElementById("cantidad").value) || 0,
    unidad: document.getElementById("unidad").value,
    total: parseFloat(document.getElementById("total").value) || 0,
    fechaCompra: new Date(),
  });

  if (
    !updatedCompra.nombreProducto ||
    updatedCompra.cantidad <= 0 ||
    updatedCompra.total <= 0
  ) {
    errorMessage.innerHTML = "Por favor, completa todos los campos requeridos.";
    return;
  }

  // Actualizar en Firebase bajo "Compras"
  update(ref(db, "Compras/" + editingItemId), {
    nombreProducto: updatedCompra.nombreProducto,
    categoria: updatedCompra.categoria,
    cantidad: updatedCompra.cantidad,
    unidad: updatedCompra.unidad,
    total: updatedCompra.total,
    fechaCompra: updatedCompra.fechaCompra.toISOString(),
  })
    .then(() => {
      alert("Compra actualizada correctamente");
      startNewPurchase();
      renderInventory();
    })
    .catch((error) => {
      console.error("Error al guardar los cambios: ", error);
      errorMessage.innerHTML = "Error al guardar los cambios.";
    });
}

// Filtrar inventario
export function filterInventory() {
  renderInventory();
}

// Cambiar categoría
export function filterCategoryChanged() {
  renderInventory();
}

// Refrescar inventario
export function refreshInventory() {
  renderInventory();
}

// Funciones para productos relacionados (opcional, no usado en el modelo Compra)
export function addRelatedProduct() {
  const relatedProductsList = document.getElementById("relatedProductsList");
  const newField = document.createElement("div");
  newField.className = "dynamic-field";
  newField.innerHTML = `
    <input type="text" class="form-control" placeholder="Producto relacionado">
  `;
  relatedProductsList.appendChild(newField);
  document.getElementById("removeRelated").style.display = "block";
}

export function removeLastRelatedProduct() {
  const relatedProductsList = document.getElementById("relatedProductsList");
  if (relatedProductsList.lastChild) {
    relatedProductsList.removeChild(relatedProductsList.lastChild);
  }
  if (!relatedProductsList.hasChildNodes()) {
    document.getElementById("removeRelated").style.display = "none";
  }
}

// Exponer funciones al ámbito global para eventos onclick
window.refreshInventory = refreshInventory;
window.startNewPurchase = startNewPurchase;
window.registerPurchase = registerPurchase;
window.deletePurchase = deletePurchase;
window.editPurchase = editPurchase;
window.saveChanges = saveChanges;
window.filterInventory = filterInventory;
window.filterCategoryChanged = filterCategoryChanged;
window.addRelatedProduct = addRelatedProduct;
window.removeLastRelatedProduct = removeLastRelatedProduct;

// Inicializar la vista al cargar la página
window.addEventListener("DOMContentLoaded", () => {
  renderInventory();
});
