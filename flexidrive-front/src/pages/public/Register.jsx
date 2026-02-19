import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import heroImg from "../../assets/hero.svg";
import { register } from "../../services/authService";

export default function Register() {
  const navigate = useNavigate();

  // form
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dni, setDni] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [rol, setRol] = useState("cliente"); // cliente | comisionista | admin (si corresponde)

  // ui
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // totp setup
  const [otpauthUrl, setOtpauthUrl] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");

  const payload = useMemo(
    () => ({
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      email: email.trim(),
      password,
      dni: Number(dni),
      telefono: String(telefono).trim(),
      fecha_nacimiento: fechaNacimiento, // OJO: tu back usa fecha_nacimiento
      rol, // en tu doc aparece como string (“cliente”, “comisionista”, “admin”)
    }),
    [nombre, apellido, email, password, dni, telefono, fechaNacimiento, rol]
  );

  useEffect(() => {
    if (!otpauthUrl) return;
    QRCode.toDataURL(otpauthUrl)
      .then(setQrDataUrl)
      .catch(() => setError("No se pudo generar el QR."));
  }, [otpauthUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // validaciones mínimas front (el back valida igual)
    if (!/^\d+$/.test(String(telefono))) {
      setLoading(false);
      setError("El teléfono debe tener solo números (sin +, espacios ni guiones).");
      return;
    }

    try {
      const data = await register(payload);

      // lo importante para TOTP
      if (data?.otpauthUrl) {
        setOtpauthUrl(data.otpauthUrl);
        return;
      }

      // si tu back en vez de otpauthUrl devuelve otra cosa:
      setError("Registro ok, pero el servidor no devolvió otpauthUrl para configurar TOTP.");
    } catch (err) {
      setError(err?.message || "Error al registrarte.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-slate-50">
      <section className="bg-slate-100/60">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-4 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-12 items-start">
            {/* IZQUIERDA */}
            <div className="lg:col-span-5">
              <h1 className="font-organetto text-xl sm:text-2xl font-extrabold tracking-tight text-blue-700 leading-10">
                CREÁ TU CUENTA <br /> EN FLEXIDRIVE
              </h1>

              <p className="mt-5 text-slate-700 max-w-md font-medium">
                Completá tus datos. Al finalizar, vas a escanear un QR para activar tu código TOTP.
              </p>

              <div className="mt-8 hidden lg:flex justify-start">
                <img
                  src={heroImg}
                  alt="FlexiDrive"
                  className="w-full max-w-[520px] object-contain"
                />
              </div>
            </div>

            {/* DERECHA - CARD */}
            <div className="lg:col-span-7">
              <div className="bg-slate-100/80 border border-slate-300 rounded-2xl p-7">
                {error ? (
                  <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}

                {/* Si ya tenemos otpauthUrl -> mostrar QR */}
                {otpauthUrl ? (
                  <div className="rounded-2xl bg-white border border-slate-200 p-6">
                    <h2 className="text-lg font-semibold text-slate-900">
                      Activá tu verificación (TOTP)
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">
                      Escaneá este QR con Google Authenticator. Después volvé a iniciar sesión.
                    </p>

                    <div className="mt-5 flex justify-center">
                      {qrDataUrl ? (
                        <img
                          src={qrDataUrl}
                          alt="QR TOTP"
                          className="w-48 h-48"
                        />
                      ) : (
                        <div className="text-sm text-slate-600">Generando QR...</div>
                      )}
                    </div>

                    <div className="mt-5 flex flex-col sm:flex-row gap-3">
                      <button
                        type="button"
                        onClick={() => navigate("/auth/login")}
                        className="w-full inline-flex items-center justify-center rounded-full bg-blue-700 text-white py-3.5 font-medium hover:bg-blue-800 transition"
                      >
                        Ya lo escaneé → Ir a Login
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setOtpauthUrl("");
                          setQrDataUrl("");
                        }}
                        className="w-full inline-flex items-center justify-center rounded-full border border-slate-300 bg-white py-3.5 font-medium text-slate-800"
                      >
                        Volver al formulario
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-700 mb-2">Nombre</label>
                      <input
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        required
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-slate-700 mb-2">Apellido</label>
                      <input
                        value={apellido}
                        onChange={(e) => setApellido(e.target.value)}
                        required
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm text-slate-700 mb-2">Email</label>
                      <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        required
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm text-slate-700 mb-2">Contraseña</label>
                      <input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type="password"
                        required
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-slate-700 mb-2">DNI</label>
                      <input
                        value={dni}
                        onChange={(e) => setDni(e.target.value)}
                        inputMode="numeric"
                        required
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-slate-700 mb-2">Teléfono</label>
                      <input
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        inputMode="numeric"
                        placeholder="549353..."
                        required
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 outline-none"
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        Solo números. Ej: 54 + 9 + 353 + número.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm text-slate-700 mb-2">Fecha de nacimiento</label>
                      <input
                        value={fechaNacimiento}
                        onChange={(e) => setFechaNacimiento(e.target.value)}
                        type="date"
                        required
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-slate-700 mb-2">Rol</label>
                      <select
                        value={rol}
                        onChange={(e) => setRol(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 outline-none"
                      >
                        <option value="cliente">Cliente</option>
                        <option value="comisionista">Comisionista</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="mt-2 w-full inline-flex items-center justify-center rounded-full bg-blue-700 text-white py-3.5 font-medium shadow-sm hover:bg-blue-800 transition disabled:opacity-60"
                      >
                        {loading ? "Creando cuenta..." : "Crear cuenta"}
                      </button>

                      <div className="mt-4 text-center text-sm text-slate-700">
                        ¿Ya tenés cuenta?{" "}
                        <Link to="/auth/login" className="text-blue-700 font-medium hover:underline">
                          Iniciá sesión
                        </Link>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
