import { BrowserRouter } from "react-router-dom";
import { useRoutes } from "react-router-dom";
import routes from "./routes";
import "./styles/App.css"
import { useAuthInitializer } from "./hooks/useAuthInitializer";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { WebSocketProvider } from "./contexts/WebSocketContext";

function AppRoutes() {
  return useRoutes(routes);
}

function App() {
  useAuthInitializer();
  return (
    <BrowserRouter>
      <WebSocketProvider>
        <AppRoutes />
        <ToastContainer position="top-right" autoClose={3000} />
      </WebSocketProvider>
    </BrowserRouter>

  );
}
export default App;

