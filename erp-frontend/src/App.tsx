import { BrowserRouter } from "react-router-dom";
import { useRoutes } from "react-router-dom";
import routes from "./routes";
import "./styles/App.css"
import { useAuthInitializer } from "./hooks/useAuthInitializer";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { WebSocketProvider } from "./contexts/WebSocketContext";
import { ConfigProvider, theme as antdTheme } from "antd";
import { useTheme } from "./contexts/ThemeContext";

function AppRoutes() {
  return useRoutes(routes);
}

function App() {
  useAuthInitializer();
  const { resolvedTheme } = useTheme();

  return (
    <ConfigProvider
      theme={{
        algorithm:
          resolvedTheme === "dark"
            ? antdTheme.darkAlgorithm
            : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: "#f97316",
          colorInfo: "#f97316",
          borderRadius: 8,
        },
      }}
    >
      <BrowserRouter>
        <WebSocketProvider>
          <AppRoutes />
          <ToastContainer
            position="top-right"
            autoClose={3000}
            theme={resolvedTheme}
          />
        </WebSocketProvider>
      </BrowserRouter>
    </ConfigProvider>

  );
}
export default App;
