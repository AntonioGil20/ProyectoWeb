let inventory = [
  {
    id: 1,
    producto: "Tomate",
    categoria: "Verduras",
    cantidad: 10,
    unidad: "Kg",
    total: 150.0,
    ultimaCompra: "2025-04-18",
  },
  {
    id: 2,
    producto: "Carne Asada",
    categoria: "Carnes",
    cantidad: 5,
    unidad: "Kg",
    total: 750.0,
    ultimaCompra: "2025-04-17",
  },
];

let newPurchase = {
  producto: "",
  categoria: "",
  cantidad: 0,
  unidad: "",
  total: 0,
  ultimaCompra: "",
};
let isEditing = false;
let editingItem = null;
let relatedProducts = [];

function renderInventory() {
  const searchText =
    document.getElementById("searchText")?.value.toLowerCase() || "";
  const category = document.getElementById("categoryFilter")?.value || "Todas";
  const tableBody = document.getElementById("inventoryTable");
  if (!tableBody) return; // Evita errores si no estamos en inventario.html
  tableBody.innerHTML = "";

  const filteredInventory = inventory.filter(
    (item) =>
      (!searchText || item.producto.toLowerCase().includes(searchText)) &&
      (category === "Todas" || item.categoria === category)
  );

  filteredInventory.forEach((item) => {
    const row = document.createElement("div");
    row.className = "table-row";
    row.innerHTML = `
          <span>${item.producto}</span>
          <span>${item.categoria}</span>
          <span>${item.cantidad}</span>
          <span>${item.unidad}</span>
          <span>${item.total.toFixed(2)}</span>
          <span>${item.ultimaCompra}</span>
          <button class="bi bi-pencil small-btn" title="Editar dato de la compra" onclick="editPurchase(${
            item.id
          })"></button>
          <button class="bi bi-x-lg btn-danger" title="Eliminar Compra" onclick="deletePurchase(${
            item.id
          })"></button>
      `;
    tableBody.appendChild(row);
  });
}

function refreshInventory() {
  const searchText = document.getElementById("searchText");
  const categoryFilter = document.getElementById("categoryFilter");
  if (searchText && categoryFilter) {
    searchText.value = "";
    categoryFilter.value = "Todas";
    renderInventory();
  }
}

function filterCategoryChanged() {
  renderInventory();
}

function filterInventory() {
  renderInventory();
}

function startNewPurchase() {
  if (!document.getElementById("productName")) return; // Evita ejecución si no estamos en la vista correcta
  newPurchase = {
    producto: "",
    categoria: "",
    cantidad: 0,
    unidad: "",
    total: 0,
    ultimaCompra: "",
  };
  relatedProducts = [];
  isEditing = false;
  editingItem = null;
  document.getElementById("productName").value = "";
  document.getElementById("productCategory").value = "";
  document.getElementById("quantity").value = "";
  document.getElementById("unit").value = "";
  document.getElementById("price").value = "";
  document.getElementById("relatedProduct").value = "";
  document.getElementById("relatedProductsList").innerHTML = "";
  document.getElementById("registerButton").style.display = "block";
  document.getElementById("saveButton").style.display = "none";
  document.getElementById("removeRelated").style.display = "none";
}

function registerPurchase() {
  if (!isFormValid()) {
    alert("Por favor, complete todos los campos obligatorios.");
    return;
  }
  const purchase = {
    id: inventory.length + 1,
    producto: document.getElementById("productName").value,
    categoria: document.getElementById("productCategory").value,
    cantidad: parseInt(document.getElementById("quantity").value),
    unidad: document.getElementById("unit").value,
    total: parseFloat(document.getElementById("price").value),
    ultimaCompra: new Date().toISOString().split("T")[0],
  };
  inventory.push(purchase);
  startNewPurchase();
  renderInventory();
}

function editPurchase(id) {
  isEditing = true;
  editingItem = inventory.find((item) => item.id === id);
  document.getElementById("productName").value = editingItem.producto;
  document.getElementById("productCategory").value = editingItem.categoria;
  document.getElementById("quantity").value = editingItem.cantidad;
  document.getElementById("unit").value = editingItem.unidad;
  document.getElementById("price").value = editingItem.total;
  document.getElementById("registerButton").style.display = "none";
  document.getElementById("saveButton").style.display = "block";
}

function saveChanges() {
  if (!isFormValid()) {
    alert("Por favor, complete todos los campos obligatorios.");
    return;
  }
  editingItem.producto = document.getElementById("productName").value;
  editingItem.categoria = document.getElementById("productCategory").value;
  editingItem.cantidad = parseInt(document.getElementById("quantity").value);
  editingItem.unidad = document.getElementById("unit").value;
  editingItem.total = parseFloat(document.getElementById("price").value);
  editingItem.ultimaCompra = new Date().toISOString().split("T")[0];
  startNewPurchase();
  renderInventory();
}

function deletePurchase(id) {
  inventory = inventory.filter((item) => item.id !== id);
  if (isEditing && editingItem && editingItem.id === id) {
    startNewPurchase();
  }
  renderInventory();
}

function addRelatedProduct() {
  const relatedProduct = document.getElementById("relatedProduct").value;
  if (relatedProduct) {
    relatedProducts.push(relatedProduct);
    document.getElementById("relatedProduct").value = "";
    updateRelatedProductsList();
    document.getElementById("removeRelated").style.display = "block";
  }
}

function removeLastRelatedProduct() {
  if (relatedProducts.length > 0) {
    relatedProducts.pop();
    updateRelatedProductsList();
    if (relatedProducts.length === 0) {
      document.getElementById("removeRelated").style.display = "none";
    }
  }
}

function updateRelatedProductsList() {
  const list = document.getElementById("relatedProductsList");
  list.innerHTML = relatedProducts
    .map((product) => `<div>${product}</div>`)
    .join("");
}

function isFormValid() {
  const productName = document.getElementById("productName")?.value || "";
  const quantity = parseInt(document.getElementById("quantity")?.value) || 0;
  const price = parseFloat(document.getElementById("price")?.value) || 0;
  const unit = document.getElementById("unit")?.value || "";
  const category = document.getElementById("productCategory")?.value || "";
  return productName && quantity > 0 && price > 0 && unit && category;
}

document.addEventListener("DOMContentLoaded", renderInventory);
