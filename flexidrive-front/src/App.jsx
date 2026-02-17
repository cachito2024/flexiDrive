import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Layouts
import PublicLayout from "./layouts/PublicLayout";
import AppLayout from "./layouts/AppLayout";
import ClienteLayout from "./layouts/ClienteLayout";
import ComisionistaLayout from "./layouts/ComisionistaLayout";

// Public pages
import Home from "./pages/public/Home";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import Totp from "./pages/public/Totp";
import CompleteProfile from "./pages/public/CompleteProfile";
import CompleteComisionista from "./pages/public/CompleteComisionista";
import ForgotPassword from "./pages/public/ForgotPassword";
import EmailConfirm from "./pages/public/EmailConfirm";
import Novedades from "./pages/public/Novedades";
import QuienesSomos from "./pages/public/QuienesSomos";


// Cliente pages
import DashboardCliente from "./pages/cliente/DashboardCliente";
import CrearEnvio from "./pages/cliente/CrearEnvio";

// Comisionista pages
import DashboardComisionista from "./pages/comisionista/DashboardComisionista";
import EnviosDisponibles from "./pages/comisionista/EnviosDisponibles";

// Estados (opcional)
import NotFound from "./pages/system/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Públicas */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />

          {/* Auth */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/auth/totp" element={<Totp />} />
          <Route path="/auth/forgot" element={<ForgotPassword />} />
          <Route path="/auth/email-confirm" element={<EmailConfirm />} />
          <Route path="/novedades" element={<Novedades />} />
          <Route path="/quienes-somos" element={<QuienesSomos />} />


          {/* Flujos post-login según backend */}
          <Route path="/auth/complete-profile" element={<CompleteProfile />} />
          <Route
            path="/auth/complete-comisionista"
            element={<CompleteComisionista />}
          />

          {/* Compatibilidad por si ya tenías /login y /register */}
          <Route path="/login" element={<Navigate to="/auth/login" replace />} />
          <Route
            path="/register"
            element={<Navigate to="/auth/register" replace />}
          />
        </Route>

        {/* Privadas (genérica) */}
        <Route element={<AppLayout />}>
          <Route path="/app" element={<Navigate to="/auth/login" replace />} />
        </Route>

        {/* Cliente */}
        <Route element={<ClienteLayout />}>
          <Route path="/cliente/dashboard" element={<DashboardCliente />} />
          <Route path="/cliente/crear-envio" element={<CrearEnvio />} />
        </Route>

        {/* Comisionista */}
        <Route element={<ComisionistaLayout />}>
          <Route
            path="/comisionista/dashboard"
            element={<DashboardComisionista />}
          />
          <Route path="/comisionista/envios" element={<EnviosDisponibles />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
