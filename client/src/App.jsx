import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import CustomerDetail from "./pages/CustomerDetail";
import Orders from "./pages/Orders";
import { api, getToken, AUTH_EVENT } from "./api/client";

function RequireAuth({ signedIn, children }) {
  const location = useLocation();
  if (!signedIn) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return children;
}

export default function App() {
  // null = still checking, true/false = known state. Starting from
  // whether a token exists avoids a login-page flash on refresh.
  const [signedIn, setSignedIn] = useState(getToken() ? null : false);

  useEffect(() => {
    if (getToken()) {
      api
        .me()
        .then(() => setSignedIn(true))
        .catch(() => setSignedIn(false));
    }
    function handleAuthRequired() {
      setSignedIn(false);
    }
    window.addEventListener(AUTH_EVENT, handleAuthRequired);
    return () => window.removeEventListener(AUTH_EVENT, handleAuthRequired);
  }, []);

  if (signedIn === null) {
    return null; // brief check of an existing token before rendering anything
  }

  return (
    <Routes>
      <Route path="/login" element={<Login onSignedIn={() => setSignedIn(true)} />} />
      <Route
        element={
          <RequireAuth signedIn={signedIn}>
            <Layout onSignOut={() => setSignedIn(false)} />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/customers/:id" element={<CustomerDetail />} />
        <Route path="/orders" element={<Orders />} />
      </Route>
    </Routes>
  );
}
