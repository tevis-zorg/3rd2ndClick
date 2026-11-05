import { Link, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import SiteNavigation from './components/SiteNavigation.tsx'
import { AboutPage, ContactPage, HomePage, ProjectDetailPage, ServicesPage, WorksPage } from './pages/PublicPages.tsx'
import { AdminDataProvider } from './admin/AdminData.tsx'
import { AdminDashboardPage, AdminLayout, AdminLoginPage, AdminProjectFormPage, AdminProjectsPage } from './admin/AdminPages.tsx'

function NotFound() {
  return (
    <main className="copy-container py-16 sm:py-24">
      <h1 className="section-title">Page not found</h1>
      <Link className="text-link mt-6" to="/">Return home</Link>
    </main>
  )
}

function PublicLayout() {
  const { pathname } = useLocation()
  const isLightPage = pathname === '/about' || pathname === '/contact'

  return (
    <div className={`public-layout ${isLightPage ? 'public-layout--light' : ''}`}>
      <SiteNavigation />
      <Outlet />
      <footer className="studio-footer">
        <div className="studio-container studio-footer__inner">
          <Link className="studio-mark" to="/">Collective / Edit</Link>
          <span>Independent post-production collective · Working worldwide</span>
          <Link to="/contact">Start a conversation ↗</Link>
          <small>© {new Date().getFullYear()} Collective / Edit</small>
        </div>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <AdminDataProvider>
      <div className="studio-shell">
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/works" element={<WorksPage />} />
            <Route path="/works/:slug" element={<ProjectDetailPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Route>
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="projects" element={<AdminProjectsPage />} />
            <Route path="projects/new" element={<AdminProjectFormPage />} />
            <Route path="projects/:id/edit" element={<AdminProjectFormPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </AdminDataProvider>
  )
}
