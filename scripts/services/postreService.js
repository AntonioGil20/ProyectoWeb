// scripts/services/postreService.js
import { db } from "../firebase-init.js";
import { Postre } from "../models/postre.js";
import {
  ref,
  set,
  get,
  child,
  update,
  remove,
  onValue,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";

const postresRef = ref(db, "Postres");

export class PostreService {
  // Normalizar datos de Firebase
  static normalizePostreData(id, data) {
    console.log(`Normalizando datos de postre con ID ${id}:`, data); // Depuración
    return {
      id,
      nombre: data.nombre || data.Nombre || "Sin nombre",
      precioMx:
        typeof data.precioMx === "number"
          ? data.precioMx
          : typeof data.PrecioMx === "number"
          ? data.PrecioMx
          : 0.0,
      precioUSD:
        typeof data.precioUSD === "number"
          ? data.precioUSD
          : typeof data.PrecioUSD === "number"
          ? data.PrecioUSD
          : 0.0,
      stock:
        typeof data.stock === "number"
          ? data.stock
          : typeof data.Stock === "number"
          ? data.Stock
          : 0,
    };
  }

  // Obtener todos los postres
  static async getPostres() {
    try {
      console.log("Obteniendo postres desde Firebase..."); // Depuración
      const snapshot = await get(postresRef);
      if (snapshot.exists()) {
        const postres = snapshot.val();
        console.log("Datos crudos de Firebase (Postres):", postres); // Depuración
        return Object.entries(postres).map(([id, data]) =>
          this.normalizePostreData(id, data)
        );
      }
      console.log("No hay datos en el nodo Postres."); // Depuración
      return [];
    } catch (error) {
      console.error("Error al cargar los postres:", error);
      throw new Error("Error al cargar los postres.");
    }
  }

  // Obtener un postre por ID
  static async getPostreById(id) {
    try {
      const snapshot = await get(child(postresRef, id));
      if (snapshot.exists()) {
        return this.normalizePostreData(id, snapshot.val());
      }
      throw new Error("Postre no encontrado.");
    } catch (error) {
      console.error("Error al cargar el postre:", error);
      throw new Error("Error al cargar el postre.");
    }
  }

  // Registrar un nuevo postre
  static async registerPostre(postre) {
    try {
      await set(child(postresRef, postre.id), {
        nombre: postre.nombre,
        precioMx: postre.precioMx,
        precioUSD: postre.precioUSD,
        stock: postre.stock,
      });
      console.log(`Postre ${postre.nombre} registrado con ID ${postre.id}`); // Depuración
    } catch (error) {
      console.error("Error al registrar el postre:", error);
      throw new Error("Error al registrar el postre.");
    }
  }

  // Actualizar un postre
  static async updatePostre(id, postre) {
    try {
      await update(child(postresRef, id), {
        nombre: postre.nombre,
        precioMx: postre.precioMx,
        precioUSD: postre.precioUSD,
        stock: postre.stock,
      });
    } catch (error) {
      console.error("Error al actualizar el postre:", error);
      throw new Error("Error al actualizar el postre.");
    }
  }

  // Eliminar un postre
  static async deletePostre(id) {
    try {
      await remove(child(postresRef, id));
    } catch (error) {
      console.error("Error al eliminar el postre:", error);
      throw new Error("Error al eliminar el postre.");
    }
  }

  // Suscribirse a cambios en tiempo real
  static subscribeToPostres(callback) {
    return onValue(postresRef, (snapshot) => {
      if (snapshot.exists()) {
        const postres = snapshot.val();
        const normalizedPostres = Object.entries(postres).map(([id, data]) =>
          this.normalizePostreData(id, data)
        );
        callback(normalizedPostres);
      } else {
        callback([]);
      }
    });
  }
}
