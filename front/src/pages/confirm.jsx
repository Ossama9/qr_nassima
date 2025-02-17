import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const ConfirmPresence = () => {
  const router = useRouter();
  const { course } = router.query;
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("email"); // On récupère l'email stocké lors de la connexion

    if (!token) {
      router.push("/login");
      return;
    }

    if (!email) {
      setError("Aucun email trouvé. Veuillez vous reconnecter.");
      return;
    }

    if (!course) {
      setError("Aucun cours détecté.");
      return;
    }
    
    // Envoyer la confirmation de présence
    fetch("http://localhost:8000/confirm_attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, course }) // On envoie l'email et le cours dans le body
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) throw new Error(data.message || "Erreur d'enregistrement de présence.");
        setConfirmed(true);
      })
      .catch((err) => setError(err.message));
  }, [course, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-semibold mb-4">Confirmation de Présence</h2>

        {error && <p className="text-red-600 text-lg font-semibold">❌ {error}</p>}

        {confirmed && (
          <p className="text-green-600 text-lg font-semibold">
            ✅ Présence confirmée pour le cours : <span className="font-bold">{course}</span>
          </p>
        )}

        {!confirmed && !error && <p className="text-gray-600">⏳ Validation en cours...</p>}
      </div>
    </div>
  );
};

export default ConfirmPresence;
