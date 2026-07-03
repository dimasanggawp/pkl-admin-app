import { useState, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const PresensiHarian = lazy(() => import('./pages/PresensiHarian'));
const JurnalHarian = lazy(() => import('./pages/JurnalHarian'));
const StudentManagement = lazy(() => import('./pages/StudentManagement'));
const GuruManagement = lazy(() => import('./pages/GuruManagement'));
const AdminManagement = lazy(() => import('./pages/AdminManagement'));
const TempatPklManagement = lazy(() => import('./pages/TempatPklManagement'));
const MappingSiswa = lazy(() => import('./pages/MappingSiswa'));
const AlertsMonitoring = lazy(() => import('./pages/AlertsMonitoring'));
const MonitoringRecords = lazy(() => import('./pages/MonitoringRecords'));
const TeacherPerformance = lazy(() => import('./pages/TeacherPerformance'));
const Reports = lazy(() => import('./pages/Reports'));
const Trash = lazy(() => import('./pages/Trash'));
const Settings = lazy(() => import('./pages/Settings'));
const TahunAjaranManagement = lazy(() => import('./pages/TahunAjaranManagement'));
const JurusanManagement = lazy(() => import('./pages/JurusanManagement'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center p-12 text-muted text-sm">
      Memuat halaman...
    </div>
  );
}

function LoginRoute() {
  const token = localStorage.getItem('admin_token');

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
      <BrowserRouter basename={import.meta.env.BASE_URL}>
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
            element={<Navigate to="/tempat-pkl" replace />}
          />
          <Route
            path="/tempat-pkl"
            element={
              <ProtectedRoute role="admin">
                <Layout>
                  <TempatPklManagement />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mapping-tempat-pkl"
            element={
              <ProtectedRoute role="admin">
                <Layout>
                  <MappingSiswa />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/presensi-harian"
            element={
              <ProtectedRoute role="admin">
                <Layout>
                  <PresensiHarian />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/jurnal-harian"
            element={
              <ProtectedRoute role="admin">
                <Layout>
                  <JurnalHarian />
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
            path="/tahun-ajaran"
            element={
              <ProtectedRoute role="admin">
                <Layout>
                  <TahunAjaranManagement />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/jurusan"
            element={
              <ProtectedRoute role="admin">
                <Layout>
                  <JurusanManagement />
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
