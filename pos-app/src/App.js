import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Login from './pages/Login';
import ShiftManagement from './pages/ShiftManagement';
import POSScreen from './pages/POSScreen';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">جاري التحميل...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/shift"
              element={
                <ProtectedRoute>
                  <ShiftManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pos"
              element={
                <ProtectedRoute>
                  <POSScreen />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/shift" replace />} />
            <Route path="*" element={<Navigate to="/shift" replace />} />
          </Routes>
          
          <ToastContainer
            position="top-left"
            autoClose={2000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl
            pauseOnFocusLoss={false}
            draggable
            pauseOnHover
          />
        </div>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;


