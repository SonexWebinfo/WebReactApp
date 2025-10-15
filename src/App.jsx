import { useLocation } from "react-router-dom";
import Layout from "./layouts/Layout";
import { ToastContainer } from "react-toastify";

import AppRoutes from "./router/AppRoutes";

function App() {
  const location = useLocation();

  const isAuthPath =
    location.pathname.startsWith("/auth") ||
    location.pathname.startsWith("/error") ||
    location.pathname.startsWith("/under-maintenance") ||
    location.pathname === "/";

  console.log("PATH 👉", location.pathname, "AUTH?", isAuthPath);

  return (
    <>
      {isAuthPath ? (
        // Auth pages → No Layout
        <AppRoutes />
      ) : (
        // Main app → With Layout
        <Layout>
          <AppRoutes />
        </Layout>
      )}
      <ToastContainer />
    </>
  );
}

export default App;
