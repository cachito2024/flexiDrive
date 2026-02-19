import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function ClienteLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-4 py-10">
        <Outlet />
      </main>
    </div>
  );
}
