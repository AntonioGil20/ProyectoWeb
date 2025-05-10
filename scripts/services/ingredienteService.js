// scripts/services/ingredienteService.js
import { db } from "../firebase-init.js";
import { Ingrediente } from "../models/ingrediente.js";
import {
  ref,
  set,
  get,
  child,
  update,
  remove,
  onValue,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";

const ingredientesRef = ref(db, "Ingredientes");

export class IngredienteService {
  // Normalizar datos de Firebase
  static normalizeIngredienteData(id, data) {
    console.log(`Normalizando datos de ingrediente con ID ${id}:`, data); // Depuración
    return {
      id,
      elemento: data.elemento || data.Elemento || "Sin nombre",
    };
  }

  // Obtener todos los ingredientes
  static async getIngredientes() {
    try {
      console.log("Obteniendo ingredientes desde Firebase..."); // Depuración
      const snapshot = await get(ingredientesRef);
      if (snapshot.exists()) {
        const ingredientes = snapshot.val();
        console.log("Datos crudos de Firebase (Ingredientes):", ingredientes); // Depuración
        return Object.entries(ingredientes).map(([id, data]) =>
          this.normalizeIngredienteData(id, data)
        );
      }
      console.log("No hay datos en el nodo Ingredientes."); // Depuración
      return [];
    } catch (error) {
      console.error("Error al cargar los ingredientes:", error);
      throw new Error("Error al cargar los ingredientes.");
    }
  }

  // Obtener un ingrediente por ID
  static async getIngredienteById(id) {
    try {
      const snapshot = await get(child(ingredientesRef, id));
      if (snapshot.exists()) {
        return this.normalizeIngredienteData(id, snapshot.val());
      }
      throw new Error("Ingrediente no encontrado.");
    } catch (error) {
      console.error("Error al cargar el ingrediente:", error);
      throw new Error("Error al cargar el ingrediente.");
    }
  }

  // Registrar un nuevo ingrediente
  static async registerIngrediente(ingrediente) {
    try {
      await set(child(ingredientesRef, ingrediente.id), {
        elemento: ingrediente.elemento,
      });
      console.log(
        `Ingrediente ${ingrediente.elemento} registrado con ID ${ingrediente.id}`
      ); // Depuración
    } catch (error) {
      console.error("Error al registrar el ingrediente:", error);
      throw new Error("Error al registrar el ingrediente.");
    }
  }

  // Actualizar un ingrediente
  static async updateIngrediente(id, ingrediente) {
    try {
      await update(child(ingredientesRef, id), {
        elemento: ingrediente.elemento,
      });
    } catch (error) {
      console.error("Error al actualizar el ingrediente:", error);
      throw new Error("Error al actualizar el ingrediente.");
    }
  }

  // Eliminar un ingrediente
  static async deleteIngrediente(id) {
    try {
      await remove(child(ingredientesRef, id));
    } catch (error) {
      console.error("Error al eliminar el ingrediente:", error);
      throw new Error("Error al eliminar el ingrediente.");
    }
  }

  // Suscribirse a cambios en tiempo real
  static subscribeToIngredientes(callback) {
    return onValue(ingredientesRef, (snapshot) => {
      if (snapshot.exists()) {
        const ingredientes = snapshot.val();
        const normalizedIngredientes = Object.entries(ingredientes).map(
          ([id, data]) => this.normalizeIngredienteData(id, data)
        );
        callback(normalizedIngredientes);
      } else {
        callback([]);
      }
    });
  }
}
