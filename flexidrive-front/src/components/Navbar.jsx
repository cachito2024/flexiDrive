import { Link, NavLink } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import logo from "../assets/color-logo.png";
import arFlag from "../assets/ar-flag.svg"
import useScrolled from "../hooks/useScrolled";

export default function Navbar() {
const scrolled = useScrolled(10);

  const base = "text-slate-500 hover:text-slate-900 transition";
  const active = "font-semibold text-blue-700";

  return (
    <header className={["sticky top-0 z-50 w-full border-b", "transition-all duration-300", scrolled
      ? "bg-white/80 backdrop-blur-md shadow-md border-slate-200"
      : "bg-white border-slate-200",
    ].join(" ")}
    >
      {/* FILA 1 — Idioma pegado al borde */}
      <div className="w-full px-4 h-8 flex items-center border-b border-slate-200">
        <div className="flex items-center text-xs text-slate-500">
          <img src={arFlag} alt="Argentina" className="w-4 h-4 mr-2" />
          <span>ARG - ES</span>

          <span className="mx-3 inline-block h-3 w-px bg-slate-300" />
          <button className="hover:text-slate-700">EN</button>
        </div>
      </div>

      {/* FILA 2 — Logo pegado + menú centrado */}
      <div className="relative w-full h-16 flex items-center px-4">
        {/* LOGO pegado al borde */}
        <Link to="/" className="flex items-center">
          <img
            src={logo}
            alt="FlexiDrive"
            className="h-20 object-contain"
          />
        </Link>

        {/* MENÚ centrado absoluto */}
        <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-10">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `${base} ${isActive ? active : ""}`}
          >
            Inicio
          </NavLink>

          <NavLink
            to="/novedades"
            className={({ isActive }) => `${base} ${isActive ? active : ""}`}
          >
            Novedades
          </NavLink>

          <button className={`${base} flex items-center gap-1`}>
            Usuarios <ChevronDown size={16} />
          </button>

          <NavLink
            to="/quienes-somos"
            className={({ isActive }) => `${base} ${isActive ? active : ""}`}
          >
            Quiénes somos
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
