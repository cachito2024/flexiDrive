// src/pages/cliente/CrearEnvio.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SolicitarEnvio() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    origen: "",
    horaRetiro: "",
    apellido: "",
    nombre: "",
    dni: "",
    telefono: "",
    direccion: "",
    ciudad: "",
    provincia: "",
    cp: "",
    fechaEntrega: "",
    tipoPaquete: "",
    alto: "",
    ancho: "",
    profundidad: "",
    peso: "",
    notas: "",
  });

  function onChange(e) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  function goBuscar() {
    // MVP: guardo el borrador para que SeleccionComisionista lo lea
    localStorage.setItem("draftEnvio", JSON.stringify(form));
    navigate("/cliente/seleccionar-comisionista");
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div className="hidden lg:block">
        <div className="h-[520px] w-full rounded-2xl bg-white border flex items-center justify-center text-slate-400">
          Ilustración (placeholder)
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-8">
        <h1 className="text-4xl font-bold text-slate-700">Solicitar envío</h1>

        <div className="mt-6 space-y-8">
          <Section title="Origen">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input name="origen" value={form.origen} onChange={onChange} placeholder="Dirección de retiro" />
              <Input name="horaRetiro" value={form.horaRetiro} onChange={onChange} placeholder="Seleccionar hora" />
            </div>
          </Section>

          <Section title="Destino">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input name="apellido" value={form.apellido} onChange={onChange} placeholder="Apellido" />
              <Input name="nombre" value={form.nombre} onChange={onChange} placeholder="Nombre" />
              <Input name="dni" value={form.dni} onChange={onChange} placeholder="DNI" />
              <Input name="telefono" value={form.telefono} onChange={onChange} placeholder="Teléfono" />
              <Input
                className="md:col-span-2"
                name="direccion"
                value={form.direccion}
                onChange={onChange}
                placeholder="Dirección de envío"
              />
              <Input className="md:col-span-2" name="ciudad" value={form.ciudad} onChange={onChange} placeholder="Ciudad" />
              <Input name="provincia" value={form.provincia} onChange={onChange} placeholder="Provincia" />
              <Input name="cp" value={form.cp} onChange={onChange} placeholder="Código postal" />
              <Input name="fechaEntrega" value={form.fechaEntrega} onChange={onChange} placeholder="Seleccionar fecha" />
            </div>

            <button className="mt-2 font-semibold text-blue-700 hover:underline" type="button">
              Guardar nuevo cliente
            </button>
          </Section>

          <Section title="Detalles de paquetes">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
              <Input name="tipoPaquete" value={form.tipoPaquete} onChange={onChange} placeholder="Tipo de paquete" />
              <Input name="alto" value={form.alto} onChange={onChange} placeholder="Alto" />
              <Input name="ancho" value={form.ancho} onChange={onChange} placeholder="Ancho" />
              <Input name="profundidad" value={form.profundidad} onChange={onChange} placeholder="Profundidad" />
              <Input name="peso" value={form.peso} onChange={onChange} placeholder="Peso (gr)" />
            </div>

            <button className="mt-2 font-semibold text-blue-700 hover:underline" type="button">
              Nuevo paquete +
            </button>
          </Section>

          <Section title="Notas adicionales">
            <textarea
              name="notas"
              value={form.notas}
              onChange={onChange}
              placeholder="Escribí acá cualquier indicación adicional..."
              className="min-h-[120px] w-full rounded-xl border px-4 py-3 outline-none"
            />
          </Section>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={goBuscar}
              className="rounded-full bg-blue-700 px-10 py-4 text-lg font-semibold text-white hover:bg-blue-800"
            >
              Buscar comisionista
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <div className="text-lg font-bold text-slate-700">{title}</div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Input({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border px-4 py-3 outline-none text-slate-700 ${className}`}
    />
  );
}
