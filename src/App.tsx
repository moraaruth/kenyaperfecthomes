import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HomePage } from './components/pages/HomePage';
import { PropertiesPage } from './components/pages/PropertiesPage';
import { AboutPage } from './components/pages/AboutPage';
import { BookingPage } from './components/pages/BookingPage';
import { ContactPage } from './components/pages/ContactPage';
import { AddPropertyPage } from './components/pages/AddPropertyPage';
import { SavedPropertiesPage } from './components/pages/SavedPropertiesPage';
import { AdminDashboardPage } from './components/pages/AdminDashboardPage';
import { AdminLoginPage } from './components/pages/AdminLoginPage';
import { PropertyDetailModal } from './components/property/PropertyDetailModal';
import { Property, SearchFilters } from './types';
import {
  fetchProperties,
  getSavedPropertyIds,
  toggleSaveProperty,
} from './lib/propertyStore';
import { checkAdminSession, AdminUser, logoutAdmin, canManageProperties } from './lib/authClient';

const RESET_PATH = '/reset-password';

export default function App() {
  const isResetRoute = typeof window !== 'undefined' && window.location.pathname === RESET_PATH;
  const resetToken = isResetRoute ? new URLSearchParams(window.location.search).get('token') : null;
  const [currentTab, setCurrentTab] = useState<string>(isResetRoute ? 'admin' : 'home');
  const [resetRouteActive, setResetRouteActive] = useState<boolean>(isResetRoute);
  const [properties, setProperties] = useState<Property[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [preselectedBookingProp, setPreselectedBookingProp] = useState<Property | null>(null);
  const [activeFilters, setActiveFilters] = useState<SearchFilters | undefined>(undefined);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Only staff accounts (admin or agent) from the server are stored as adminUser
  const isAuthorizedAdmin = canManageProperties(adminUser);
  const setAuthorizedAdmin = (user: AdminUser | null) => {
    setAdminUser(user && canManageProperties(user) ? user : null);
  };

  // Initialize properties and check for existing verified admin session
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [propsData, authStatus] = await Promise.all([
          fetchProperties(),
          checkAdminSession(),
        ]);
        setProperties(propsData);
        setSavedIds(getSavedPropertyIds());
        if (authStatus.authenticated && authStatus.authorized && authStatus.user) {
          setAuthorizedAdmin(authStatus.user);
        }
      } catch (err) {
        console.error('Error loading initial application data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleNavigate = (tab: string, filters?: SearchFilters) => {
    setCurrentTab(tab);
    if (filters) {
      setActiveFilters(filters);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleSave = (id: string) => {
    const updated = toggleSaveProperty(id);
    setSavedIds(updated);
  };

  const handleSelectProperty = (property: Property) => {
    setSelectedProperty(property);
  };

  const handleBookViewing = (property: Property) => {
    setPreselectedBookingProp(property);
    setSelectedProperty(null);
    setCurrentTab('book');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePropertyAdded = (newProp: Property) => {
    setProperties((prev) => [newProp, ...prev]);
  };

  const handlePropertyUpdated = (updatedProp: Property) => {
    setProperties((prev) =>
      prev.map((p) => {
        const pId = p._id || p.id;
        const uId = updatedProp._id || updatedProp.id;
        return pId === uId ? updatedProp : p;
      })
    );
  };

  const handlePropertyDeleted = (deletedId: string) => {
    setProperties((prev) => prev.filter((p) => p._id !== deletedId && p.id !== deletedId));
  };

  const handleSignOut = async () => {
    await logoutAdmin();
    setAdminUser(null);
    if (currentTab === 'admin') {
      setCurrentTab('home');
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-neutral-50 text-neutral-900 font-sans selection:bg-brand-900 selection:text-white">
      {/* Top Navigation (transparent overlay on the home hero) */}
      <Navbar
        currentTab={currentTab}
        onNavigate={handleNavigate}
        savedCount={savedIds.length}
        adminUser={adminUser}
        onSignOut={handleSignOut}
        transparent={currentTab === 'home'}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentTab === 'home' && (
          <HomePage
            properties={properties}
            savedIds={savedIds}
            onToggleSave={handleToggleSave}
            onSelectProperty={handleSelectProperty}
            onNavigate={handleNavigate}
          />
        )}

        {currentTab === 'properties' && (
          <PropertiesPage
            properties={properties}
            savedIds={savedIds}
            onToggleSave={handleToggleSave}
            onSelectProperty={handleSelectProperty}
            initialFilters={activeFilters}
          />
        )}

        {currentTab === 'about' && (
          <AboutPage
            onBrowseProperties={() => handleNavigate('properties')}
            onContactUs={() => handleNavigate('contact')}
          />
        )}

        {currentTab === 'book' && (
          <BookingPage
            preselectedProperty={preselectedBookingProp}
            properties={properties}
            onBrowseMore={() => handleNavigate('properties')}
          />
        )}

        {currentTab === 'contact' && <ContactPage />}

        {currentTab === 'add-property' &&
          (isAuthorizedAdmin && adminUser ? (
            <AddPropertyPage
              adminUser={adminUser}
              onPropertyAdded={handlePropertyAdded}
              onBrowseProperties={() => handleNavigate('properties')}
            />
          ) : (
            <AdminLoginPage
              initialMessage="Administrator Authentication Required: Please sign in with an authorized email account to add property listings."
              onLoginSuccess={(user) => {
                setAuthorizedAdmin(user);
                setCurrentTab('add-property');
              }}
              onReturnHome={() => handleNavigate('home')}
            />
          ))}

        {currentTab === 'saved' && (
          <SavedPropertiesPage
            properties={properties}
            savedIds={savedIds}
            onToggleSave={handleToggleSave}
            onSelectProperty={handleSelectProperty}
            onBrowseMore={() => handleNavigate('properties')}
          />
        )}

        {/* Administration Portal Routing */}
        {currentTab === 'admin' && resetRouteActive && (
          <AdminLoginPage
            resetToken={resetToken}
            onLoginSuccess={(user) => {
              setAuthorizedAdmin(user);
              setCurrentTab('admin');
            }}
            onResetComplete={() => {
              window.history.replaceState(null, '', '/');
              setResetRouteActive(false);
            }}
            onReturnHome={() => {
              window.history.replaceState(null, '', '/');
              setResetRouteActive(false);
              handleNavigate('home');
            }}
          />
        )}

        {currentTab === 'admin' &&
          !resetRouteActive &&
          (isAuthorizedAdmin && adminUser ? (
            <AdminDashboardPage
              adminUser={adminUser}
              properties={properties}
              onPropertyAdded={handlePropertyAdded}
              onPropertyUpdated={handlePropertyUpdated}
              onPropertyDeleted={handlePropertyDeleted}
              onSignOut={handleSignOut}
              onViewProperty={handleSelectProperty}
            />
          ) : (
            <AdminLoginPage
              onLoginSuccess={(user) => {
                setAuthorizedAdmin(user);
                setCurrentTab('admin');
              }}
              onReturnHome={() => handleNavigate('home')}
            />
          ))}

      </main>

      {/* Global Property Detail Modal */}
      {selectedProperty && (
        <PropertyDetailModal
          property={selectedProperty}
          isSaved={savedIds.includes(selectedProperty._id || selectedProperty.id || '')}
          onToggleSave={handleToggleSave}
          onClose={() => setSelectedProperty(null)}
          onBookViewing={handleBookViewing}
        />
      )}

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
