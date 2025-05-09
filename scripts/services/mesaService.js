// scripts/services/mesaService.js
import { db } from "../firebase-init.js";
import { Mesa } from "../models/mesa.js";
import {
  ref,
  set,
  get,
  child,
  update,
  remove,
  onValue,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";

const mesasRef = ref(db, "Mesas");

export class MesaService {
  static normalizeMesaData(id, data) {
    console.log(`Normalizando datos de mesa con ID ${id}:`, data); // Depuración
    return {
      id,
      nombreMesa: data.nombreMesa || data.NombreMesa || "Sin nombre",
      estado: data.estado || data.Estado || "Libre",
      fila:
        typeof data.fila === "number"
          ? data.fila
          : typeof data.Fila === "number"
          ? data.Fila
          : 0,
      columna:
        typeof data.columna === "number"
          ? data.columna
          : typeof data.Columna === "number"
          ? data.Columna
          : 0,
    };
  }

  static async getMesas() {
    try {
      console.log("Obteniendo mesas desde Firebase..."); // Depuración
      const snapshot = await get(mesasRef);
      if (snapshot.exists()) {
        const mesas = snapshot.val();
        console.log("Datos crudos de Firebase:", mesas); // Depuración
        return Object.entries(mesas).map(([id, data]) =>
          this.normalizeMesaData(id, data)
        );
      }
      console.log("No hay datos en el nodo Mesas."); // Depuración
      return [];
    } catch (error) {
      console.error("Error al cargar las mesas:", error);
      throw new Error("Error al cargar las mesas.");
    }
  }

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

  static async registerMesa(mesa) {
    try {
      await set(child(mesasRef, mesa.id), {
        nombreMesa: mesa.nombreMesa,
        estado: mesa.estado,
        fila: mesa.fila,
        columna: mesa.columna,
      });
      console.log(`Mesa ${mesa.nombreMesa} registrada con ID ${mesa.id}`); // Depuración
    } catch (error) {
      console.error("Error al registrar la mesa:", error);
      throw new Error("Error al registrar la mesa.");
    }
  }

  static async updateMesa(id, mesa) {
    try {
      await update(child(mesasRef, id), {
        nombreMesa: mesa.nombreMesa,
        estado: mesa.estado,
        fila: mesa.fila,
        columna: mesa.columna,
      });
    } catch (error) {
      console.error("Error al actualizar la mesa:", error);
      throw new Error("Error al actualizar la mesa.");
    }
  }

  static async deleteMesa(id) {
    try {
      await remove(child(mesasRef, id));
    } catch (error) {
      console.error("Error al eliminar la mesa:", error);
      throw new Error("Error al eliminar la mesa.");
    }
  }

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
