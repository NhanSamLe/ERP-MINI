import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "./styles/index.css";
import { Provider } from "react-redux";
import { store } from "./store/store";
import App from './App.tsx'
import AppInitializer from './AppInitializer.tsx';
import { ThemeProvider } from "./contexts/ThemeContext";
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <Provider store={store}>
        <AppInitializer />
        <App />
      </Provider>
    </ThemeProvider>
  </StrictMode>,
)
