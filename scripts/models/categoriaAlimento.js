export class CategoriaAlimento {
  constructor({ id, nombre, protegida = false }) {
    this.id = id || `categoria_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.nombre = nombre || "";
    this.protegida = protegida; // Para categorías básicas que no se pueden eliminar
  }
}
