// src/services/shipmentService.js
import { SHIPMENTS_MOCK, COMISIONISTAS_MOCK } from "./shipmentsMock";

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function getMyShipments({ estado = "todos", q = "" } = {}) {
  await wait(200);
  const query = q.trim().toLowerCase();

  return SHIPMENTS_MOCK.filter((s) => {
    const okEstado = estado === "todos" ? true : s.estado === estado;
    const okQuery =
      !query ||
      String(s.id).includes(query) ||
      s.cliente.toLowerCase().includes(query) ||
      s.destino.toLowerCase().includes(query) ||
      s.comisionista.toLowerCase().includes(query);
    return okEstado && okQuery;
  });
}

export async function getShipmentById(id) {
  await wait(150);
  const found = SHIPMENTS_MOCK.find((s) => String(s.id) === String(id));
  if (!found) throw new Error("Envío no encontrado");
  return found;
}

export async function searchComisionistas() {
  await wait(350);
  return COMISIONISTAS_MOCK;
}

export async function createShipment() {
  await wait(400);
  return { ok: true, shipmentId: 2542 };
}

export async function mockPay({ method }) {
  await wait(900);
  // Simula pago MP/transfer/efectivo OK
  return { ok: true, status: method === "mercadopago" ? "approved" : "registered" };
}

export async function mockRate() {
  await wait(350);
  return { ok: true };
}
