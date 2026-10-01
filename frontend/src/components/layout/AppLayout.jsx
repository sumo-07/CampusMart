import { Outlet } from "react-router-dom";
import { Header } from "../UI/Header";
import { Footer } from "../UI/Footer";
import { ScrollToTop } from "../common/ScrollToTop";
export const AppLayout = () => {
    return (
        <div className="app-layout">
            <ScrollToTop />
            <Header />
            <main className="app-main">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};