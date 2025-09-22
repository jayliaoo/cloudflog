import { Link, Outlet, useLocation } from "react-router";
import { Button } from "~/components/ui/button";
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
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <h2 className="text-lg font-semibold">Admin Panel</h2>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <nav className="p-4">
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
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">{getPageTitle()}</h1>
          </div>
  
        </header>

        {/* Content */}
        <main className="flex-1 p-6">
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