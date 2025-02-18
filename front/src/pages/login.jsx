import { useState } from "react";
import { useRouter } from "next/router";

const Login = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Échec de la connexion");

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("email", formData.email);
      localStorage.setItem("role", data.role);
      router.push("/dashboard");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-200">
      <div className="w-full max-w-md p-6 bg-white shadow-md rounded-lg">
        <h2 className="text-2xl font-semibold text-center mb-4">Connexion</h2>
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required className="w-full p-3 border border-gray-300 rounded-md text-black" />
          <input type="password" name="password" placeholder="Mot de passe" value={formData.password} onChange={handleChange} required className="w-full p-3 border border-gray-300 rounded-md text-black" />
          <button type="submit" disabled={loading} className="w-full p-3 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
        <p className="mt-4 text-center text-black">
          Pas encore de compte ? <a href="/register" className="text-blue-600">Inscrivez-vous</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
