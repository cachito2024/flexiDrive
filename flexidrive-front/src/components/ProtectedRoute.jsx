import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute({ allowedRoles }) {
  const token = localStorage.getItem("token");
  const rol = localStorage.getItem("rol"); // cliente | comisionista | admin

  // 1) Sin token => login
  if (!token) {
    return <Navigate to="/auth/login" replace />;
  }

  // 2) Si no pedimos roles específicos, pasa igual
  if (!allowedRoles || allowedRoles.length === 0) {
    return <Outlet />;
  }

  // 3) Si el rol no coincide => redirigir al dashboard correcto
  if (!rol || !allowedRoles.includes(rol)) {
    if (rol === "cliente") return <Navigate to="/cliente/dashboard" replace />;
    if (rol === "comisionista") return <Navigate to="/comisionista/dashboard" replace />;
    return <Navigate to="/app" replace />;
  }

  // 4) OK
  return <Outlet />;
}
