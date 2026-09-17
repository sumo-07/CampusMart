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
            title = "Page Not Found";
            message = error.data?.message || "The page you are looking for could not be found.";
        } else if (error.status === 401) {
            title = "Access Denied";
            message = "You are not authorized to view this page. Please log in with the correct credentials.";
        } else if (error.status === 503) {
            title = "Service Unavailable";
            message = "Our servers are momentarily unavailable. Please check back in a few moments.";
        } else {
            title = error.statusText || "Unexpected Routing Error";
            message = error.data?.message || "Something went wrong while processing your request.";
        }
    } else if (error instanceof Error) {
        statusCode = 500;
        isNotFound = false;
        title = "Application Error";
        message = error.message || "An unexpected error occurred while loading this page.";
    }

    return (
        <div className="error-page-wrapper">
            {/* Top Navigation Bar */}
            <header className="error-page-header">
                <Link to="/" className="error-brand-link">
                    <img src={logo} alt="CampusMart Logo" className="error-brand-logo" />
                    <span className="error-brand-name">CampusMart</span>
                </Link>
                <Link to="/" className="btn btn-outline error-header-btn">
                    <FaHome style={{ marginRight: "0.5rem" }} /> Home
                </Link>
            </header>

            {/* Centered Error Card */}
            <main className="error-page-content">
                <div className="error-card">
                    <div className={`error-badge ${isNotFound ? "error-badge-404" : ""}`}>
                        <FaExclamationTriangle />
                        <span>{isNotFound ? "404 Not Found" : `Error ${statusCode}`}</span>
                    </div>

                    <h1 className="error-code">{statusCode}</h1>
                    <h2 className="error-title">{title}</h2>
                    <p className="error-description">{message}</p>

                    <div className="error-actions">
                        <button onClick={() => navigate(-1)} className="btn btn-outline" type="button">
                            <FaArrowLeft style={{ marginRight: "0.5rem" }} /> Go Back
                        </button>
                        <Link to="/" className="btn btn-primary">
                            <FaHome style={{ marginRight: "0.5rem" }} /> Back to Home
                        </Link>
                        <Link to="/product" className="btn btn-outline">
                            <FaShoppingBag style={{ marginRight: "0.5rem" }} /> Explore Products
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