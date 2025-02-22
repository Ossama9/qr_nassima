import { useEffect, useState } from "react";

const Dashboard = () => {
    const [role, setRole] = useState(null);
    const [qrCodes, setQrCodes] = useState([]);
    const [presences, setPresences] = useState([]);
    const [absences, setAbsences] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [selectedTab, setSelectedTab] = useState("presences"); // Ajout d'onglets

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userRole = localStorage.getItem("role");
        const email = localStorage.getItem("email");
        const token = localStorage.getItem("token");

        if (!userRole || !email || !token) {
            alert("Vous devez être connecté.");
            return;
        }

        setRole(userRole);

        // 📌 Récupérer les QR Codes du professeur
        if (userRole === "teacher") {
            fetch(`http://localhost:8000/qrcodes/${email}`, {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
            })
                .then((res) => res.json())
                .then((data) => {
                    setQrCodes(data);
                })
                .catch((error) => console.error("Erreur lors de la récupération des QR Codes :", error));
        }


        // 📌 Récupérer les QR Codes du professeur
        if (userRole === "student") {
            // fetch(`http://localhost:8000/attendances/${email}`, {
            //     method: "GET",
            //     headers: { Authorization: `Bearer ${token}` },
            // })
            //     .then((res) => res.json())
            //     .then((data) => {
            //         setPresences(data);
            //     })
            //     .catch((error) => console.error("Erreur lors de la récupération des QR Codes :", error));
            fetch(`http://localhost:8000/available_qrcodes`, {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
            })
                .then((res) => res.json())
                .then((data) => {
                    setQrCodes(data);
                })
                .catch((error) => console.error("Erreur lors de la récupération des QR Codes :", error));

            // 📌 Récupérer les présences de l'étudiant
            fetch(`http://localhost:8000/attendances/${email}`, {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
            })
                .then((res) => res.json())
                .then((data) => {
                    console.log("📋 Présences récupérées :", data); // 🔍 Vérifier si les données arrivent
                    setPresences(data);
                })
                .catch((error) => console.error("❌ Erreur lors de la récupération des présences :", error));
        }

        setLoading(false);
    }, []);

    // 📌 Fonction pour récupérer les présences d'un cours
    const fetchPresences = (course) => {
        setSelectedCourse(course);
        fetch(`http://localhost:8000/attendance/${course}`)
            .then((res) => res.json())
            .then((data) => {
                setPresences(data);
                setAbsences([]);
            })
            .catch((error) => console.error("Erreur lors de la récupération des présences :", error));
    };

    // 📌 Fonction pour récupérer les absents d'un cours
    const fetchAbsences = (course) => {
        setSelectedCourse(course);
        fetch(`http://localhost:8000/absentees`)
            .then((res) => res.json())
            .then((data) => {
                setAbsences(data.filter(absent => absent.course === course));
                setPresences([]);
            })
            .catch((error) => console.error("Erreur lors de la récupération des absences :", error));
    };

    // Fonction pour récupérer les QR Codes disponibles pour les étudiants
    const fetchQrCodes = () => {
        const token = localStorage.getItem("token");

        fetch(`http://localhost:8000/qrcodes`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                setQrCodes(data);
            })
            .catch((error) => console.error("Erreur lors de la récupération des QR Codes :", error));
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-900">
            <div className="bg-white p-8 rounded-2xl shadow-lg text-center w-full max-w-3xl border border-gray-200">
                <h2 className="text-2xl font-semibold mb-4">Dashboard</h2>

                {loading && <p className="text-gray-600">Chargement en cours...</p>}

                {role === "teacher" && (
                    <div>
                        <h3 className="text-lg font-semibold mb-4">📌 Mes QR Codes générés</h3>
                        <p className="text-blue-600 underline cursor-pointer mb-4">
                            <a href="/attendance">Créer un nouveau QR Code</a>
                        </p>

                        {qrCodes.length > 0 ? (
                            <ul className="list-none text-left">
                                {qrCodes.map((qr, index) => (
                                    <li key={index} className="text-gray-700 mb-4 p-3 border border-gray-300 rounded-md">
                                        <strong>{qr.course}</strong>
                                        <div className="mt-2">
                                            <a href={qr.qr_value} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                                                Voir QR Code
                                            </a>
                                        </div>
                                        <div className="mt-2 flex gap-2">
                                            <button
                                                onClick={() => fetchPresences(qr.course)}
                                                className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
                                            >
                                                Voir Présences
                                            </button>
                                            <button
                                                onClick={() => fetchAbsences(qr.course)}
                                                className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
                                            >
                                                Voir Absences
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-600">Aucun QR Code généré.</p>
                        )}
                    </div>
                )}

                {role === "student" && (
                    <>
                        <div className="flex gap-4 mb-6">
                            <button
                                className={`px-4 py-2 rounded-lg ${selectedTab === "presences" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                                onClick={() => setSelectedTab("presences")}
                            >📌 Mes Présences</button>
                            <button
                                className={`px-4 py-2 rounded-lg ${selectedTab === "qrcodes" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                                onClick={() => setSelectedTab("qrcodes")}
                            >📷 Scanner un QR Code / Marquer presence</button>
                        </div>
                        {selectedTab === "presences" && (
                            <div>
                                <h3 className="text-lg font-semibold mb-4">✅ Mes Présences</h3>
                                {presences.length > 0 ? (
                                    <table className="w-full border-collapse border border-gray-300">
                                        <thead>
                                            <tr className="bg-blue-600 text-white">
                                                <th className="border border-gray-300 p-2">Cours</th>
                                                <th className="border border-gray-300 p-2">Dates de présence</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(
                                                presences.reduce((acc, presence) => {
                                                    acc[presence.course] = acc[presence.course] || [];
                                                    acc[presence.course].push(presence.timestamp);
                                                    return acc;
                                                }, {})
                                            ).map(([course, dates]) => (
                                                <tr key={course} className="border border-gray-300">
                                                    <td className="p-2 border border-gray-300 font-semibold">{course}</td>
                                                    <td className="p-2 border border-gray-300">
                                                        {dates.map((date, index) => (
                                                            <p key={index} className="text-gray-700">{new Date(date).toLocaleString()}</p>
                                                        ))}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p className="text-gray-600">Aucune présence enregistrée.</p>
                                )}
                            </div>
                        )}

                        {selectedTab === "qrcodes" && (
                            <div>
                                <h3 className="text-lg font-semibold mb-4">📷 Scanner un QR Code</h3>
                                {qrCodes.length > 0 ? (
                                    <ul className="grid gap-4">
                                        {qrCodes.map((qr, index) => (
                                            <li key={index} className="p-4 bg-gray-100 rounded-lg shadow-sm border border-gray-300">
                                                <strong className="block text-lg">{qr.course}</strong>
                                                <a
                                                    href={qr.qr_value}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 underline flex items-center mt-2"
                                                >
                                                    📷 Voir QR Code
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-gray-600">Aucun QR Code disponible.</p>
                                )}
                            </div>
                        )}
                    </>

                )}

                {selectedCourse && (
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-2">Détails du cours : {selectedCourse}</h3>

                        {presences.length > 0 && (
                            <div>
                                <h4 className="text-green-600 font-semibold">✅ Étudiants présents</h4>
                                <ul className="list-disc text-left">
                                    {presences.map((presence, index) => (
                                        <li key={index} className="text-gray-700">{presence.email}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {absences.length > 0 && (
                            <div>
                                <h4 className="text-red-600 font-semibold">❌ Étudiants absents</h4>
                                <ul className="list-disc text-left">
                                    {absences.map((absence, index) => (
                                        <li key={index} className="text-gray-700">{absence.email} ( absences)</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
