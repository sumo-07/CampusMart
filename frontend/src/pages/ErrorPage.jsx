import { useRouteError, isRouteErrorResponse, Link, useNavigate } from "react-router-dom";
import { FaHome, FaShoppingBag, FaArrowLeft, FaExclamationTriangle } from "react-icons/fa";
import logo from "../images/logo.jpg";
import "../components/css/errorPage.css";

export const ErrorPage = () => {
    const error = useRouteError();
    const navigate = useNavigate();

    let statusCode = 404;
    let title = "Page Not Found";
    let message = "The page you're looking for doesn't exist, was moved, or the link may be broken.";
    let isNotFound = true;

    if (isRouteErrorResponse(error)) {
        statusCode = error.status;
        isNotFound = error.status === 404;
        if (error.status === 404) {
            title = "LOST IN THE SAUCE 💀";
            message = error.data?.message || "Page went ghost. Major skill issue, or maybe this link is just completely cooked.";
        } else if (error.status === 401) {
            title = "NO CLEARANCE HOMIE 🔒";
            message = "You don't have the clearance for this page yet. Lock in and log in with your credentials.";
        } else if (error.status === 503) {
            title = "SERVERS ARE NAPPING 😴";
            message = "Our servers are taking a quick power nap. Check back in a few seconds!";
        } else {
            title = error.statusText || "SOMETHING BROKE FR 💥";
            message = error.data?.message || "We hit a weird glitch in the matrix while fetching this drop.";
        }
    } else if (error instanceof Error) {
        statusCode = 500;
        isNotFound = false;
        title = "ENGINEERING SKILL ISSUE 🛠️";
        message = error.message || "An unexpected error occurred while loading this page. Our devs are cooking a fix.";
    }

    return (
        <div className="error-page-wrapper">
            {/* Top Navigation Bar */}
            <header className="error-page-header">
                <Link to="/" className="error-brand-link">
                    <img src={logo} alt="Cartsy Logo" className="error-brand-logo" />
                    <span className="error-brand-name">CARTSY</span>
                </Link>
                <Link to="/" className="btn btn-outline error-header-btn">
                    <FaHome style={{ marginRight: "0.5rem" }} /> Base Camp
                </Link>
            </header>

            {/* Centered Error Card */}
            <main className="error-page-content">
                <div className="error-card">
                    <div className="neo-badge pink" style={{ marginBottom: "1.2rem" }}>
                        <FaExclamationTriangle style={{ marginRight: "6px" }} />
                        <span>{isNotFound ? "404 • SKILL ISSUE" : `ERROR ${statusCode}`}</span>
                    </div>

                    <h1 className="error-code">{statusCode}</h1>
                    <h2 className="error-title">{title}</h2>
                    <p className="error-description">{message}</p>

                    <div className="error-actions">
                        <button onClick={() => navigate(-1)} className="btn btn-outline" type="button">
                            <FaArrowLeft style={{ marginRight: "0.5rem" }} /> Fall Back
                        </button>
                        <Link to="/" className="btn btn-primary">
                            <FaHome style={{ marginRight: "0.5rem" }} /> Base Camp
                        </Link>
                        <Link to="/product" className="btn btn-pink">
                            <FaShoppingBag style={{ marginRight: "0.5rem" }} /> Cop Drip 🔥
                        </Link>
                    </div>

                    {/* Developer diagnostics toggle in development mode */}
                    {import.meta.env.DEV && error && (
                        <details className="error-details">
                            <summary>Developer Error Details</summary>
                            <pre>
                                {error.stack || (typeof error === "object" ? JSON.stringify(error, null, 2) : String(error))}
                            </pre>
                        </details>
                    )}
                </div>
            </main>
        </div>
    );
};