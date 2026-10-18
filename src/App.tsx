import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { ProductGrid } from './components/ProductGrid';
import { ProductDetailPage } from './components/ProductDetailPage';
import { LocationSection } from './components/LocationSection';
import { Footer } from './components/Footer';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { Product, SiteSettings } from './types';
import { StorageService } from './services/storage';
import { MessageCircle } from 'lucide-react';

export default function App() {
  // Store Data
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(() => StorageService.getSettings());

  // Navigation State
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Secret Admin Modal State
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Load persistent data & subscribe to real-time updates across all devices
  const refreshAllData = () => {
    setProducts(StorageService.getProducts());
    setSettings(StorageService.getSettings());
  };

  useEffect(() => {
    const unsubscribe = StorageService.subscribe((data) => {
      setProducts(data.products);
      setSettings(data.settings);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Navigation Handlers
  const handleNavigateHome = () => {
    setSelectedProduct(null);
    setActiveCategory('all');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateCategory = (cat: string) => {
    setActiveCategory(cat);
    setSelectedProduct(null);
    const elem = document.getElementById('collection-grid');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 400, behavior: 'smooth' });
    }
  };

  const handleNavigateLocation = () => {
    setSelectedProduct(null);
    const elem = document.getElementById('location-section');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    } else {
      setTimeout(() => {
        document.getElementById('location-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGeneralWhatsApp = () => {
    const text = encodeURIComponent(
      'Hello Jouri Boutique, I would like to inquire about your collection in Broumana. Thank you!'
    );
    window.open(`https://wa.me/${settings.whatsappNumber}?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#24201D] font-sans antialiased selection:bg-[#E8DFD5] selection:text-[#1F1C18]">
      {/* 1. Minimal Header / Navbar */}
      <Navbar
        settings={settings}
        onNavigateCategory={handleNavigateCategory}
        onNavigateHome={handleNavigateHome}
        onNavigateLocation={handleNavigateLocation}
      />

      {/* Main Body */}
      <main className="flex-1">
        {selectedProduct ? (
          /* 2. Product Detail Page */
          <ProductDetailPage
            product={selectedProduct}
            settings={settings}
            onBack={() => setSelectedProduct(null)}
            onSelectCategory={handleNavigateCategory}
            relatedProducts={products.filter((p) => p.id !== selectedProduct.id)}
            onSelectProduct={handleSelectProduct}
          />
        ) : (
          /* 3. Ultra-Clean Storefront */
          <>
            {/* Hero Banner */}
            <HeroBanner
              settings={settings}
              onExplore={() => {
                document.getElementById('collection-grid')?.scrollIntoView({ behavior: 'smooth' });
              }}
              onWhatsApp={handleGeneralWhatsApp}
            />

            {/* 2-Column Mobile Product Catalog Grid */}
            <ProductGrid
              products={products}
              activeCategory={activeCategory}
              onSelectCategory={setActiveCategory}
              exchangeRate={settings.usdToLbpRate}
              whatsappNumber={settings.whatsappNumber}
              onSelectProduct={handleSelectProduct}
            />

            {/* Location & Atelier Section (Broumana, Mar Chaaya) */}
            <LocationSection settings={settings} />
          </>
        )}
      </main>

      {/* 4. Footer */}
      <Footer
        settings={settings}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onNavigateHome={handleNavigateHome}
        onNavigateLocation={handleNavigateLocation}
      />

      {/* Persistent Floating WhatsApp Concierge Button (Dynamic) */}
      {Boolean(settings.whatsappNumber?.trim()) && (
        <button
          onClick={handleGeneralWhatsApp}
          className="fixed bottom-5 right-5 z-30 flex items-center gap-2 p-3.5 sm:px-4 sm:py-3 bg-[#25D366] hover:bg-[#20ba5a] text-white font-medium rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer"
          title="WhatsApp Order"
          aria-label="Direct WhatsApp Order"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">
            WhatsApp Order
          </span>
        </button>
      )}

      {/* Secret Admin Panel Modal (Protected by PIN code) */}
      {isAdminOpen && (
        <AdminDashboard
          onClose={() => setIsAdminOpen(false)}
          products={products}
          settings={settings}
          onRefreshData={refreshAllData}
        />
      )}
    </div>
  );
}
