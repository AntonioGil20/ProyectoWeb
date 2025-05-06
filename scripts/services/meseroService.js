// scripts/services/meseroService.js
import { db } from "../firebase-init.js";
import { Mesero } from "../models/mesero.js";
import {
  ref,
  set,
  get,
  child,
  update,
  remove,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";

// Asegurarnos de que el nodo sea exactamente "Mesero"
const meserosRef = ref(db, "Mesero");

export class MeseroService {
  // Normalizar datos de Firebase
  static normalizeMeseroData(id, data) {
    console.log("Datos recibidos de Firebase para el mesero:", id, data); // Depuración
    return {
      id,
      name: data.name || data.Name || "Sin nombre",
      password: data.password || data.Password || "",
    };
  }

  // Guardar un nuevo mesero
  static async saveMesero(mesero) {
    try {
      console.log("Guardando mesero:", mesero); // Depuración
      await set(child(meserosRef, mesero.id), {
        id: mesero.id,
        name: mesero.name,
        password: mesero.password,
      });
      console.log("Mesero guardado exitosamente:", mesero.id);
      return true;
    } catch (error) {
      console.error("Error al guardar el mesero:", error);
      return false;
    }
  }

  // Obtener todos los meseros
  static async getMeseros() {
    try {
      console.log("Obteniendo meseros desde Firebase..."); // Depuración
      const snapshot = await get(meserosRef);
      if (snapshot.exists()) {
        const meseros = snapshot.val();
        console.log("Datos de meseros obtenidos:", meseros); // Depuración
        return Object.entries(meseros).map(([id, data]) =>
          this.normalizeMeseroData(id, data)
        );
      } else {
        console.log("No se encontraron meseros en la base de datos.");
        return [];
      }
    } catch (error) {
      console.error("Error al obtener los meseros:", error);
      return [];
    }
  }

  // Obtener un mesero por ID
  static async getMeseroById(id) {
    try {
      console.log("Obteniendo mesero por ID:", id); // Depuración
      const snapshot = await get(child(meserosRef, id));
      if (snapshot.exists()) {
        const meseroData = this.normalizeMeseroData(id, snapshot.val());
        console.log("Mesero encontrado:", meseroData);
        return meseroData;
      }
      console.log("Mesero no encontrado para el ID:", id);
      throw new Error("Mesero no encontrado.");
    } catch (error) {
      console.error("Error al obtener el mesero:", error);
      throw new Error("Error al obtener el mesero.");
    }
  }

  // Verificar si un mesero existe con nombre y contraseña
  static async verifyMesero(name, password) {
    try {
      console.log("Verificando mesero:", name, password); // Depuración
      const meseros = await this.getMeseros();
      const exists = meseros.some(
        (mesero) => mesero.name === name && mesero.password === password
      );
      console.log("Resultado de verificación:", exists);
      return exists;
    } catch (error) {
      console.error("Error al verificar el mesero:", error);
      return false;
    }
  }

  // Verificar si un nombre de mesero ya está registrado
  static async verifyRegistration(name) {
    try {
      console.log("Verificando registro para:", name); // Depuración
      const meseros = await this.getMeseros();
      const exists = meseros.some((mesero) => mesero.name === name);
      console.log("Resultado de verificación de registro:", exists);
      return exists;
    } catch (error) {
      console.error("Error al verificar el registro:", error);
      return false;
    }
  }

  // Borrar un mesero por ID
  static async deleteMesero(id) {
    try {
      console.log("Eliminando mesero con ID:", id); // Depuración
      await remove(child(meserosRef, id));
      console.log("Mesero eliminado exitosamente:", id);
      return true;
    } catch (error) {
      console.error("Error al borrar el mesero:", error);
      return false;
    }
  }

  // Actualizar un mesero
  static async updateMesero(mesero) {
    if (!mesero.id) {
      console.error("ID de mesero no proporcionado.");
      return false;
    }
    try {
      console.log("Actualizando mesero:", mesero); // Depuración
      await update(child(meserosRef, mesero.id), {
        name: mesero.name,
        password: mesero.password,
      });
      console.log("Mesero actualizado exitosamente:", mesero.id);
      return true;
    } catch (error) {
      console.error("Error al actualizar el mesero:", error);
      return false;
    }
  }
}
