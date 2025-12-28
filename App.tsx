
import React, { useState, useEffect } from 'react';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { TeacherDashboardView } from './views/TeacherDashboardView';
import { StudentDashboardView } from './views/StudentDashboardView';
import { User, UserRole } from './types';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  
  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check local storage or preference on mount
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && prefersDark)) {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark');
    } else {
        setIsDarkMode(false);
        document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
      if (isDarkMode) {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('theme', 'light');
          setIsDarkMode(false);
      } else {
          document.documentElement.classList.add('dark');
          localStorage.setItem('theme', 'dark');
          setIsDarkMode(true);
      }
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  const renderDashboard = () => {
    if (!user) return <LoginView onLogin={handleLogin} />;

    switch (user.role) {
      case UserRole.TEACHER:
        return (
          <TeacherDashboardView 
            user={user} 
            onLogout={handleLogout} 
            isDarkMode={isDarkMode} 
            onToggleTheme={toggleTheme} 
          />
        );
      case UserRole.STUDENT:
      case UserRole.PARENT:
        return (
          <StudentDashboardView 
            user={user} 
            onLogout={handleLogout} 
            isDarkMode={isDarkMode} 
            onToggleTheme={toggleTheme} 
          />
        );
      default:
        // ADMIN, MANAGEMENT fall back to standard Admin Dashboard
        return (
          <DashboardView 
            user={user} 
            onLogout={handleLogout} 
            isDarkMode={isDarkMode} 
            onToggleTheme={toggleTheme}
          />
        );
    }
  };

  return (
    <div className="font-sans antialiased text-slate-900 dark:text-slate-100">
      {isAuthenticated && user ? renderDashboard() : <LoginView onLogin={handleLogin} />}
    </div>
  );
};

export default App;
