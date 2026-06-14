import { useState, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const StudentManagement = lazy(() => import('./pages/StudentManagement'));
const DataImport = lazy(() => import('./pages/DataImport'));
const GuruManagement = lazy(() => import('./pages/GuruManagement'));
const AdminManagement = lazy(() => import('./pages/AdminManagement'));
const LocationManagement = lazy(() => import('./pages/LocationManagement'));
const AlertsMonitoring = lazy(() => import('./pages/AlertsMonitoring'));
const MonitoringRecords = lazy(() => import('./pages/MonitoringRecords'));
const TeacherPerformance = lazy(() => import('./pages/TeacherPerformance'));
const Reports = lazy(() => import('./pages/Reports'));
const Trash = lazy(() => import('./pages/Trash'));
const Settings = lazy(() => import('./pages/Settings'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center p-12 text-muted text-sm">
      Memuat halaman...
    </div>
  );
}

function LoginRoute() {
  const token = localStorage.getItem('token');

  if (token) {
    return <Navigate to="/" replace />;
  }

  return <Login />;
}

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex flex-1">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 min-w-0">
          <Suspense fallback={<PageLoader />}>{children}</Suspense>
        </main>
      </div>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route
            path="/unauthorized"
            element={
              <Suspense fallback={<PageLoader />}>
                <Unauthorized />
              </Suspense>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute role="admin">
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/students"
            element={
              <ProtectedRoute role="admin">
                <Layout>
                  <StudentManagement />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/import"
            element={
              <ProtectedRoute role="admin">
                <Layout>
                  <DataImport />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/guru"
            element={
              <ProtectedRoute role="admin">
                <Layout>
                  <GuruManagement />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admins"
            element={
              <ProtectedRoute role="admin">
                <Layout>
                  <AdminManagement />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/locations"
            element={
              <ProtectedRoute role="admin">
                <Layout>
                  <LocationManagement />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/alerts"
            element={
              <ProtectedRoute role="admin">
                <Layout>
                  <AlertsMonitoring />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/monitoring"
            element={
              <ProtectedRoute role="admin">
                <Layout>
                  <MonitoringRecords />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher-performance"
            element={
              <ProtectedRoute role="admin">
                <Layout>
                  <TeacherPerformance />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute role="admin">
                <Layout>
                  <Reports />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/trash"
            element={
              <ProtectedRoute role="admin">
                <Layout>
                  <Trash />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute role="admin">
                <Layout>
                  <Settings />
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
