const handleLogout = () => {
    localStorage.removeItem("access_token");  // Supprime le token du stockage local
    localStorage.removeItem("user_role");  // Supprime le rôle de l'utilisateur
    window.location.href = "/login"; // Redirige vers la page de connexion
};
