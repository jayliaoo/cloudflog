import { Link, Outlet, Form } from "react-router";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink } from "~/components/ui/navigation-menu";
import { Button } from "~/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { Search, User, LogOut, Plus } from "lucide-react";

interface User {
  id: number;
  name: string | null;
  email: string;
  image: string | null;
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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2">
                {ownerUser ? (
                  <>
                    {ownerUser.image ? (
                      <img 
                        src={ownerUser.image} 
                        alt="Blog logo" 
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <span className="text-xl font-bold">{ownerUser.name || ownerUser.email.split('@')[0]}'s Blog</span>
                  </>
                ) : (
                  <span className="text-xl font-bold">My Blog</span>
                )}
              </Link>
              <NavigationMenu className="hidden md:flex">
                <NavigationMenuItem>
                  <Link to="/posts" className="px-3 py-2 text-sm font-medium hover:text-primary">
                    Posts
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link to="/tags" className="px-3 py-2 text-sm font-medium hover:text-primary">
                    Tags
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link to="/posts/about" className="px-3 py-2 text-sm font-medium hover:text-primary">
                    About
                  </Link>
                </NavigationMenuItem>
                {user?.role === 'owner' && (
                  <NavigationMenuItem>
                    <Link to="/admin" className="px-3 py-2 text-sm font-medium hover:text-primary text-yellow-600 dark:text-yellow-400">
                      Admin
                    </Link>
                  </NavigationMenuItem>
                )}
              </NavigationMenu>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Search Bar */}
              <div className="hidden md:flex max-w-xs">
                <Form method="get" action="/search" className="w-full">
                  <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <input
                    type="text"
                    name="q"
                    placeholder="Search posts..."
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
                    />
                  </div>
                </Form>
              </div>
              
              {/* Post Button - Only show for authenticated users with owner role */}
              {user?.role === 'owner' && (
                <Button asChild size="sm">
                  <Link to="/posts/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Post
                  </Link>
                </Button>
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
                              <Button type="submit" variant="outline" size="sm" className="w-full justify-start border-yellow-500 text-yellow-700 hover:bg-yellow-50 hover:text-yellow-800">
                                <LogOut className="h-4 w-4 mr-2" />
                                Sign Out
                              </Button>
                            </Form>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link to="/auth/signin">
                    <Button variant="default" size="sm">
                      Sign In
                    </Button>
                  </Link>
                )}
              </div>
              <button
                className="md:hidden p-2"
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
            <div className="md:hidden border-t py-4">
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
                {user ? (
                  <>
                    <Form action="/auth/signout" method="post">
                      <button
                        type="submit"
                        className="px-3 py-2 text-sm font-medium hover:text-primary text-left w-full border border-yellow-500 text-yellow-700 dark:text-yellow-300 rounded-md hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Sign Out
                      </button>
                    </Form>
                  </>
                ) : (
                  <Link to="/auth/signin" className="px-3 py-2 text-sm font-medium hover:text-primary bg-yellow-500 dark:bg-yellow-600 text-white rounded-md hover:bg-yellow-600 dark:hover:bg-yellow-700" onClick={() => setIsMenuOpen(false)}>
                    Sign In
                  </Link>
                )}
              </nav>
            </div>
          )}
        </div>
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