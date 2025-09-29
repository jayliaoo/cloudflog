import { Link, Form } from "react-router";
import { useState, useRef, useEffect } from "react";
import { Search, User, LogOut, Plus, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

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
  const { t, i18n } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setIsLanguageMenuOpen(false);
      }
    };

    if (isUserMenuOpen || isLanguageMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen, isLanguageMenuOpen]);

  // Language change handler
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
    
    // Set cookie for server-side language detection
    // Cookie expires in 1 year
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `i18nextLng=${lng}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
    
    setIsLanguageMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-3 nav-link">
                {ownerUser ? (
                  <>
                    {ownerUser.image ? (
                      <img 
                        src={ownerUser.image} 
                        alt="Blog logo" 
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <span className="text-xl font-bold text-slate-900">{ownerUser.name}{t('navigation.blogSuffix')}</span>
                  </>
                ) : (
                  <>
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-xl font-bold text-slate-900">{t('navigation.myBlog')}</span>
                  </>
                )}
              </Link>
              <div className="hidden lg:flex items-center space-x-2">
                  <Link to="/posts" className="text-slate-600 px-3 py-2 text-sm font-medium  nav-link hover:text-slate-900">
                    {t('navigation.posts')}
                  </Link>
                  <Link to="/tags" className="text-slate-600 px-3 py-2 text-sm font-medium hover:text-slate-900">
                    {t('navigation.tags')}
                  </Link>
                  <Link to="/posts/about" className="text-slate-600 px-3 py-2 text-sm font-medium hover:text-slate-900">
                    {t('navigation.about')}
                  </Link>
                {user?.role === 'owner' && (
                    <Link to="/admin" className="text-slate-600 px-3 py-2 text-sm font-medium hover:text-slate-900">
                      {t('navigation.admin')}
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
                    placeholder={t('common.search')}
                    className="bg-slate-100 border border-slate-200 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                </Form>
              </div>
              
              {/* Post Button - Only show for authenticated users with owner role */}
              {user?.role === 'owner' && (
                <Link to="/posts/new">
                  <button className="hidden lg:inline-flex bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-indigo-700 transition items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>{t('posts.newPost')}</span>
                  </button>
                </Link>
              )}
              
              {/* Language Selector */}
              <div className="relative" ref={languageMenuRef}>
                <button
                  className="flex items-center space-x-1 text-slate-600 hover:text-slate-900 px-2 py-1 rounded-md transition"
                  onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
                >
                  <Globe className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {i18n.language === 'zh' ? '中文' : 'EN'}
                  </span>
                </button>
                
                {/* Language Menu Dropdown */}
                {isLanguageMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="absolute -top-2 right-3 w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45"></div>
                    <div className="relative bg-white rounded-lg py-1">
                      <button
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition ${
                          i18n.language === 'en' ? 'bg-gray-50 font-medium' : ''
                        }`}
                        onClick={() => changeLanguage('en')}
                      >
                        English
                      </button>
                      <button
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition ${
                          i18n.language === 'zh' ? 'bg-gray-50 font-medium' : ''
                        }`}
                        onClick={() => changeLanguage('zh')}
                      >
                        中文
                      </button>
                    </div>
                  </div>
                )}
              </div>

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
                                {t('auth.signOut')}
                              </button>
                            </Form>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link to="/auth/signin">
                    <button className="bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-indigo-700 transition">
                      {t('navigation.signIn')}
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
                        placeholder={t('common.search')}
                        className="bg-slate-100 border border-slate-200 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition w-full"
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
                  {t('navigation.posts')}
                </Link>
                <Link to="/tags" className="px-3 py-2 text-sm font-medium hover:text-primary" onClick={() => setIsMenuOpen(false)}>
                  {t('navigation.tags')}
                </Link>
                <Link to="/posts/about" className="px-3 py-2 text-sm font-medium hover:text-primary" onClick={() => setIsMenuOpen(false)}>
                  {t('navigation.about')}
                </Link>
                  {user?.role === 'owner' && (
                    <>
                      <Link to="/admin" className="px-3 py-2 text-sm font-medium hover:text-primary">
                        {t('navigation.admin')}
                      </Link>
                      <Link to="/posts/new" className="px-3 py-2 text-sm font-medium hover:text-primary">
                        <span>{t('posts.newPost')}</span>
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
      <footer className="border-t border-t-gray-200 shadow-2xl z-50 bg-white">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>{t('footer.copyright', { year: new Date().getFullYear(), name: ownerUser?.name|| t('navigation.myBlog')})}</p>
            <div className="flex space-x-4 mt-4 sm:mt-0">
              <a href="#" className="hover:text-slate-900"><i data-lucide="twitter"></i></a>
              <a href="#" className="hover:text-slate-900"><i data-lucide="github"></i></a>
              <a href="#" className="hover:text-slate-900"><i data-lucide="linkedin"></i></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}