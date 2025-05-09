import { db } from "../firebase-init.js";
import { Mesa } from "../models/mesa.js";
import { ref, set, get, child, update, remove, onValue } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";

const mesasRef = ref(db, "Mesas");

export class MesaService {
  // Normalizar datos de Firebase
  static normalizeMesaData(id, data) {
    return {
      id,
      nombreMesa: data.nombreMesa || data.NombreMesa || "Sin nombre",
      estado: data.estado || data.Estado || "Libre",
      fila: typeof data.fila === "number" ? data.fila : typeof data.Fila === "number" ? data.Fila : 0,
      columna: typeof data.columna === "number" ? data.columna : typeof data.Columna === "number" ? data.Columna : 0
    };
  }

  // Obtener todas las mesas
  static async getMesas() {
    try {
      const snapshot = await get(mesasRef);
      if (snapshot.exists()) {
        const mesas = snapshot.val();
        return Object.entries(mesas).map(([id, data]) => 
          this.normalizeMesaData(id, data)
        );
      }
      return [];
    } catch (error) {
      console.error("Error al cargar las mesas:", error);
      throw new Error("Error al cargar las mesas.");
    }
  }

  // Obtener una mesa por ID
  static async getMesaById(id) {
    try {
      const snapshot = await get(child(mesasRef, id));
      if (snapshot.exists()) {
        return this.normalizeMesaData(id, snapshot.val());
      }
      throw new Error("Mesa no encontrada.");
    } catch (error) {
      console.error("Error al cargar la mesa:", error);
      throw new Error("Error al cargar la mesa.");
    }
  }

  // Registrar una nueva mesa
  static async registerMesa(mesa) {
    try {
      await set(child(mesasRef, mesa.id), {
        nombreMesa: mesa.nombreMesa,
        estado: mesa.estado,
        fila: mesa.fila,
        columna: mesa.columna
      });
    } catch (error) {
      console.error("Error al registrar la mesa:", error);
      throw new Error("Error al registrar la mesa.");
    }
  }

  // Actualizar una mesa
  static async updateMesa(id, mesa) {
    try {
      await update(child(mesasRef, id), {
        nombreMesa: mesa.nombreMesa,
        estado: mesa.estado,
        fila: mesa.fila,
        columna: mesa.columna
      });
    } catch (error) {
      console.error("Error al actualizar la mesa:", error);
      throw new Error("Error al actualizar la mesa.");
    }
  }

  // Eliminar una mesa
  static async deleteMesa(id) {
    try {
      await remove(child(mesasRef, id));
    } catch (error) {
      console.error("Error al eliminar la mesa:", error);
      throw new Error("Error al eliminar la mesa.");
    }
  }

  // Suscribirse a cambios en tiempo real
  static subscribeToMesas(callback) {
    return onValue(mesasRef, (snapshot) => {
      if (snapshot.exists()) {
        const mesas = snapshot.val();
        const normalizedMesas = Object.entries(mesas).map(([id, data]) => 
          this.normalizeMesaData(id, data)
        );
        callback(normalizedMesas);
      } else {
        callback([]);
      }
    });
  }
}
