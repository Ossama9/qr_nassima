import { useRouter } from "next/router";

export default function Navbar() {
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_role");
        router.push("/login"); // Redirige vers la page de connexion après déconnexion
    };

    return (
        <nav className="flex justify-between items-center bg-blue-600 text-white p-4">
            <h1 className="text-xl font-bold">🎓 Gestion de Présence</h1>
            <button
                onClick={handleLogout}
                className="bg-red-500 px-4 py-2 rounded hover:bg-red-700 transition"
            >
                🚪 Logout
            </button>
        </nav>
    );
}