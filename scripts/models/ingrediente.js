// scripts/models/ingrediente.js
export class Ingrediente {
  constructor({ id, elemento }) {
    this.id =
      id ||
      `ingrediente_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.elemento = elemento || "";
  }
}
