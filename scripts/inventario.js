// scripts/inventario.js
import { InventoryService } from "./services/inventoryService.js";
import { Compra } from "./models/compra.js";
import { db } from "./firebase-init.js";

let editingItemId = null;

// Renderizar inventario
export async function renderInventory() {
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

  try {
    const inventory = await InventoryService.getPurchases();
    const filteredInventory = inventory.filter(
      (item) =>
        (!searchText ||
          item.nombreProducto.toLowerCase().includes(searchText)) &&
        (category === "Todas" || item.categoria === category)
    );

    tableBody.innerHTML = "";
    if (filteredInventory.length === 0) {
      tableBody.innerHTML =
        "<p>No se encontraron compras que coincidan con los filtros.</p>";
      return;
    }

    filteredInventory.forEach((item) => {
      const row = document.createElement("div");
      row.className = "table-row";
      row.innerHTML = `
        <span>${item.nombreProducto}</span>
        <span>${item.categoria}</span>
        <span>${item.cantidad.toFixed(2)}</span>
        <span>${item.unidad}</span>
        <span>${item.total.toFixed(2)}</span>
        <span>${new Date(item.fechaCompra).toLocaleDateString()}</span>
        <button class="bi bi-pencil small-btn" title="Editar dato de la compra" onclick="window.editPurchase('${
          item.id
        }')"></button>
        <button class="bi bi-x-lg btn-danger" title="Eliminar Compra" onclick="window.deletePurchase('${
          item.id
        }')"></button>
      `;
      tableBody.appendChild(row);
    });
  } catch (error) {
    tableBody.innerHTML = "";
    errorMessage.innerHTML =
      "Error al cargar el inventario. Verifica la conexión a Firebase.";
  }
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
export async function registerPurchase() {
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

  try {
    await InventoryService.registerPurchase(compra);
    alert("Compra registrada correctamente");
    startNewPurchase();
    await renderInventory();
  } catch (error) {
    errorMessage.innerHTML = "Error al registrar la compra.";
  }
}

// Eliminar una compra
export async function deletePurchase(id) {
  const errorMessage = document.getElementById("errorMessage");
  errorMessage.innerHTML = "";

  try {
    await InventoryService.deletePurchase(id);
    alert("Compra eliminada correctamente");
    await renderInventory();
  } catch (error) {
    errorMessage.innerHTML = "Error al eliminar la compra.";
  }
}

// Editar una compra
export async function editPurchase(id) {
  const errorMessage = document.getElementById("errorMessage");
  errorMessage.innerHTML = "";

  try {
    const item = await InventoryService.getPurchaseById(id);
    document.getElementById("nombreProducto").value = item.nombreProducto;
    document.getElementById("categoria").value = item.categoria;
    document.getElementById("cantidad").value = item.cantidad;
    document.getElementById("unidad").value = item.unidad;
    document.getElementById("total").value = item.total;
    document.getElementById("registerButton").style.display = "none";
    document.getElementById("saveButton").style.display = "block";
    editingItemId = id;
  } catch (error) {
    errorMessage.innerHTML = "Error al cargar la compra.";
  }
}

// Guardar los cambios de edición
export async function saveChanges() {
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

  try {
    await InventoryService.updatePurchase(editingItemId, updatedCompra);
    alert("Compra actualizada correctamente");
    startNewPurchase();
    await renderInventory();
  } catch (error) {
    errorMessage.innerHTML = "Error al guardar los cambios.";
  }
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

// Funciones para productos relacionados
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

// Exponer funciones al ámbito global
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
