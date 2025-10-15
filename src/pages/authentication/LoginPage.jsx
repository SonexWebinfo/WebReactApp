import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./page-auth.css";
import { api } from "../../services/api";
import { AuthWrapper } from "./AuthWrapper";
import { Helmet } from "react-helmet-async";
import { toast } from 'react-toastify';

export const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 🔑 new: ref for email input
  const emailRef = useRef(null);

  // 🔑 new: focus input before paint (no flicker)
  useEffect(() => {
    if (emailRef.current) {
      emailRef.current.focus();
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error("Please fill in both fields.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/api/login", formData, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      const data = response.data;

      toast.success("Login successfull! Redirecting...");

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Login error:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Invalid login credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthWrapper>
      <Helmet>
        <title>ERP | User Login</title>
      </Helmet>
      <h4 className="mb-2 text-center">Welcome to 3Stage! 👋</h4>
      <p className="mb-4">
        Please sign in to your account and start the adventure
      </p>

      <form id="formAuthentication" className="mb-3" onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">
            Email or Username
          </label>
          <input
            type="text"
            ref={emailRef}  
            className="form-control"
            id="email"
            value={formData.email}
            onChange={handleChange}
            name="email"
            placeholder="Enter your email or username"
          />
        </div>
        

        <div className="mb-3 form-password-toggle">
          <div className="d-flex justify-content-between">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <Link
              aria-label="Go to Forgot Password Page"
              to="/auth/forgot-password"
            >
              <small>Forgot Password?</small>
            </Link>
          </div>
          <div className="input-group input-group-merge">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="true"
              id="password"
              value={formData.password}
              onChange={handleChange}
              className="form-control"
              name="password"
              placeholder="••••••••"
              aria-describedby="password"
            />
            <span
              className="input-group-text cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁️"}
            </span>
          </div>
        </div>
        <div className="mb-3">
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id="remember-me"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
            />
            <label className="form-check-label" htmlFor="remember-me">
              {" "}
              Remember Me{" "}
            </label>
          </div>
        </div>
        <div className="mb-3">
          <button
            aria-label="Click me"
            className="btn btn-primary d-grid w-100"
            type="submit"
            disabled={loading} // Disable button when loading
          >
            {loading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span> 
              </>
            ) : (
              "Login"
            )}
          </button>
        </div>
      </form>

      <p className="text-center">
        <span>New on our platform? </span>
        <Link
          aria-label="Go to Register Page"
          to="/auth/register"
          className="registration-link"
        >
          <span>Create an account</span>
        </Link>
      </p>
    </AuthWrapper>
  );
};
