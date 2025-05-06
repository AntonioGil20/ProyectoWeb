export class Compra {
  constructor({
    id,
    nombreProducto,
    categoria,
    cantidad,
    unidad,
    total,
    fechaCompra,
  }) {
    this.id =
      id || `compra_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`; // Usar el id proporcionado o generar uno nuevo
    this.nombreProducto = nombreProducto || "";
    this.categoria = categoria || "";
    this.cantidad = cantidad || 0;
    this.unidad = unidad || "";
    this.total = total || 0;
    this.fechaCompra = fechaCompra || new Date();
  }
}
