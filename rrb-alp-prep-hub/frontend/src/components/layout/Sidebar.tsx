import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Library, 
  UploadCloud, 
  Settings, 
  LineChart, 
  PlayCircle,
  BrainCircuit
} from 'lucide-react';
import { clsx } from 'clsx';

export default function Sidebar() {
  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/test/new', icon: PlayCircle, label: 'Take Test' },
    { to: '/questions', icon: Library, label: 'Question Bank' },
    { to: '/import', icon: UploadCloud, label: 'Import Center' },
    { to: '/analytics', icon: LineChart, label: 'Analytics' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">
          <BrainCircuit size={20} />
        </div>
        <div className="logo-text">
          <span className="text-gradient">ALP Hub</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => clsx('nav-item', isActive && 'active')}
          >
            <item.icon className="nav-icon" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <NavLink
          to="/settings"
          className={({ isActive }) => clsx('nav-item', isActive && 'active')}
        >
          <Settings className="nav-icon" />
          <span>Settings</span>
        </NavLink>
      </div>
    </aside>
  );
}
