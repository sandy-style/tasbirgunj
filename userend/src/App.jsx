import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { AuthProvider } from "./context/AuthContext";
import { AppProvider } from "./context/AppContext";

import AppRoutes from "./routes/AppRoutes";

const App = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>

        <ToastContainer
          position="top-right"
          autoClose={3500}
          limit={3}
          newestOnTop
          closeOnClick
          pauseOnHover
          theme="light"
        />
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
