import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  Plus,
  Trash2,
  Edit3,
  X,
  Save,
  Check,
  AlertCircle,
  ExternalLink,
  DollarSign,
  Phone,
  Instagram,
  MapPin,
  RefreshCw,
  LogOut,
  ChevronRight,
  Database,
  Shield,
  ShieldAlert,
  UserCheck,
  KeyRound,
  Eye,
  EyeOff,
  MessageCircle
} from 'lucide-react';
import { Product, SiteSettings, AdminRole } from '../../types';
import { StorageService, formatUSD, formatLBP, handleImageFallback } from '../../services/storage';
import { FASHION_PRESETS, DEFAULT_FALLBACK_IMAGE } from '../../data/mockData';

interface AdminDashboardProps {
  onClose: () => void;
  products: Product[];
  settings: SiteSettings;
  onRefreshData: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onClose,
  products,
  settings,
  onRefreshData,
}) => {
  // Authentication & Role State
  const [currentRole, setCurrentRole] = useState<AdminRole | null>(() => StorageService.getAdminRole());
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Active Admin View: 'products' | 'settings' | 'supabase'
  const [activeTab, setActiveTab] = useState<'products' | 'settings' | 'supabase'>('products');

  // Product CRUD Modals
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Form State for Add / Edit
  const [productForm, setProductForm] = useState<{
    title: string;
    subtitle: string;
    priceUSD: number;
    category: string;
    images: string;
    sizes: string;
    inStock: boolean;
  }>({
    title: '',
    subtitle: '',
    priceUSD: 85,
    category: 'Dresses',
    images: '',
    sizes: 'S, M, L, XL',
    inStock: true,
  });

  // Settings Form State (Super Admin Only)
  const [settingsForm, setSettingsForm] = useState<SiteSettings>(settings);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Dedicated Master PIN / Password Change State
  const [newMasterPin, setNewMasterPin] = useState('');
  const [confirmMasterPin, setConfirmMasterPin] = useState('');
  const [showNewPin, setShowNewPin] = useState(false);
  const [pinChangeError, setPinChangeError] = useState('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState(false);

  // Handle PIN Submission with Dual Role Verification
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const verifiedRole = StorageService.verifyAdminPin(pinInput);
    if (verifiedRole) {
      StorageService.setAdminRole(verifiedRole);
      setCurrentRole(verifiedRole);
      setPinError('');
      setPinInput('');
    } else {
      setPinError('Incorrect PIN code. Please verify your credentials.');
    }
  };

  const handleLogout = () => {
    StorageService.setAdminRole(null);
    setCurrentRole(null);
    setPinInput('');
  };

  // Open Edit Product
  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setIsCreatingProduct(false);
    setProductForm({
      title: p.title,
      subtitle: p.subtitle || '',
      priceUSD: p.priceUSD,
      category: p.category,
      images: p.images.join(', '),
      sizes: p.sizes.join(', '),
      inStock: p.inStock,
    });
  };

  // Open Create Product
  const openCreateModal = () => {
    setEditingProduct(null);
    setIsCreatingProduct(true);
    setProductForm({
      title: '',
      subtitle: '',
      priceUSD: 95,
      category: 'Dresses',
      images: '/src/assets/images/product_silk_pleated_dress_1792241564244.jpg',
      sizes: 'S, M, L, XL',
      inStock: true,
    });
  };

  // Save Product (Both Super Admin and Staff are permitted)
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedImages = productForm.images
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const parsedSizes = productForm.sizes
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingProduct) {
      StorageService.updateProduct({
        ...editingProduct,
        title: productForm.title,
        subtitle: productForm.subtitle,
        priceUSD: Number(productForm.priceUSD),
        category: productForm.category,
        images: parsedImages.length ? parsedImages : ['/src/assets/images/product_silk_pleated_dress_1792241564244.jpg'],
        sizes: parsedSizes.length ? parsedSizes : ['S', 'M', 'L'],
        inStock: productForm.inStock,
      });
    } else {
      StorageService.addProduct({
        title: productForm.title,
        subtitle: productForm.subtitle,
        priceUSD: Number(productForm.priceUSD),
        category: productForm.category,
        images: parsedImages.length ? parsedImages : ['/src/assets/images/product_silk_pleated_dress_1792241564244.jpg'],
        sizes: parsedSizes.length ? parsedSizes : ['S', 'M', 'L'],
        inStock: productForm.inStock,
      });
    }

    setEditingProduct(null);
    setIsCreatingProduct(false);
    onRefreshData();
  };

  // Confirm Delete Product (Super Admin permitted; Staff can also delete with confirmation or prompt)
  const handleConfirmDelete = () => {
    if (deletingProduct) {
      StorageService.deleteProduct(deletingProduct.id);
      setDeletingProduct(null);
      onRefreshData();
    }
  };

  // Save Settings (Strictly Super Admin Only)
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentRole !== 'super_admin') {
      alert('Permission Denied: Only Super Admin can modify site settings, exchange rates, or social media links.');
      return;
    }
    StorageService.saveSettings(settingsForm);
    setSettingsSuccess(true);
    setTimeout(() => setSettingsSuccess(false), 2500);
    onRefreshData();
  };

  // Dedicated Master PIN / Password Update Handler
  const handleUpdateMasterPin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinChangeError('');
    if (!newMasterPin.trim()) {
      setPinChangeError('PIN / Password cannot be empty.');
      return;
    }
    if (newMasterPin.trim().length < 4) {
      setPinChangeError('Password / PIN must be at least 4 characters long.');
      return;
    }
    if (newMasterPin !== confirmMasterPin) {
      setPinChangeError('New PINs do not match. Please verify both fields.');
      return;
    }
    const updated: SiteSettings = {
      ...settingsForm,
      adminPin: newMasterPin.trim(),
    };
    StorageService.saveSettings(updated);
    setSettingsForm(updated);
    setNewMasterPin('');
    setConfirmMasterPin('');
    setPinChangeSuccess(true);
    setTimeout(() => setPinChangeSuccess(false), 3500);
    onRefreshData();
  };

  // Immediate Clear / Delete social media link or phone field
  const handleClearField = (field: keyof SiteSettings, label: string) => {
    const updated: SiteSettings = {
      ...settingsForm,
      [field]: '',
    };
    setSettingsForm(updated);
    StorageService.saveSettings(updated);
    setSettingsSuccess(true);
    setTimeout(() => setSettingsSuccess(false), 2500);
    onRefreshData();
  };

  // 1. PIN ACCESS MODAL (Single masked Master PIN input, zero shortcuts/hints)
  if (!currentRole) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="relative w-full max-w-sm bg-[#FAF7F2] border border-[#E8DFD5] rounded-2xl p-6 sm:p-8 shadow-2xl text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-800 rounded-full cursor-pointer transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 bg-[#F2ECE4] text-[#24201D] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#E2D8CC]">
            <Lock className="w-6 h-6 text-[#B89772]" />
          </div>

          <h3 className="font-serif text-2xl text-[#24201D] mb-1">
            Boutique Console
          </h3>
          <p className="text-xs text-stone-500 mb-6 font-light">
            Enter your secret security PIN to continue
          </p>

          {pinError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{pinError}</span>
            </div>
          )}

          {/* SINGLE HIDDEN MASTER PIN INPUT with type="password" */}
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                inputMode="numeric"
                maxLength={12}
                autoFocus
                required
                placeholder="••••"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full text-center text-2xl tracking-[0.4em] py-3.5 px-4 bg-white border border-[#D8C7B5] rounded-xl focus:outline-none focus:border-[#24201D] font-mono text-[#24201D] transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#24201D] hover:bg-[#3D3732] text-white text-xs font-semibold uppercase tracking-[0.16em] rounded-xl transition-colors cursor-pointer shadow-sm"
            >
              Unlock
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. UNLOCKED ADMIN PANEL (Role-Based Permissions Enforced)
  const isSuperAdmin = currentRole === 'super_admin';

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#FAF7F2] overflow-hidden animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <header className="h-16 bg-white border-b border-[#E8DFD5] px-4 sm:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-serif text-xl font-medium tracking-[0.18em] text-[#24201D] uppercase">
            JOURI
          </span>

          {/* Role Status Badge */}
          {isSuperAdmin ? (
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider bg-[#24201D] text-white px-2.5 py-1 rounded-md font-semibold">
              <Shield className="w-3 h-3 text-[#B89772]" />
              <span>Super Admin</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider bg-[#F2ECE4] text-stone-800 border border-[#D8C7B5] px-2.5 py-1 rounded-md font-semibold">
              <UserCheck className="w-3 h-3 text-stone-600" />
              <span>Staff (Limited)</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 px-3 py-2 text-stone-600 hover:text-stone-900 rounded-lg hover:bg-[#F5EFE6] transition-colors cursor-pointer text-xs"
            title="Lock Console"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Lock</span>
          </button>
          <button
            onClick={onClose}
            className="px-3.5 py-2 bg-[#24201D] hover:bg-[#3D3732] text-white text-xs font-medium uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
          >
            Exit to Store
          </button>
        </div>
      </header>

      {/* Role-Aware Navigation Tabs */}
      <div className="bg-[#FAF7F2] border-b border-[#E8DFD5] px-4 flex items-center gap-2 overflow-x-auto py-2.5 shrink-0">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'products'
              ? 'bg-[#24201D] text-white shadow-xs'
              : 'bg-white text-stone-600 hover:text-[#24201D] border border-[#E2D8CC]'
          }`}
        >
          Product Catalog ({products.length})
        </button>

        {/* Site Settings Tab: Visible to Super Admin, Locked/Disabled for Staff */}
        <button
          onClick={() => {
            if (isSuperAdmin) {
              setActiveTab('settings');
            } else {
              alert('Access Restricted: Super Admin privileges required to edit site settings, social links, or exchange rates.');
            }
          }}
          className={`px-4 py-2 text-xs font-semibold rounded-lg uppercase tracking-wider transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'settings'
              ? 'bg-[#24201D] text-white shadow-xs'
              : isSuperAdmin
              ? 'bg-white text-stone-600 hover:text-[#24201D] border border-[#E2D8CC] cursor-pointer'
              : 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed opacity-60'
          }`}
        >
          {!isSuperAdmin && <Lock className="w-3 h-3 text-stone-400" />}
          <span>Site Settings & Socials</span>
          {!isSuperAdmin && <span className="text-[9px] bg-stone-200 px-1 py-0.2 rounded text-stone-600">Locked</span>}
        </button>

        {/* Supabase Tab */}
        <button
          onClick={() => {
            if (isSuperAdmin) {
              setActiveTab('supabase');
            } else {
              alert('Access Restricted: Database schema is reserved for Super Admin.');
            }
          }}
          className={`px-4 py-2 text-xs font-semibold rounded-lg uppercase tracking-wider transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'supabase'
              ? 'bg-[#24201D] text-white shadow-xs'
              : isSuperAdmin
              ? 'bg-white text-stone-600 hover:text-[#24201D] border border-[#E2D8CC] cursor-pointer'
              : 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed opacity-60'
          }`}
        >
          {!isSuperAdmin && <Lock className="w-3 h-3 text-stone-400" />}
          <span>Database SQL Schema</span>
        </button>
      </div>

      {/* Main Content Area (Mobile Scrollable) */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
        {/* TAB 1: PRODUCT MANAGEMENT (Both Super Admin and Staff Allowed) */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl text-[#24201D]">
                  Product Catalog
                </h2>
                <p className="text-xs text-stone-500">
                  {isSuperAdmin
                    ? 'Super Admin: Full CRUD control over pieces, prices, and stock.'
                    : 'Staff Access: Add and edit products, update prices, sizes, and stock availability.'}
                </p>
              </div>

              <button
                onClick={openCreateModal}
                className="flex items-center gap-1.5 px-4 py-3 bg-[#24201D] hover:bg-[#3D3732] text-white text-xs font-semibold uppercase tracking-wider rounded-xl shadow-md cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Add Piece</span>
              </button>
            </div>

            {/* Mobile-Optimized Product Cards with Large Touch Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map((p) => {
                const lbpPrice = Math.round(p.priceUSD * settings.usdToLbpRate);
                return (
                  <div
                    key={p.id}
                    className="bg-white border border-[#E8DFD5] rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-4"
                  >
                    <div className="flex gap-4 items-start">
                      {/* Product Image */}
                      <img
                        src={p.images[0]}
                        alt={p.title}
                        referrerPolicy="no-referrer"
                        onError={(e) => handleImageFallback(e)}
                        className="w-20 h-24 sm:w-24 sm:h-28 object-cover rounded-lg bg-[#F5EFE6] border border-[#E2D8CC] shrink-0"
                      />

                      {/* Product Meta */}
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] uppercase tracking-wider text-[#8C7E72] font-semibold block">
                          {p.category}
                        </span>
                        <h4 className="font-serif text-base text-[#24201D] font-normal leading-tight truncate">
                          {p.title}
                        </h4>
                        <div className="mt-1">
                          <span className="text-sm font-bold text-[#24201D] tabular-nums">
                            {formatUSD(p.priceUSD)} USD
                          </span>
                          <span className="text-[11px] text-[#8C7E72] block tabular-nums">
                            ≈ {lbpPrice.toLocaleString()} L.L.
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-1">
                          Sizes: <strong>{p.sizes.join(', ')}</strong>
                        </p>
                        <div className="mt-1">
                          {p.inStock ? (
                            <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                              In Stock
                            </span>
                          ) : (
                            <span className="text-[10px] text-rose-800 font-semibold bg-rose-50 px-2 py-0.5 rounded">
                              Out of Stock
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* LARGE TOUCH TARGET BUTTONS */}
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#F5EFE6]">
                      {/* Edit Button */}
                      <button
                        onClick={() => openEditModal(p)}
                        className="flex items-center justify-center gap-2 py-3 px-4 bg-[#F5EFE6] hover:bg-[#EAE1D5] text-[#24201D] rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer border border-[#E2D8CC]"
                      >
                        <Edit3 className="w-4 h-4 text-[#8C7E72]" />
                        <span>Edit</span>
                      </button>

                      {/* LARGE BRIGHT RED DELETE BUTTON */}
                      <button
                        onClick={() => setDeletingProduct(p)}
                        className="flex items-center justify-center gap-2 py-3 px-4 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border border-rose-200"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: SITE SETTINGS & SOCIAL LINKS (Super Admin Only) */}
        {activeTab === 'settings' && isSuperAdmin && (
          <div className="space-y-6 max-w-3xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-2xl text-[#24201D]">
                  Super Admin Console Settings
                </h2>
                <p className="text-xs text-stone-500">
                  Full control to add, edit, or remove social channels, contact numbers, and security credentials.
                </p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#24201D] text-[#FAF7F2] px-2.5 py-1 rounded">
                Master Access
              </span>
            </div>

            {settingsSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Settings updated successfully! Changes are live across the boutique storefront.</span>
              </div>
            )}

            {/* 1. DEDICATED SECURITY & MASTER PIN / PASSWORD MANAGEMENT */}
            <div className="bg-white border border-[#E8DFD5] rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-[#F2ECE4] text-[#24201D] rounded-xl border border-[#E2D8CC]">
                    <KeyRound className="w-4 h-4 text-[#B89772]" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg text-[#24201D]">
                      Change Master PIN / Password
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Set a new secret code anytime directly from your phone to protect your store.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md font-semibold hidden sm:inline-block">
                  Protected
                </span>
              </div>

              {pinChangeSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Master PIN changed successfully! Please use this new PIN for future logins.</span>
                </div>
              )}

              {pinChangeError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{pinChangeError}</span>
                </div>
              )}

              <form onSubmit={handleUpdateMasterPin} className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-700 font-semibold text-xs mb-1">
                      New Secret PIN / Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPin ? 'text' : 'password'}
                        required
                        maxLength={16}
                        placeholder="Enter new PIN"
                        value={newMasterPin}
                        onChange={(e) => setNewMasterPin(e.target.value)}
                        className="w-full p-2.5 bg-[#FAF7F2] border border-[#D8C7B5] rounded-xl focus:outline-none focus:border-stone-900 font-mono text-xs pr-10 text-stone-900"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPin(!showNewPin)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
                        title={showNewPin ? 'Hide' : 'Show'}
                      >
                        {showNewPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-stone-700 font-semibold text-xs mb-1">
                      Confirm New PIN / Password *
                    </label>
                    <input
                      type={showNewPin ? 'text' : 'password'}
                      required
                      maxLength={16}
                      placeholder="Confirm new PIN"
                      value={confirmMasterPin}
                      onChange={(e) => setConfirmMasterPin(e.target.value)}
                      className="w-full p-2.5 bg-[#FAF7F2] border border-[#D8C7B5] rounded-xl focus:outline-none focus:border-stone-900 font-mono text-xs text-stone-900"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                  <p className="text-[11px] text-stone-400">
                    Your password will be saved instantly to your secure store settings.
                  </p>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-5 py-2.5 bg-[#24201D] hover:bg-[#3D3732] text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-[#B89772]" />
                    <span>Update Master Password</span>
                  </button>
                </div>
              </form>
            </div>

            {/* 2. DYNAMIC CONTACT & SOCIAL MEDIA CONTROL (ADD / EDIT / DELETE) */}
            <form onSubmit={handleSaveSettings} className="bg-white border border-[#E8DFD5] rounded-2xl p-5 sm:p-6 space-y-6 shadow-xs">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#F2ECE4]">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                      Contact & Social Media Channels
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Add, edit, or delete links. Only active channels appear on the website header & footer.
                    </p>
                  </div>
                </div>

                {/* 1. WhatsApp Channel */}
                <div className="p-4 bg-[#FAF7F2] border border-[#E8DFD5] rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                        <MessageCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-stone-800 text-xs">WhatsApp Concierge Line</span>
                        <span className="text-[10px] text-stone-400 block font-normal">International format (e.g. 96181151937)</span>
                      </div>
                    </div>
                    {Boolean(settingsForm.whatsappNumber?.trim()) ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active on Site
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                        Hidden / Removed
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="e.g. 96181151937"
                      value={settingsForm.whatsappNumber || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })}
                      className="flex-1 p-2.5 bg-white border border-[#E2D8CC] rounded-xl focus:outline-none focus:border-stone-900 font-mono text-xs text-stone-900"
                    />
                    {Boolean(settingsForm.whatsappNumber?.trim()) && (
                      <button
                        type="button"
                        onClick={() => handleClearField('whatsappNumber', 'WhatsApp Number')}
                        className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                        title="Delete WhatsApp from site"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Clear / Remove</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. Instagram Profile */}
                <div className="p-4 bg-[#FAF7F2] border border-[#E8DFD5] rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                        <Instagram className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-stone-800 text-xs">Instagram Profile URL</span>
                        <span className="text-[10px] text-stone-400 block font-normal">Direct link to your Instagram page</span>
                      </div>
                    </div>
                    {Boolean(settingsForm.instagramUrl?.trim()) ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active on Site
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                        Hidden / Removed
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="url"
                      placeholder="https://www.instagram.com/jouriboutiquee/"
                      value={settingsForm.instagramUrl || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, instagramUrl: e.target.value })}
                      className="flex-1 p-2.5 bg-white border border-[#E2D8CC] rounded-xl focus:outline-none focus:border-stone-900 font-mono text-xs text-stone-900"
                    />
                    {Boolean(settingsForm.instagramUrl?.trim()) && (
                      <button
                        type="button"
                        onClick={() => handleClearField('instagramUrl', 'Instagram Link')}
                        className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                        title="Delete Instagram link from site"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Clear / Remove</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 3. TikTok Profile */}
                <div className="p-4 bg-[#FAF7F2] border border-[#E8DFD5] rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-stone-900 text-white rounded-lg flex items-center justify-center font-bold text-[10px]">
                        TK
                      </div>
                      <div>
                        <span className="font-semibold text-stone-800 text-xs">TikTok Profile URL</span>
                        <span className="text-[10px] text-stone-400 block font-normal">Direct link to your TikTok page</span>
                      </div>
                    </div>
                    {Boolean(settingsForm.tiktokUrl?.trim()) ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active on Site
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                        Hidden / Removed
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="url"
                      placeholder="https://www.tiktok.com/@jouriboutique"
                      value={settingsForm.tiktokUrl || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, tiktokUrl: e.target.value })}
                      className="flex-1 p-2.5 bg-white border border-[#E2D8CC] rounded-xl focus:outline-none focus:border-stone-900 font-mono text-xs text-stone-900"
                    />
                    {Boolean(settingsForm.tiktokUrl?.trim()) && (
                      <button
                        type="button"
                        onClick={() => handleClearField('tiktokUrl', 'TikTok Link')}
                        className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                        title="Delete TikTok link from site"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Clear / Remove</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 4. Facebook Profile */}
                <div className="p-4 bg-[#FAF7F2] border border-[#E8DFD5] rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-[#1877F2] text-white rounded-lg flex items-center justify-center font-bold text-[10px]">
                        FB
                      </div>
                      <div>
                        <span className="font-semibold text-stone-800 text-xs">Facebook Page URL</span>
                        <span className="text-[10px] text-stone-400 block font-normal">Direct link to your Facebook page</span>
                      </div>
                    </div>
                    {Boolean(settingsForm.facebookUrl?.trim()) ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active on Site
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                        Hidden / Removed
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="url"
                      placeholder="https://www.facebook.com/jouriboutique"
                      value={settingsForm.facebookUrl || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, facebookUrl: e.target.value })}
                      className="flex-1 p-2.5 bg-white border border-[#E2D8CC] rounded-xl focus:outline-none focus:border-stone-900 font-mono text-xs text-stone-900"
                    />
                    {Boolean(settingsForm.facebookUrl?.trim()) && (
                      <button
                        type="button"
                        onClick={() => handleClearField('facebookUrl', 'Facebook Link')}
                        className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                        title="Delete Facebook link from site"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Clear / Remove</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. EXCHANGE RATE & ATELIER LOCATION */}
              <div className="space-y-4 pt-4 border-t border-[#F2ECE4]">
                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                  Currency & Physical Atelier Settings
                </h3>

                {/* Exchange Rate */}
                <div className="p-4 bg-[#F8F5F0] rounded-xl border border-[#E2D8CC] space-y-1.5">
                  <label className="block text-stone-800 font-bold text-xs uppercase tracking-wider">
                    Exchange Rate ($1 USD to LBP) *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      required
                      min={1000}
                      step={500}
                      value={settingsForm.usdToLbpRate}
                      onChange={(e) => setSettingsForm({ ...settingsForm, usdToLbpRate: Number(e.target.value) })}
                      className="w-full p-3 text-base font-mono font-bold bg-white border border-[#D8C7B5] rounded-xl focus:outline-none text-stone-900"
                    />
                    <span className="text-xs text-stone-500 font-semibold whitespace-nowrap">L.L. / $1</span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Dual prices across all product cards and checkout recalculate immediately.
                  </p>
                </div>

                {/* Address Text */}
                <div>
                  <label className="block text-stone-700 font-semibold text-xs mb-1">
                    Boutique Physical Address Text
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Broumana, Mar Chaaya, Next to coop"
                    value={settingsForm.addressText}
                    onChange={(e) => setSettingsForm({ ...settingsForm, addressText: e.target.value })}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E2D8CC] rounded-xl focus:outline-none text-xs text-stone-900"
                  />
                </div>

                {/* Google Maps URL */}
                <div>
                  <label className="block text-stone-700 font-semibold text-xs mb-1">
                    Google Maps Location Link
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      placeholder="https://maps.app.goo.gl/ASXXjPzwhJYC3oL77"
                      value={settingsForm.googleMapsUrl || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, googleMapsUrl: e.target.value })}
                      className="flex-1 p-2.5 bg-[#FAF7F2] border border-[#E2D8CC] rounded-xl focus:outline-none font-mono text-xs text-stone-900"
                    />
                    {Boolean(settingsForm.googleMapsUrl?.trim()) && (
                      <button
                        type="button"
                        onClick={() => handleClearField('googleMapsUrl', 'Google Maps Link')}
                        className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                        title="Remove Google Maps link"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Clear</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-[#24201D] hover:bg-[#3D3732] text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4 text-[#B89772]" />
                <span>Save All Site Settings & Channels</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: SUPABASE SQL SCHEMA (Super Admin Only) */}
        {activeTab === 'supabase' && isSuperAdmin && (
          <div className="space-y-4 max-w-3xl">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl text-[#24201D]">
                Database SQL Schema (Supabase / PostgreSQL)
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-stone-900 text-stone-200 px-2 py-1 rounded">
                Migration Query
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Run this SQL query in your Supabase SQL editor to ensure your database supports updating or removing social channels, credentials, and settings:
            </p>

            <div className="p-4 bg-stone-900 text-stone-200 rounded-xl font-mono text-xs overflow-x-auto shadow-md space-y-3">
              <div className="text-[#B89772] font-bold">-- 1. Alter site_settings table schema:</div>
              <pre>{`ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS admin_pin TEXT DEFAULT '2026',
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT DEFAULT '96181151937',
ADD COLUMN IF NOT EXISTS instagram_url TEXT DEFAULT 'https://www.instagram.com/jouriboutiquee/',
ADD COLUMN IF NOT EXISTS tiktok_url TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS facebook_url TEXT DEFAULT '';`}</pre>

              <div className="text-stone-400 pt-2 font-bold">-- 2. Full table creation structure:</div>
              <pre>{`CREATE TABLE IF NOT EXISTS site_settings (
  id INT PRIMARY KEY DEFAULT 1,
  admin_pin TEXT DEFAULT '2026',
  whatsapp_number TEXT DEFAULT '96181151937',
  instagram_url TEXT DEFAULT 'https://www.instagram.com/jouriboutiquee/',
  tiktok_url TEXT DEFAULT '',
  facebook_url TEXT DEFAULT '',
  usd_to_lbp_rate NUMERIC DEFAULT 89500,
  address_text TEXT DEFAULT 'Broumana, Mar Chaaya, Next to coop',
  google_maps_url TEXT DEFAULT 'https://maps.app.goo.gl/ASXXjPzwhJYC3oL77'
);

CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  price_usd NUMERIC NOT NULL,
  category TEXT NOT NULL,
  images TEXT[] NOT NULL,
  sizes TEXT[] NOT NULL,
  in_stock BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`}</pre>
            </div>
          </div>
        )}
      </main>

      {/* CREATE / EDIT MODAL (Available to both Super Admin and Staff) */}
      {(isCreatingProduct || editingProduct) && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#FAF7F2] border border-[#E8DFD5] rounded-2xl p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DFD5] mb-4">
              <h3 className="font-serif text-xl text-[#24201D]">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setIsCreatingProduct(false);
                }}
                className="p-2 text-stone-500 hover:text-stone-900 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ivory Sunburst Pleated Gown"
                  value={productForm.title}
                  onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                  className="w-full p-3 bg-white border border-[#E2D8CC] rounded-xl focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Short Subtitle</label>
                <input
                  type="text"
                  placeholder="e.g. Flowing accordion pleats in liquid silk crepe"
                  value={productForm.subtitle}
                  onChange={(e) => setProductForm({ ...productForm, subtitle: e.target.value })}
                  className="w-full p-3 bg-white border border-[#E2D8CC] rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Price (USD $) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={productForm.priceUSD}
                    onChange={(e) => setProductForm({ ...productForm, priceUSD: Number(e.target.value) })}
                    className="w-full p-3 bg-white border border-[#E2D8CC] rounded-xl focus:outline-none font-bold text-sm"
                  />
                  <span className="text-[10px] text-[#8C7E72] mt-0.5 block">
                    ≈ {formatLBP(productForm.priceUSD || 0, settings.usdToLbpRate)}
                  </span>
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Category *</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full p-3 bg-white border border-[#E2D8CC] rounded-xl focus:outline-none text-xs"
                  >
                    <option value="Dresses">Dresses</option>
                    <option value="Handmade">Handmade</option>
                    <option value="Sets & Suits">Sets & Suits</option>
                    <option value="Abayas">Abayas</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Image URL (High-quality online fashion photo URL) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    required
                    value={productForm.images}
                    onChange={(e) => setProductForm({ ...productForm, images: e.target.value })}
                    placeholder="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80"
                    className="flex-1 p-3 bg-white border border-[#E2D8CC] rounded-xl focus:outline-none font-mono text-xs"
                  />
                  {Boolean(productForm.images.trim()) && (
                    <div className="w-11 h-11 rounded-lg overflow-hidden border border-[#E2D8CC] shrink-0 bg-[#F5EFE6]">
                      <img
                        src={productForm.images.split(',')[0].trim()}
                        alt="Preview"
                        referrerPolicy="no-referrer"
                        onError={(e) => handleImageFallback(e)}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Curated Sample Fashion Image Presets */}
                <div className="mt-2.5 space-y-1.5">
                  <span className="text-[10px] text-stone-500 font-semibold uppercase tracking-wider block">
                    Or select a curated fashion sample:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {FASHION_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() =>
                          setProductForm({
                            ...productForm,
                            images: preset.url,
                            category: preset.category || productForm.category,
                          })
                        }
                        className={`text-[10.5px] px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                          productForm.images === preset.url
                            ? 'bg-[#24201D] text-white border-[#24201D] shadow-xs'
                            : 'bg-white text-stone-700 border-[#E2D8CC] hover:border-stone-400 hover:bg-[#FAF7F2]'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-[#B89772]" />
                        <span>{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Sizes (Comma separated) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="S, M, L, XL"
                  value={productForm.sizes}
                  onChange={(e) => setProductForm({ ...productForm, sizes: e.target.value })}
                  className="w-full p-3 bg-white border border-[#E2D8CC] rounded-xl focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="inStockCheck"
                  checked={productForm.inStock}
                  onChange={(e) => setProductForm({ ...productForm, inStock: e.target.checked })}
                  className="rounded text-[#24201D] w-4 h-4 cursor-pointer"
                />
                <label htmlFor="inStockCheck" className="text-stone-700 font-medium cursor-pointer">
                  Available in Stock
                </label>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#E8DFD5]">
                <button
                  type="button"
                  onClick={() => {
                    setEditingProduct(null);
                    setIsCreatingProduct(false);
                  }}
                  className="py-3 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-3 bg-[#24201D] hover:bg-[#3D3732] text-white rounded-xl font-semibold cursor-pointer"
                >
                  {editingProduct ? 'Save Changes' : 'Create Piece'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingProduct && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-white border border-rose-200 rounded-2xl p-6 text-center shadow-2xl space-y-4">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h4 className="font-serif text-xl text-stone-900 font-normal">
                Delete this piece?
              </h4>
              <p className="text-xs text-stone-500 mt-1">
                "{deletingProduct.title}" will be permanently removed from your catalog.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setDeletingProduct(null)}
                className="py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
