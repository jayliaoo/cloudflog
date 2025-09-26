import { Link, Form } from "react-router";
import { useState, useRef, useEffect } from "react";
import { Search, User, LogOut, Plus } from "lucide-react";

interface User {
  id: number;
  name: string | null;
  email: string;
  image: string;
  role?: string;
}

interface BlogLayoutProps {
  children: React.ReactNode;
  user?: User | null;
  ownerUser?: User | null;
}

export default function BlogLayout({ children, user, ownerUser }: BlogLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <nav className="container mx-auto sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-3 nav-link">
                {ownerUser ? (
                  <>
                    <img 
                      src={ownerUser.image} 
                      alt="Blog logo" 
                      className="h-10 w-10 rounded-full"
                    />
                    <span className="text-xl font-bold text-slate-900">{ownerUser.name}'s Blog</span>
                  </>
                ) : (
                  <>
                    <div className="h-10 w-10 rounded-full bg-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-xl font-bold text-slate-900">My Blog</span>
                  </>
                )}
              </Link>
              <div className="hidden lg:flex items-center space-x-2">
                  <Link to="/posts" className="text-slate-600 px-3 py-2 text-sm font-medium  nav-link hover:text-slate-900">
                    Posts
                  </Link>
                  <Link to="/tags" className="text-slate-600 px-3 py-2 text-sm font-medium hover:text-slate-900">
                    Tags
                  </Link>
                  <Link to="/posts/about" className="text-slate-600 px-3 py-2 text-sm font-medium hover:text-slate-900">
                    About
                  </Link>
                {user?.role === 'owner' && (
                    <Link to="/admin" className="text-slate-600 px-3 py-2 text-sm font-medium hover:text-slate-900">
                      Admin
                    </Link>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              <div className="relative hidden lg:block">
                <Form method="get" action="/search" className="w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <input
                    type="text"
                    name="q"
                    placeholder="Search posts..."
                    className="bg-slate-100 border border-slate-200 py-2 pl-10 pr-4 text-sm focus:outline-node focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition rounded-lg"
                    />
                </Form>
              </div>
              
              {/* Post Button - Only show for authenticated users with owner role */}
              {user?.role === 'owner' && (
                <button className="hidden lg:inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition items-center space-x-2">
                  <Link to="/posts/new">
                    <Plus absoluteStrokeWidth className="h-4 w-4 mr-2 inline-block pb-1" />
                    <span>Post</span>
                  </Link>
                </button>
              )}
              
              <div className="flex items-center space-x-2">
                {user ? (
                  <div className="relative" ref={userMenuRef}>
                    {/* Avatar */}
                    <div 
                      className="flex items-center space-x-2 cursor-pointer p-1"
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    >
                      {user.image ? (
                        <img 
                          src={user.image} 
                          alt="User avatar" 
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                      )}
                    </div>
                    
                    {/* User Menu Dropdown */}
                    {isUserMenuOpen && (
                      <div 
                        className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Arrow pointing to avatar */}
                        <div className="absolute -top-2 right-3 w-4 h-4 bg-white dark:bg-gray-800 border-l border-t border-gray-200 dark:border-gray-600 transform rotate-45"></div>
                        <div className="relative bg-white dark:bg-gray-800 rounded-lg">
                          <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                            <p className="text-sm font-medium truncate">
                              {user.name || user.email}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {user.name ? user.email : ''}
                            </p>
                          </div>
                          <div className="p-2">
                            <Form action="/auth/signout" method="post">
                              <button type="submit" className="w-full block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 text-left">
                                <LogOut className="h-4 w-4 mr-2 inline" />
                                Sign Out
                              </button>
                            </Form>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link to="/auth/signin">
                    <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition">
                      Sign In
                    </button>
                  </Link>
                )}
              </div>
              <button
                className="lg:hidden p-2"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <span className="sr-only">Toggle menu</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Mobile menu */}
          {isMenuOpen && (
            <div className="lg:hidden border-t py-4">
              {/* Mobile Search */}
              <div className="px-3 pb-4">
                <Form method="get" action="/search">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <input
                        type="text"
                        name="q"
                        placeholder="Search posts..."
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setIsMenuOpen(false);
                          }
                        }}
                      />
                  </div>
                </Form>
              </div>
              <nav className="flex flex-col space-y-2">
                <Link to="/posts" className="px-3 py-2 text-sm font-medium hover:text-primary" onClick={() => setIsMenuOpen(false)}>
                  Posts
                </Link>
                <Link to="/tags" className="px-3 py-2 text-sm font-medium hover:text-primary" onClick={() => setIsMenuOpen(false)}>
                  Tags
                </Link>
                <Link to="/posts/about" className="px-3 py-2 text-sm font-medium hover:text-primary" onClick={() => setIsMenuOpen(false)}>
                  About
                </Link>
                  {user?.role === 'owner' && (
                    <>
                      <Link to="/admin" className="px-3 py-2 text-sm font-medium hover:text-primary">
                        Admin
                      </Link>
                      <Link to="/posts/new" className="px-3 py-2 text-sm font-medium hover:text-primary">
                        <span>New Post</span>
                      </Link>
                    </>
                  )}
              </nav>
            </div>
          )}
        </nav>
      </header>
      <main className="flex-1">
        {children}
      </main>
      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>&copy; 2024 My Blog. Built with React Router and Cloudflare Workers.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}