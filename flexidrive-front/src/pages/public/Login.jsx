import { Link, useNavigate } from "react-router-dom";
import { Clock, Truck, Sparkles } from "lucide-react";
import { useState } from "react";
import heroImg from "../../assets/hero.svg";
import { login, verifyTotp } from "../../services/authService";

export default function Login() {
  const navigate = useNavigate();

  // Login form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // TOTP modal
  const [totpOpen, setTotpOpen] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [codigoIngresado, setCodigoIngresado] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await login({ email, password });


      // ✅ Si tu back devuelve token directo (por si cambia)
      if (data?.token) {
        localStorage.setItem("token", data.token);
        navigate("/app");
        return;
      }

      // ✅ Caso más común: back exige TOTP
      // En muchos back devuelve tempToken (o algo parecido)
      if (data?.tempToken || data?.requiresTotp || data?.requiresSetup) {
        setTempToken(data.tempToken || "");
        setTotpOpen(true);
        return;
      }

      setError("Respuesta inesperada del servidor en login.");
    } catch (err) {
      setError(err.message || "Error al iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTotp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await verifyTotp({ tempToken, codigoIngresado });

      if (data?.token) {
        localStorage.setItem("token", data.token);

        if (data?.rol) localStorage.setItem("rol", data.rol)
          
        setTotpOpen(false);
        setCodigoIngresado("");

        // Si tu back devuelve rol, podés redirigir según rol
        if (data?.rol === "cliente") navigate("/cliente/dashboard");
        else if (data?.rol === "comisionista") navigate("/comisionista/dashboard");
        else navigate("/app");

        return;
      }

      setError("Respuesta inesperada del servidor al verificar TOTP.");
    } catch (err) {
      setError(err.message || "Código inválido.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-slate-50">
      <section className="bg-slate-100/60">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-4 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-12 items-center">
            <div className="lg:col-span-1"></div>

            {/* IZQUIERDA */}
            <div className="lg:col-span-4">
              <h1 className="font-organetto text-xl sm:text-2xl font-extrabold tracking-tight text-blue-700 leading-10 ">
                FLEXIBILIDAD EN <br /> TRANSPORTE
              </h1>

              <p className="mt-5 text-slate-700 max-w-md font-medium">
                Conectamos clientes con comisionistas para envíos rápidos,
                seguros y con seguimiento en tiempo real.
              </p>
            </div>

            {/* CENTRO */}
            <div className="lg:col-span-4 flex justify-center">
              <img
                src={heroImg}
                alt="FlexiDrive"
                className="w-full max-w-[600px] object-contain"
              />
            </div>

            {/* DERECHA */}
            <div className="lg:col-span-3">
              <div className="bg-slate-100/80 border border-slate-300 rounded-2xl p-7">
                {error ? (
                  <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}

                <form onSubmit={handleSubmit}>
                  <label className="block text-base text-slate-700 mb-2">
                    Usuario o email
                  </label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    required
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 outline-none"
                  />

                  <label className="block text-base text-slate-700 mt-6 mb-2">
                    Contraseña
                  </label>
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    required
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 outline-none"
                  />

                  <div className="mt-4 text-right">
                    <Link
                      to="/auth/forgot"
                      className="text-sm text-blue-700 hover:underline"
                    >
                      Olvidé mi contraseña
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-5 w-full inline-flex items-center justify-center rounded-full bg-blue-700 text-white py-3.5 font-medium shadow-sm hover:bg-blue-800 transition disabled:opacity-60"
                  >
                    {loading ? "Ingresando..." : "Iniciar sesión"}
                  </button>
                </form>

                <button
                  type="button"
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white py-3.5 font-medium text-slate-800"
                >
                  <span className="text-lg">G</span>
                  Iniciar sesión con Google
                </button>

                <div className="mt-6 text-center text-sm text-slate-700">
                  ¿No tenés cuenta?{" "}
                  <Link
                    to="/auth/register"
                    className="text-blue-700 font-medium hover:underline"
                  >
                    Registrate
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* CARDS ABAJO */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-slate-100/80 border border-slate-300 rounded-2xl p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl border border-slate-300 bg-white flex items-center justify-center">
                <Clock className="w-6 h-6 text-slate-800" />
              </div>
              <div className="text-xl font-semibold text-blue-700">
                Envíos rápidos
              </div>
            </div>

            <div className="bg-slate-100/80 border border-slate-300 rounded-2xl p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl border border-slate-300 bg-white flex items-center justify-center">
                <Truck className="w-6 h-6 text-slate-800" />
              </div>
              <div className="text-xl font-semibold text-blue-700">
                Envíos flexibles
              </div>
            </div>

            <div className="bg-slate-100/80 border border-slate-300 rounded-2xl p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl border border-slate-300 bg-white flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-slate-800" />
              </div>
              <div className="text-xl font-semibold text-blue-700">
                Optimización con IA
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MODAL TOTP */}
      {totpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-900">
              Verificación TOTP
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Ingresá el código de 6 dígitos de tu app autenticadora.
            </p>

            <form onSubmit={handleVerifyTotp} className="mt-4">
              <label className="block text-sm text-slate-700 mb-2">
                Código
              </label>
              <input
                value={codigoIngresado}
                onChange={(e) => setCodigoIngresado(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 outline-none"
                inputMode="numeric"
                placeholder="123456"
                required
              />

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setTotpOpen(false);
                    setCodigoIngresado("");
                  }}
                  className="w-1/2 rounded-full border border-slate-300 bg-white py-3 font-medium text-slate-800"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-1/2 rounded-full bg-blue-700 text-white py-3 font-medium hover:bg-blue-800 transition disabled:opacity-60"
                >
                  {loading ? "Verificando..." : "Confirmar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
