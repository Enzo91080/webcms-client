import "antd/dist/reset.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "reactflow/dist/style.css";
import App from "./App";
import { getToken, setTokenGetter } from "./shared/api";
import { AuthProvider } from "./app/providers/AuthProvider";
import "./styles/fonts.css";
import "./styles/global.css";
import "./styles/typography.css";


// Initialize API client with token getter
setTokenGetter(getToken);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider><App /></AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
