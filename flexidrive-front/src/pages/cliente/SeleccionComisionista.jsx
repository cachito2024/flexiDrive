// src/pages/cliente/SeleccionComisionista.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";
import { searchComisionistas, createShipment } from "../../services/shipmentService";

export default function SeleccionComisionista() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await searchComisionistas();
        setList(data);
        setSelected(data?.[0]?.id || null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function confirmar() {
  // 1) Buscar el objeto del comisionista seleccionado (para guardar info)
  const comi = list.find((c) => c.id === selected);

  // 2) Guardar comisionista elegido (para pantalla Confirmación y Pago)
  localStorage.setItem(
    "draftComisionista",
    JSON.stringify({
      id: comi?.id,
      nombre: comi?.nombre,
      rating: comi?.rating,
      precioEstimado: comi?.precioEstimado,
      eta: comi?.eta,
    })
  );

  // 3) (Opcional) Si querés seguir creando el envío acá mismo, guardá el id
  //    Si preferís crearlo DESPUÉS del pago, podés borrar estas 2 líneas.
  const res = await createShipment();
  localStorage.setItem("draftShipmentId", String(res.shipmentId));

  // 4) Ir a confirmación (en vez de tracking directo)
  navigate("/cliente/confirmacion-envio");
}


  const draft = (() => {
    try {
      return JSON.parse(localStorage.getItem("draftEnvio") || "{}");
    } catch {
      return {};
    }
  })();

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div className="rounded-2xl border bg-white p-8">
        <h1 className="text-4xl font-bold text-slate-700">Seleccioná un comisionista</h1>
        <p className="mt-2 text-slate-500">
          Elegí quién va a retirar y entregar tu paquete. (MVP con datos mock)
        </p>

        <div className="mt-6 rounded-xl border bg-slate-50 p-4">
          <div className="font-semibold text-slate-700">Resumen del envío</div>
          <div className="mt-2 text-sm text-slate-600">
            <div><b>Origen:</b> {draft.origen || "—"}</div>
            <div><b>Destino:</b> {draft.direccion || "—"} {draft.ciudad ? `(${draft.ciudad})` : ""}</div>
            <div><b>Fecha entrega:</b> {draft.fechaEntrega || "—"}</div>
          </div>
        </div>

        <div className="mt-8">
          {loading ? (
            <Loader label="Buscando comisionistas..." />
          ) : list.length === 0 ? (
            <EmptyState title="No hay comisionistas disponibles" subtitle="Probá más tarde o cambiá la fecha/hora." />
          ) : (
            <div className="space-y-4">
              {list.map((c) => (
                <label
                  key={c.id}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border p-5 hover:bg-slate-50 ${
                    selected === c.id ? "border-blue-700" : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <input
                      type="radio"
                      name="comi"
                      checked={selected === c.id}
                      onChange={() => setSelected(c.id)}
                    />
                    <div>
                      <div className="text-lg font-bold text-slate-700">{c.nombre}</div>
                      <div className="text-sm text-slate-500">⭐ {c.rating} · ETA: {c.eta}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold text-slate-700">${c.precioEstimado}</div>
                    <div className="text-sm text-slate-500">estimado</div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/cliente/solicitar-envio")}
            className="rounded-full border px-8 py-3 font-semibold text-slate-700 hover:bg-slate-50"
          >
            Volver
          </button>

          <button
            type="button"
            disabled={!selected || loading}
            onClick={confirmar}
            className="rounded-full bg-blue-700 px-10 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
          >
            Confirmar envío
          </button>
        </div>
      </div>

      <div className="hidden lg:block">
        <div className="h-[520px] w-full rounded-2xl bg-white border flex items-center justify-center text-slate-400">
          Ilustración (placeholder)
        </div>
      </div>
    </div>
  );
}
