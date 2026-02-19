// src/services/authService.js

const API_URL = import.meta.env.VITE_AUTH_API_URL || "http://localhost:4000";

async function parseJsonSafe(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export async function login({ email, password }) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    throw new Error(data?.error || "Error en login");
  }

  return data;
}

export async function verifyTotp({ tempToken, codigoIngresado }) {
  const res = await fetch(`${API_URL}/api/auth/verify-totp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tempToken, codigoIngresado }),
  });

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    throw new Error(data?.error || "Error verificando TOTP");
  }

  return data;
}

export async function register(payload) {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    const details = Array.isArray(data?.detalles)
      ? data.detalles.map((d) => `${d.campo}: ${d.mensaje}`).join(" | ")
      : "";
    throw new Error(details || data?.error || "Error en registro");
  }

  return data; // debería traer otpauthUrl
}
