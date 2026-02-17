import { Link } from "react-router-dom";
import { Clock, Truck, Sparkles } from "lucide-react";
import heroImg from "../../assets/hero.svg";

export default function Home() {


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
                <label className="block text-base text-slate-700 mb-2">
                  Usuario o email
                </label>
                <input className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 outline-none" />

                <label className="block text-base text-slate-700 mt-6 mb-2">
                  Contraseña
                </label>
                <input className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 outline-none" type="password" />

                <div className="mt-4 text-right">
                  <Link to="/auth/forgot" className="text-sm text-blue-700 hover:underline">
                    Olvidé mi contraseña
                  </Link>
                </div>

                <Link
                  to="/auth/login"
                  className="mt-5 w-full inline-flex items-center justify-center rounded-full bg-blue-700 text-white py-3.5 font-medium shadow-sm hover:bg-blue-800 transition"
                >
                  Iniciar sesión
                </Link>

                <button
                  type="button"
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white py-3.5 font-medium text-slate-800"
                >
                  <span className="text-lg">G</span>
                  Iniciar sesión con Google
                </button>

                <div className="mt-6 text-center text-sm text-slate-700">
                  ¿No tenés cuenta?{" "}
                  <Link to="/auth/register" className="text-blue-700 font-medium hover:underline">
                    Registrate
                  </Link>
                </div>
              </div>
            </div>

          </div>

          {/* CARDS ABAJO (más parecidas al boceto) */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-slate-100/80 border border-slate-300 rounded-2xl p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl border border-slate-300 bg-white flex items-center justify-center">
                <Clock className="w-6 h-6 text-slate-800" />
              </div>
              <div className="text-xl font-semibold text-blue-700">Envíos rápidos</div>
            </div>

            <div className="bg-slate-100/80 border border-slate-300 rounded-2xl p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl border border-slate-300 bg-white flex items-center justify-center">
                <Truck className="w-6 h-6 text-slate-800" />
              </div>
              <div className="text-xl font-semibold text-blue-700">Envíos flexibles</div>
            </div>

            <div className="bg-slate-100/80 border border-slate-300 rounded-2xl p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl border border-slate-300 bg-white flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-slate-800" />
              </div>
              <div className="text-xl font-semibold text-blue-700">Optimización con IA</div>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}

function FeatureCard({ icon, title }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl border border-slate-200 flex items-center justify-center text-slate-800">
        {icon}
      </div>
      <div className="text-lg font-semibold text-blue-700 leading-tight">
        {title}
      </div>
    </div>
  );
}
