import React, { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import InteractivePlayground from './components/InteractivePlayground';
import Features from './components/Features';
import ThreeSteps from './components/ThreeSteps';
import ArchitectureSection from './components/ArchitectureSection';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import SyncSpacePage from './components/SyncSpacePage';
import './App.css';

function MainApp() {
  const getInitialPage = () => {
    const hash = window.location.hash.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();

    if (hash === '#signin' || hash === '#login' || pathname === '/login' || pathname === '/signin') {
      return 'signin';
    }
    if (hash === '#signup' || hash === '#register' || pathname === '/register' || pathname === '/signup') {
      return 'signup';
    }
    if (hash === '#workspace' || hash === '#syncspace') {
      return 'syncspace';
    }
    return 'landing';
  };

  const [currentPage, setCurrentPage] = useState(getInitialPage);
  const [selectedRoom, setSelectedRoom] = useState('');

  // Synchronize browser history and hash changes
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPage(getInitialPage());
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const navigateTo = (page, hash = '') => {
    setCurrentPage(page);
    if (hash) {
      window.history.pushState(null, '', hash);
    } else {
      window.history.pushState(null, '', window.location.pathname);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenSyncSpace = (roomId = '') => {
    setSelectedRoom(roomId);
    navigateTo('syncspace', '#workspace');
  };

  const handleBackToLanding = () => {
    navigateTo('landing', '#');
  };

  const handleNavigateToSignIn = () => {
    navigateTo('signin', '#login');
  };

  const handleNavigateToSignUp = () => {
    navigateTo('signup', '#register');
  };

  // Render page content
  const renderPageContent = () => {
    if (currentPage === 'signin') {
      return (
        <SignInPage
          onNavigateToSignUp={handleNavigateToSignUp}
          onNavigateToHome={handleBackToLanding}
          onOpenWorkspace={() => handleOpenSyncSpace()}
        />
      );
    }

    if (currentPage === 'signup') {
      return (
        <SignUpPage
          onNavigateToSignIn={handleNavigateToSignIn}
          onNavigateToHome={handleBackToLanding}
          onOpenWorkspace={() => handleOpenSyncSpace()}
        />
      );
    }

    if (currentPage === 'syncspace') {
      return (
        <SyncSpacePage
          initialRoomId={selectedRoom}
          onBackToLanding={handleBackToLanding}
        />
      );
    }

    // Default Landing Page
    return (
      <div className="landing-page-root">
        {/* Navbar with auth status and buttons */}
        <Navbar
          onOpenWorkspace={() => handleOpenSyncSpace()}
          onNavigateToSignIn={handleNavigateToSignIn}
          onNavigateToSignUp={handleNavigateToSignUp}
          onNavigateToHome={handleBackToLanding}
        />

        <main>
          {/* Hero Section */}
          <Hero onJoinRoom={(roomId) => handleOpenSyncSpace(roomId)} />

          {/* Live Interactive Playground / Demo */}
          <InteractivePlayground onLaunchRoom={(roomId) => handleOpenSyncSpace(roomId)} />

          {/* Core Capabilities - Everything your team needs */}
          <Features />

          {/* Up and running in three steps */}
          <ThreeSteps
            onOpenWorkspace={() => handleOpenSyncSpace()}
            onNavigateToSignUp={handleNavigateToSignUp}
          />

          {/* System Architecture */}
          <ArchitectureSection />

          {/* FAQ */}
          <FAQ />
        </main>

        {/* Footer */}
        <Footer onOpenWorkspace={() => handleOpenSyncSpace()} />
      </div>
    );
  };

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      {renderPageContent()}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
