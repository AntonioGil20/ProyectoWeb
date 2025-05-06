// scripts/models/mesero.js
export class Mesero {
  constructor({ id, name, password }) {
    this.id =
      id || `mesero_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`; // Genera un ID único si no se proporciona
    this.name = name || "";
    this.password = password || "";
  }
}
