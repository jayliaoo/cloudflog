import { Link, Outlet, useLocation } from "react-router";
import { BarChart3, FileText, Tag, MessageSquare, Menu, X } from "lucide-react";
import { useState } from "react";

interface AdminLayoutProps {
  children?: React.ReactNode;
}

const sidebarItems = [
  { href: "/admin", icon: BarChart3, label: "Dashboard" },
  { href: "/admin/posts", icon: FileText, label: "Posts" },
  { href: "/admin/tags", icon: Tag, label: "Tags" },
  { href: "/admin/comments", icon: MessageSquare, label: "Comments" },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  
  // Determine page title based on current route
  const getPageTitle = () => {
    const pathname = location.pathname;
    if (pathname === '/admin/posts') return 'Posts Management';
    if (pathname === '/admin/tags') return 'Tags Management';
    if (pathname === '/admin/comments') return 'Comments Management';
    return 'Admin Dashboard';
  };

  return (
    <div className="bg-background">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed top-16 h-[calc(100vh-132px)] left-0 z-49 w-64 bg-card border-r border-r-gray-200 transition-transform duration-300 ease-in-out lg:translate-x-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-b-gray-200">
          <h2 className="text-lg font-semibold">Admin Panel</h2>
          <button
            className="lg:hidden inline-flex items-center justify-center rounded-md p-2 hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="p-4 h-full overflow-y-auto">
          <ul className="space-y-2">
            {sidebarItems.map((item) => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className="flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="bg-card px-6 py-4 flex items-center justify-between sticky top-0 z-30 border-b border-b-gray-200">
          <div className="flex items-center space-x-4">
            <button
              className="lg:hidden inline-flex items-center justify-center rounded-md p-2 hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </button>
            <h1 className="text-2xl font-bold">{getPageTitle()}</h1>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          {children || <Outlet />}
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}