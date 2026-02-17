import { Outlet } from "react-router-dom";

const ComisionistaLayout = () => {
  return (
    <div className="flex min-h-screen">
      
      {/* Menú */}
      <aside className="w-64 bg-green-900 text-white p-4">
        <h2 className="text-xl font-bold mb-4">Comisionista</h2>
        <ul className="space-y-2">
          <li>Dashboard</li>
          <li>Envíos disponibles</li>
          <li>Ganancias</li>
          <li>Perfil</li>
        </ul>
      </aside>

      {/* Contenido */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>

    </div>
  );
};

export default ComisionistaLayout;
