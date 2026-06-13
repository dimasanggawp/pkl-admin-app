import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/students', label: 'Data Siswa' },
  { to: '/import', label: 'Import Data' },
  { to: '/guru', label: 'Data Guru' },
  { to: '/locations', label: 'Lokasi PKL' },
  { to: '/alerts', label: 'Alert Monitoring' },
  { to: '/monitoring', label: 'Monitoring Records' },
  { to: '/teacher-performance', label: 'Performa Guru' },
  { to: '/reports', label: 'Laporan' },
  { to: '/settings', label: 'Pengaturan' },
];

function Sidebar() {
  return (
    <nav className="bg-gray-100 w-full sm:w-48 p-4 flex sm:flex-col gap-2">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            `px-3 py-2 rounded text-sm font-medium ${
              isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-200'
            }`
          }
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default Sidebar;
