import "@/styles/globals.css";
import Navbar from "@/components/Navbar"; // 🔥 Importation du Navbar

export default function App({ Component, pageProps }) {
    return (
        <>
            <Navbar /> {/* 🚀 Navbar affiché sur toutes les pages */}
            <Component {...pageProps} />
        </>
    );
}
