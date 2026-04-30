import { Outlet, useLocation } from "react-router-dom";
import { Header } from "../UI/Header";
import { Footer } from "../UI/Footer";
import { PageTransition } from "./PageTransition";
import { AnimatePresence } from "framer-motion";

export const AppLayout = () => {
    const location = useLocation();

    return (
        <>
            <Header />
            <AnimatePresence>
                <PageTransition key={location.pathname}>
                    <Outlet />
                </PageTransition>
            </AnimatePresence>
            <Footer />
        </>
    );
}