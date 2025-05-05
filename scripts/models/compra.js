// js/models/compra.js
export class Compra {
  constructor({
    id = crypto.randomUUID(), // Genera un ID único (equivalente a Guid.NewGuid())
    nombreProducto = null,
    categoria = null,
    cantidad = 0,
    unidad = null,
    total = 0,
    fechaCompra = new Date(), // Equivalente a DateTime.Now
  } = {}) {
    this.id = id;
    this.nombreProducto = nombreProducto;
    this.categoria = categoria;
    this.cantidad = cantidad;
    this.unidad = unidad;
    this.total = total;
    this.fechaCompra = fechaCompra;
  }
}
