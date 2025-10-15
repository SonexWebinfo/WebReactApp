import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import getGreetingMessage from "../utils/greetingHandler";

const Navbar = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Guest");
  const [time, setTime] = useState("");

  // Fetch user details from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (storedUser && token) {
      const user = JSON.parse(storedUser);
      setUserName(user.name || "Guest");
    } else {
      navigate("/auth/login"); // Redirect if no token
    }
  }, []);

  // Update time every second
  useEffect(() => {
    const updateTime = () => {
      const indiaTime = new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).format(new Date());

      setTime(indiaTime);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/auth/login");
  };

  return (
    <nav
      className="layout-navbar container-xxl navbar navbar-expand-xl navbar-detached align-items-center bg-navbar-theme"
      id="layout-navbar"
    >
      <div className="layout-menu-toggle navbar-nav align-items-xl-center me-3 me-xl-0 d-xl-none">
        <a
          aria-label="toggle for sidebar"
          className="nav-item nav-link px-0 me-xl-4"
          href="#"
        >
          <i className="bx bx-menu bx-sm"></i>
        </a>
      </div>

      <div
        className="navbar-nav-right d-flex align-items-center"
        id="navbar-collapse"
      >
        <ul className="navbar-nav flex-row ms-3">

          <li className="nav-item navbar-dropdown dropdown-user dropdown">
            <a
              aria-label="dropdown profile avatar"
              className="nav-link dropdown-toggle hide-arrow"
              href="#"
              data-bs-toggle="dropdown"
              title="Create New"
            >
              <div className="avatar">
                <img
                  src="../assets/img/avatars/add-icon.png"
                  className="w-px-38 h-auto rounded-circle"
                  alt="avatar-image"
                />
              </div>
            </a>
            <ul className="dropdown-menu dropdown-menu-left">

              <li>
                <a className="dropdown-item" href="#">
                  <span className="align-middle fw-semibold">Estimate</span>
                </a>
              </li>
              <li>
                <a className="dropdown-item" href="#">
                  <span className="align-middle fw-semibold">Sales</span>
                </a>
              </li>
              <li>
                <a className="dropdown-item" href="#">
                  <span className="align-middle fw-semibold">Purchase</span>
                </a>
              </li>
              <li>
                <a className="dropdown-item" href="#">
                  <span className="align-middle fw-semibold">Customer</span>
                </a>
              </li>

            </ul>
          </li>
        </ul>
        <span className="me-4 ms-4 fw-bold">

          {getGreetingMessage(userName)}</span>

        <div className="p-2 bg-white rounded shadow text-center text-primary text-sm fw-semibold me-4">
          🕒 {time}
        </div>



        <ul className="navbar-nav flex-row align-items-center ms-auto">

          <li className="nav-item navbar-dropdown dropdown-user dropdown">
            <a
              aria-label="dropdown profile avatar"
              className="nav-link dropdown-toggle hide-arrow"
              href="#"
              data-bs-toggle="dropdown"
            >
              <div className="avatar avatar-online">
                <img
                  src="../assets/img/avatars/1.png"
                  className="w-px-40 h-auto rounded-circle"
                  alt="avatar-image"
                />
              </div>
            </a>
            <ul className="dropdown-menu dropdown-menu-end">
              <li>
                <a className="dropdown-item" href="#">
                  <div className="d-flex">
                    <div className="flex-shrink-0 me-3">
                      <div className="avatar avatar-online">
                        <img
                          src="../assets/img/avatars/1.png"
                          className="w-px-40 h-auto rounded-circle"
                          alt="avatar-image"
                        />
                      </div>
                    </div>
                    <div className="flex-grow-1">
                      <span className="fw-medium d-block">{userName}</span>
                      <small className="text-muted">Admin</small>
                    </div>
                  </div>
                </a>
              </li>
              <li>
                <div className="dropdown-divider"></div>
              </li>
              <li>
                <a className="dropdown-item" href="#">
                  <i className="bx bx-user me-2"></i>
                  <span className="align-middle">My Profile</span>
                </a>
              </li>
              <li>
                <a className="dropdown-item" href="#">
                  <i className="bx bx-cog me-2"></i>
                  <span className="align-middle">Settings</span>
                </a>
              </li>
              <li>
                <a className="dropdown-item" href="#">
                  <span className="d-flex align-items-center align-middle">
                    <i className="bx bx-credit-card me-2"></i>
                    <span className="flex-grow-1 ms-1">Billing</span>
                    <span className="badge bg-danger rounded-pill">4</span>
                  </span>
                </a>
              </li>
              <li>
                <div className="dropdown-divider"></div>
              </li>
              <li>
                <button className="dropdown-item" onClick={handleLogout}>
                  <i className="bx bx-power-off me-2"></i>
                  <span className="align-middle">Log Out</span>
                </button>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
