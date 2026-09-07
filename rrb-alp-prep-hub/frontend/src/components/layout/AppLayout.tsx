import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import './AppLayout.css';

export default function AppLayout() {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content-area fade-in">
        <div className="container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
