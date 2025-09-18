import { Link, Outlet, Form } from "react-router";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink } from "~/components/ui/navigation-menu";
import { Button } from "~/components/ui/button";
import { useState } from "react";

interface User {
  id: number;
  name: string | null;
  email: string;
  image: string | null;
}

interface BlogLayoutProps {
  children: React.ReactNode;
  user?: User | null;
}

export default function BlogLayout({ children, user }: BlogLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 dark:bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-900/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2">
                <span className="text-xl font-bold">My Blog</span>
              </Link>
              <NavigationMenu className="hidden md:flex">
                <NavigationMenuItem>
                  <Link to="/" className="px-3 py-2 text-sm font-medium hover:text-primary">
                    Home
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link to="/blog" className="px-3 py-2 text-sm font-medium hover:text-primary">
                    Blog
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link to="/about" className="px-3 py-2 text-sm font-medium hover:text-primary">
                    About
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link to="/contact" className="px-3 py-2 text-sm font-medium hover:text-primary">
                    Contact
                  </Link>
                </NavigationMenuItem>
              </NavigationMenu>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <span className="text-sm text-gray-500 hidden md:block">
                  Welcome, {user.name || user.email}
                </span>
              )}
              <div className="flex items-center space-x-2">
                {user ? (
                  <>
                    <Link to="/admin">
                      <Button variant="outline" size="sm">
                        Admin
                      </Button>
                    </Link>
                    <Form action="/auth/signout" method="post">
                      <Button type="submit" variant="outline" size="sm">
                        Sign Out
                      </Button>
                    </Form>
                  </>
                ) : (
                  <Link to="/auth/signin">
                    <Button variant="outline" size="sm">
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
              <nav className="flex flex-col space-y-2">
                <Link to="/" className="px-3 py-2 text-sm font-medium hover:text-primary" onClick={() => setIsMenuOpen(false)}>
                  Home
                </Link>
                <Link to="/blog" className="px-3 py-2 text-sm font-medium hover:text-primary" onClick={() => setIsMenuOpen(false)}>
                  Blog
                </Link>
                <Link to="/about" className="px-3 py-2 text-sm font-medium hover:text-primary" onClick={() => setIsMenuOpen(false)}>
                  About
                </Link>
                <Link to="/contact" className="px-3 py-2 text-sm font-medium hover:text-primary" onClick={() => setIsMenuOpen(false)}>
                  Contact
                </Link>
                {user ? (
                  <>
                    <Link to="/admin" className="px-3 py-2 text-sm font-medium hover:text-primary" onClick={() => setIsMenuOpen(false)}>
                      Admin
                    </Link>
                    <Form action="/auth/signout" method="post">
                      <button
                        type="submit"
                        className="px-3 py-2 text-sm font-medium hover:text-primary text-left w-full"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Sign Out
                      </button>
                    </Form>
                  </>
                ) : (
                  <Link to="/auth/signin" className="px-3 py-2 text-sm font-medium hover:text-primary" onClick={() => setIsMenuOpen(false)}>
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
      <footer className="border-t bg-gray-50 dark:bg-gray-800/50">
        <div className="container mx-auto px-4 py-12">
          <div className="mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">&copy; 2024 My Blog. Built with React Router and Cloudflare Workers.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}