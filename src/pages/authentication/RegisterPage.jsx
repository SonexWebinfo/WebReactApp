import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios"; // Import Axios
import "./page-auth.css";
import { AuthWrapper } from "./AuthWrapper";
import { Helmet } from "react-helmet-async";

export const RegisterPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        password: '',
        terms: false,
    });

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const togglePasswordVisibility = () => {
        setShowPassword((prevShow) => !prevShow);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await axios.post("/api/register", formData);
            console.log("Registration successful:", response.data);
            alert("Registration successful!");
        } catch (err) {
            console.error("Registration error:", err.response?.data || err.message);
            setError(err.response?.data?.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthWrapper>
            <Helmet>
                <title>ERP | User Register</title>
            </Helmet>

            <h4 className="mb-2">Adventure starts here 🚀</h4>
            <p className="mb-4">Make your app management easy and fun!</p>

            {error && <div className="alert alert-danger">{error}</div>}

            <form id="formAuthentication" className="mb-3" onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label htmlFor="name" className="form-label">Name</label>
                    <input
                        type="text"
                        className="form-control"
                        id="name"
                        value={formData.name}
                        onChange={handleChange}
                        name="name"
                        placeholder="Enter your Name"
                        required
                    />
                </div>

                <div className="mb-3">
                    <label htmlFor="username" className="form-label">Username</label>
                    <input
                        type="text"
                        className="form-control"
                        id="username"
                        value={formData.username}
                        onChange={handleChange}
                        name="username"
                        placeholder="Enter your username"
                        required
                    />
                </div>

                <div className="mb-3">
                    <label htmlFor="email" className="form-label">Email</label>
                    <input
                        type="email"
                        className="form-control"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        required
                    />
                </div>

                <div className="mb-3 form-password-toggle">
                    <label className="form-label" htmlFor="password">Password</label>
                    <div className="input-group input-group-merge">
                        <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="form-control"
                            name="password"
                            placeholder="••••••••"
                            required
                        />
                        <span className="input-group-text cursor-pointer" onClick={togglePasswordVisibility}>
                            <i className={`bx ${showPassword ? "bx-show" : "bx-hide"}`}></i>
                        </span>
                    </div>
                </div>

                <div className="mb-3">
                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="terms-conditions"
                            name="terms"
                            checked={formData.terms}
                            onChange={handleChange}
                            required
                        />
                        <label className="form-check-label" htmlFor="terms-conditions">
                            I agree to
                            <a href="#"> privacy policy & terms</a>
                        </label>
                    </div>
                </div>

                <button
                    aria-label="Click me"
                    className="btn btn-primary d-grid w-100"
                    type="submit"
                    disabled={loading}
                >
                    {loading ? "Signing up..." : "Sign up"}
                </button>
            </form>

            <p className="text-center">
                <span>Already have an account?</span>
                <Link aria-label="Go to Login Page" to="/auth/login" className="d-flex align-items-center justify-content-center">
                    <i className="bx bx-chevron-left scaleX-n1-rtl bx-sm"></i>
                    Back to login
                </Link>
            </p>
        </AuthWrapper>
    );
};
