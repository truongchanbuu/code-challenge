import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SearchX, ArrowLeft, Home } from "lucide-react";

export default function NotFoundPage() {
  const navigate = useNavigate();
  useEffect(() => {
    document.title = "404 - Not Found";
  }, []);

  return (
    <div className="grid min-h-dvh place-items-center p-6">
      <div className="card bg-base-100 border shadow">
        <div className="card-body items-center gap-4 text-center">
          <SearchX className="text-primary size-16" aria-hidden />
          <h1 className="text-3xl font-bold">Page not found</h1>
          <p className="text-base-content/70 max-w-md">
            The page you’re looking for doesn’t exist or has been moved.
          </p>
          <div className="flex gap-3">
            <button className="btn btn-primary" onClick={() => navigate(-1)}>
              <ArrowLeft className="size-4" />
              Back
            </button>
            <Link to="/" className="btn btn-outline">
              <Home className="size-4" />
              Home
            </Link>
          </div>
          <div className="text-base-content/60 text-xs">404</div>
        </div>
      </div>
    </div>
  );
}
