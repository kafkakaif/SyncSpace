import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import InteractivePlayground from './components/InteractivePlayground';
import Features from './components/Features';
import ArchitectureSection from './components/ArchitectureSection';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import SyncSpacePage from './components/SyncSpacePage';
import './App.css';

export default function App() {
  // First, always open Landing page by default
  const [currentPage, setCurrentPage] = useState('landing'); // 'landing' | 'syncspace'
  const [selectedRoom, setSelectedRoom] = useState('');

  const handleOpenSyncSpace = (roomId = '') => {
    setSelectedRoom(roomId);
    setCurrentPage('syncspace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToLanding = () => {
    setCurrentPage('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If user clicked Navbar or CTA, show the SyncSpace workspace page
  if (currentPage === 'syncspace') {
    return (
      <SyncSpacePage
        initialRoomId={selectedRoom}
        onBackToLanding={handleBackToLanding}
      />
    );
  }

  // Otherwise, ALWAYS show the Landing page first!
  return (
    <div className="landing-page-root">
      {/* Navbar with "Open SyncSpace" button */}
      <Navbar onOpenWorkspace={() => handleOpenSyncSpace()} />

      <main>
        {/* Hero Section with Quick Room Launch */}
        <Hero onJoinRoom={(roomId) => handleOpenSyncSpace(roomId)} />

        {/* Live Interactive Playground / Demo */}
        <InteractivePlayground onLaunchRoom={(roomId) => handleOpenSyncSpace(roomId)} />

        {/* Core Capabilities */}
        <Features />

        {/* System Architecture */}
        <ArchitectureSection />

        {/* FAQ */}
        <FAQ />
      </main>

      {/* Footer */}
      <Footer onOpenWorkspace={() => handleOpenSyncSpace()} />
    </div>
  );
}
