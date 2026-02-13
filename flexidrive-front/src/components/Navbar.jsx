import { ChevronDown } from "lucide-react";
import logo from "../assets/color-logo.png";

export default function Navbar() {
  return (
    <header className="w-full bg-white border-b">
      <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center">
          <img src={logo} alt="FlexiDrive" className="h-12 max-w-[160px] object-contain" />
        </div>

        {/* Menú */}
        <nav className="flex-1 flex items-center gap-10 text-slate-500">
          <a className="hover:text-slate-900" href="#">Inicio</a>

          <a className="font-semibold text-blue-700" href="#">
            Novedades
          </a>

          <button className="flex items-center gap-1 hover:text-slate-900">
            Usuarios <ChevronDown size={16} />
          </button>

          <a className="hover:text-slate-900" href="#">Quiénes somos</a>
        </nav>

        {/* Idioma */}
        <div className="text-xs text-slate-500">ARG - ES</div>
      </div>
    </header>
  );
}
