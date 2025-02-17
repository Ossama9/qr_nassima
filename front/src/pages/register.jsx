import { useState } from "react";
import { useRouter } from "next/router";

const Register = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
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
      const res = await fetch("http://localhost:8000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Échec de l'inscription");

      router.push("/login");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-6 bg-white shadow-md rounded-lg">
        <h2 className="text-2xl font-semibold text-center mb-4">Inscription</h2>
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" name="name" placeholder="Nom" value={formData.name} onChange={handleChange} required className="w-full p-3 border border-gray-300 rounded-md text-black" />
          <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required className="w-full p-3 border border-gray-300 rounded-md text-black" />
          <input type="password" name="password" placeholder="Mot de passe" value={formData.password} onChange={handleChange} required className="w-full p-3 border border-gray-300 rounded-md text-black" />
          <button type="submit" disabled={loading} className="w-full p-3 bg-green-600 text-white rounded-md hover:bg-green-700">
            {loading ? "Inscription..." : "S'inscrire"}
          </button>
        </form>
        <p className="mt-4 text-center text-black">
          Déjà un compte ? <a href="/login" className="text-blue-600">Connectez-vous</a>
        </p>
      </div>
    </div>
  );
};

export default Register;
