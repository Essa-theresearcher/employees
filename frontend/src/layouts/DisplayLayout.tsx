import { Outlet } from 'react-router-dom';

export function DisplayLayout() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Outlet />
    </div>
  );
}
