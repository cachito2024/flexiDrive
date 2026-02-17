import { Outlet } from "react-router-dom"

const ClienteLayout = () => {
    return (
        <div className="flex min-h-screen">

            {/* Menú */}
            <aside className="w-64 bg-blue-900 text-white p-4">
                <h2 className="text-xl font-bold mb-4">Cliente</h2>
                <ul className="space-y-2">
                    <li>Dashboard</li>
                    <li>Crear Envío</li>
                    <li>Historial</li>
                    <li>Perfil</li>
                </ul>
            </aside>

            {/* Contenido */}
            <main className="flex-1 p-6">
                <Outlet />
            </main>

        </div>
    )
}

export default ClienteLayout