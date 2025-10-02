import { BrowserRouter } from "react-router-dom";
import { useRoutes } from "react-router-dom";
import routes from "./routes";
import "./styles/App.css"
import { useAuthInitializer } from "./hooks/useAuthInitializer";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
function AppRoutes() {
  return useRoutes(routes);
}
function App() {
  useAuthInitializer();
  return (
    <BrowserRouter>
        <AppRoutes />
        <ToastContainer position="top-right" autoClose={3000} />
    </BrowserRouter>
  
  );
}
export default App;
