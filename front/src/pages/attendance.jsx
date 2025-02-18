import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

const Attendance = () => {
  const [course, setCourse] = useState("");
  const [qrValue, setQrValue] = useState("");
  const [saved, setSaved] = useState(false);

  const generateQRCode = async () => {
    if (!course) return;
    
    const presenceUrl = `${window.location.origin}/confirm?course=${encodeURIComponent(course)}`;
    setQrValue(presenceUrl);
  
    const email = localStorage.getItem("email"); // On récupère l'email du professeur
  
    try {
      const response = await fetch("http://localhost:8000/generate_qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, course, qr_value: presenceUrl })
      });
  
      const data = await response.json();
      
      if (response.ok) {
        setSaved(true);
      } else {
        console.error("Erreur:", data.detail);
      }
    } catch (error) {
      console.error("Erreur serveur :", error);
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-black">
      <div className="bg-white p-6 rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-semibold mb-4">Générer un QR Code de Présence</h2>
        <input
          type="text"
          placeholder="Nom du cours"
          value={course}
          onChange={(e) => setCourse(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md text-black mb-4"
        />
        <button
          onClick={generateQRCode}
          className="w-full p-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Générer QR Code
        </button>

        {qrValue && (
          <div className="mt-6 text-center">
            <p className="text-lg font-semibold mb-2">Scannez ce QR Code :</p>
            <QRCodeCanvas value={qrValue} size={200} />
            
            <div className="mt-4">
              <p className="text-gray-700">Ou cliquez sur ce lien :</p>
              <a
                href={qrValue}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                {qrValue}
              </a>
            </div>

            {saved && (
              <p className="text-green-600 mt-4">QR Code enregistré avec succès ! ✅</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;
