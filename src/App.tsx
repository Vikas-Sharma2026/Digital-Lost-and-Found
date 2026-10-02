/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Pages
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { ReportLostPage } from './pages/ReportLostPage';
import { ReportFoundPage } from './pages/ReportFoundPage';
import { LostItemsPage } from './pages/LostItemsPage';
import { FoundItemsPage } from './pages/FoundItemsPage';
import { SearchFilterPage } from './pages/SearchFilterPage';
import { ItemDetailPage } from './pages/ItemDetailPage';
import { PotentialMatchesPage } from './pages/PotentialMatchesPage';
import { MyReportsPage } from './pages/MyReportsPage';
import { MyClaimsPage } from './pages/MyClaimsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminItemManagementPage } from './pages/AdminItemManagementPage';
import { AdminClaimVerificationPage } from './pages/AdminClaimVerificationPage';

function AppContent() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [pageParams, setPageParams] = useState<any>({});

  const handleNavigate = (page: string, params?: any) => {
    setCurrentPage(page);
    setPageParams(params || {});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} currentUserId={user?.id} />;
      case 'login':
        return <LoginPage onNavigate={handleNavigate} />;
      case 'register':
        return <RegisterPage onNavigate={handleNavigate} />;
      case 'student-dashboard':
        return <StudentDashboard onNavigate={handleNavigate} />;
      case 'report-lost':
        return <ReportLostPage onNavigate={handleNavigate} />;
      case 'report-found':
        return <ReportFoundPage onNavigate={handleNavigate} />;
      case 'lost-items':
        return <LostItemsPage onNavigate={handleNavigate} currentUserId={user?.id} />;
      case 'found-items':
        return <FoundItemsPage onNavigate={handleNavigate} currentUserId={user?.id} />;
      case 'search':
        return (
          <SearchFilterPage
            initialQuery={pageParams?.q || ''}
            onNavigate={handleNavigate}
            currentUserId={user?.id}
          />
        );
      case 'item-details':
        return <ItemDetailPage itemId={pageParams?.id} onNavigate={handleNavigate} />;
      case 'matches':
        return (
          <PotentialMatchesPage
            initialItemId={pageParams?.itemId}
            onNavigate={handleNavigate}
          />
        );
      case 'my-reports':
        return <MyReportsPage highlightId={pageParams?.highlightId} onNavigate={handleNavigate} />;
      case 'my-claims':
        return <MyClaimsPage onNavigate={handleNavigate} />;
      case 'notifications':
        return <NotificationsPage onNavigate={handleNavigate} />;
      case 'admin-dashboard':
        return <AdminDashboard onNavigate={handleNavigate} />;
      case 'admin-items':
        return <AdminItemManagementPage onNavigate={handleNavigate} />;
      case 'admin-claims':
        return <AdminClaimVerificationPage onNavigate={handleNavigate} />;
      default:
        return <HomePage onNavigate={handleNavigate} currentUserId={user?.id} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 font-sans text-zinc-900 antialiased selection:bg-indigo-500 selection:text-white">
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} />
      <main className="flex-1">{renderPage()}</main>
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}
