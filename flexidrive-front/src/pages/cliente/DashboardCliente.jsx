import LogoutButton from "../../components/LogoutButton";
// src/pages/cliente/DashboardCliente.jsx
import { Link } from "react-router-dom";

export default function DashboardCliente() {
  const username = localStorage.getItem("username") || "Lucía";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-5xl font-bold tracking-tight text-slate-700">Hola, {username}</h1>
        <p className="mt-2 text-xl font-semibold text-slate-600">¿Qué querés hacer hoy?</p>
      </div>

      <div className="rounded-xl border bg-white p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Metric number="12" label="Envíos activos" />
          <Metric number="58" label="Envíos completados" />
          <Metric number="4.8" label="Calificación promedio" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Solicitar envío" subtitle="Creá un nuevo envío en pocos pasos">
          <Link
            to="/cliente/solicitar-envio"
            className="inline-flex items-center justify-center rounded-full bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800"
          >
            Solicitar envío
          </Link>
        </Card>

        <Card title="Ver envíos" subtitle="Consultá el estado de tus envíos">
          <Link to="/cliente/envios" className="font-semibold text-blue-700 hover:underline">
            Ver más
          </Link>
        </Card>

        <div className="space-y-4">
          <QuickLink to="/cliente/datos" label="Mis Datos" />
          <QuickLink to="/cliente/metodos-pago" label="Métodos de pago" />
          <QuickLink to="/cliente/direcciones" label="Direcciones frecuentes" />
          <QuickLink to="/cliente/soporte" label="Ayuda y soporte" />
        </div>
      </div>
    </div>
  );
}

function Metric({ number, label }) {
  return (
    <div className="flex items-baseline gap-3">
      <div className="text-5xl font-bold text-blue-800">{number}</div>
      <div className="text-lg font-semibold text-slate-700">{label}</div>
    </div>
  );
}

function Card({ title, subtitle, children }) {
  return (
    <div className="rounded-xl border bg-white p-6">
      <div className="text-xl font-bold text-slate-700">{title}</div>
      <div className="mt-1 text-slate-500">{subtitle}</div>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function QuickLink({ to, label }) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-xl border bg-white p-5 hover:bg-slate-50">
      <div className="h-9 w-9 rounded-md bg-slate-200" />
      <div className="font-semibold text-slate-700">{label}</div>
    </Link>
  );
}
