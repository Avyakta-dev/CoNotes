import { Routes, Route, Navigate } from 'react-router-dom';
import { getToken } from './api';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Dashboard from './pages/Dashboard.jsx';

function RequireAuth({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/docs/:id"
        element={
          <RequireAuth>
            <div className="text-white p-8">Editor coming next</div>
          </RequireAuth>
        }
      />
    </Routes>
  );
}