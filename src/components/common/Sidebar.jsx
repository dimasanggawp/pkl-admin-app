import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  GraduationCap,
  MapPin,
  BellRing,
  ClipboardCheck,
  TrendingUp,
  FileText,
  Trash2,
  Settings as SettingsIcon,
  ShieldCheck,
  X,
} from 'lucide-react';

const sections = [
  {
    label: 'Ringkasan',
    links: [{ to: '/', icon: LayoutDashboard, label: 'Dashboard' }],
  },
  {
    label: 'Data Induk',
    links: [
      { to: '/students', icon: Users, label: 'Data Siswa' },
      { to: '/import', icon: FileSpreadsheet, label: 'Import Data' },
      { to: '/guru', icon: GraduationCap, label: 'Data Guru' },
      { to: '/locations', icon: MapPin, label: 'Lokasi PKL' },
    ],
  },
  {
    label: 'Pengawasan',
    links: [
      { to: '/alerts', icon: BellRing, label: 'Alert Monitoring' },
      { to: '/monitoring', icon: ClipboardCheck, label: 'Monitoring Records' },
      { to: '/teacher-performance', icon: TrendingUp, label: 'Performa Guru' },
    ],
  },
  {
    label: 'Administrasi',
    links: [
      { to: '/reports', icon: FileText, label: 'Laporan' },
      { to: '/trash', icon: Trash2, label: 'Trash' },
      { to: '/admins', icon: ShieldCheck, label: 'Manajemen Admin' },
      { to: '/settings', icon: SettingsIcon, label: 'Pengaturan' },
    ],
  },
];

function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <nav
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-border bg-surface
          transition-transform duration-200 ease-out
          lg:static lg:z-auto lg:w-60 lg:shrink-0 lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-4 pt-4 lg:hidden">
          <span className="kicker">Navigasi</span>
          <button
            onClick={onClose}
            aria-label="Tutup menu"
            className="rounded-lg p-1.5 text-muted hover:bg-surface-alt hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex h-full flex-col gap-1 overflow-y-auto p-3 lg:p-4">
          {sections.map((section, idx) => (
            <div key={section.label} className={idx > 0 ? 'mt-4' : ''}>
              <p className="kicker mb-2 px-3">{section.label}</p>
              {section.links.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-150 ${
                      isActive
                        ? 'bg-accent-soft text-accent font-semibold'
                        : 'text-muted hover:bg-surface-alt hover:text-ink'
                    }`
                  }
                >
                  <Icon size={18} strokeWidth={2} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </div>
      </nav>
    </>
  );
}

export default Sidebar;
