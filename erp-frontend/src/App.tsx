import { BrowserRouter } from "react-router-dom";
import { useRoutes } from "react-router-dom";
import routes from "./routes";
import "./styles/App.css"
import { useAuthInitializer } from "./hooks/useAuthInitializer";
function AppRoutes() {
  return useRoutes(routes);
}
function App() {
  useAuthInitializer();
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
export default App;
