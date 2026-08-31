import { Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext.jsx';
import { PermissionsProvider } from './context/PermissionsContext.jsx';
import PublicLayout from './components/layout/PublicLayout.jsx';
import 'leaflet/dist/leaflet.css';
import Home from './pages/Home.jsx';
import Cooperation from './pages/Cooperation.jsx';
import Projets from './pages/Projets.jsx';
import Appels from './pages/Appels.jsx';
import Mobilites from './pages/Mobilites.jsx';
import Actualites from './pages/Actualites.jsx';
import ActualiteDetail from './pages/ActualiteDetail.jsx';
import Documents from './pages/Documents.jsx';
import NotFound from './pages/NotFound.jsx';

import Login from './pages/admin/Login.jsx';
import ForgotPassword from './pages/admin/ForgotPassword.jsx';
import ResetPassword from './pages/admin/ResetPassword.jsx';
import ProtectedRoute from './pages/admin/ProtectedRoute.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import ManagePartenaires from './pages/admin/ManagePartenaires.jsx';
import ManageProjets from './pages/admin/ManageProjets.jsx';
import ManageAppels from './pages/admin/ManageAppels.jsx';
import ManageMobilites from './pages/admin/ManageMobilites.jsx';
import ManageDocuments from './pages/admin/ManageDocuments.jsx';
import ManageRoles from './pages/admin/ManageRoles.jsx';
import TestAccess from './pages/admin/TestAccess.jsx';
import JournalAudit from './pages/admin/JournalAudit.jsx';
import ManageNewsEvents from './pages/admin/ManageNewsEvents.jsx';
import ManageResetSettings from './pages/admin/ManageResetSettings.jsx';
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <ScrollToTop />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/cooperation" element={<Cooperation />} />
          <Route path="/projets" element={<Projets />} />
          <Route path="/appels" element={<Appels />} />
          <Route path="/mobilites" element={<Mobilites />} />
          <Route path="/actualites" element={<Actualites />} />
          <Route path="/actualites/:id" element={<ActualiteDetail />} />
          <Route path="/documents" element={<Documents />} />
        </Route>

        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin/forgot-password" element={<ForgotPassword />} />
        <Route path="/admin/reset-password" element={<ResetPassword />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <PermissionsProvider>
                <AdminLayout />
              </PermissionsProvider>
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="partenaires" element={<ManagePartenaires />} />
          <Route path="projets" element={<ManageProjets />} />
          <Route path="appels" element={<ManageAppels />} />
          <Route path="mobilites" element={<ManageMobilites />} />
          <Route path="news-events" element={<ManageNewsEvents />} />

          <Route path="documents" element={<ManageDocuments />} />
          <Route path="roles" element={<ManageRoles />} />
          <Route path="test-acces" element={<TestAccess />} />
          <Route path="journal" element={<JournalAudit />} />
          <Route 
      path= 'settings-reset-password'
      element= {<ManageResetSettings  />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}