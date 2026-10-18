import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { INITIAL_PRODUCTS, INITIAL_SETTINGS, INITIAL_CATEGORIES } from './src/data/mockData.js';
import { Product, SiteSettings } from './src/types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

app.use(express.json({ limit: '10mb' }));

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface StoreData {
  products: Product[];
  settings: SiteSettings;
  lastUpdated: number;
}

// Read database from disk or initialize
function getStoreData(): StoreData {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(content);
      if (Array.isArray(data.products) && data.settings) {
        return data;
      }
    }
  } catch (err) {
    console.error('Error reading store.json, re-initializing:', err);
  }

  const initialData: StoreData = {
    products: INITIAL_PRODUCTS,
    settings: INITIAL_SETTINGS,
    lastUpdated: Date.now(),
  };
  saveStoreData(initialData);
  return initialData;
}

// Save database atomically to disk
function saveStoreData(data: StoreData): void {
  try {
    data.lastUpdated = Date.now();
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Error saving store.json:', err);
  }
}

// Real-time SSE Clients
const sseClients = new Set<Response>();

function broadcastUpdate(storeData: StoreData) {
  const payload = JSON.stringify({
    type: 'update',
    products: storeData.products,
    settings: storeData.settings,
    lastUpdated: storeData.lastUpdated,
  });

  for (const client of sseClients) {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}

// REST API ENDPOINTS

// 1. Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// 2. Real-time Server-Sent Events stream
app.get('/api/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders?.();

  const store = getStoreData();
  // Send immediate current state on connection
  const initialPayload = JSON.stringify({
    type: 'sync',
    products: store.products,
    settings: store.settings,
    lastUpdated: store.lastUpdated,
  });
  res.write(`data: ${initialPayload}\n\n`);

  sseClients.add(res);

  // Heartbeat keep-alive every 20 seconds
  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(heartbeat);
      sseClients.delete(res);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
});

// 3. Full store state
app.get('/api/state', (_req: Request, res: Response) => {
  const store = getStoreData();
  res.json({
    products: store.products,
    settings: store.settings,
    categories: INITIAL_CATEGORIES,
    lastUpdated: store.lastUpdated,
  });
});

// 4. Products endpoints
app.get('/api/products', (_req: Request, res: Response) => {
  const store = getStoreData();
  res.json(store.products);
});

app.post('/api/products', (req: Request, res: Response) => {
  const store = getStoreData();
  const rawProduct = req.body;
  if (!rawProduct || !rawProduct.title) {
    res.status(400).json({ error: 'Title is required' });
    return;
  }

  const newProduct: Product = {
    id: rawProduct.id || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: rawProduct.title.trim(),
    subtitle: rawProduct.subtitle || '',
    priceUSD: Number(rawProduct.priceUSD) || 50,
    category: rawProduct.category || 'Dresses',
    images: Array.isArray(rawProduct.images) && rawProduct.images.length > 0 ? rawProduct.images : [rawProduct.image || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80'],
    sizes: Array.isArray(rawProduct.sizes) ? rawProduct.sizes : ['S', 'M', 'L'],
    inStock: rawProduct.inStock !== false,
    createdAt: rawProduct.createdAt || new Date().toISOString(),
  };

  store.products.unshift(newProduct);
  saveStoreData(store);
  broadcastUpdate(store);
  res.status(201).json(newProduct);
});

app.put('/api/products/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const store = getStoreData();
  const index = store.products.findIndex((p) => p.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  const updated: Product = {
    ...store.products[index],
    ...req.body,
    id, // Keep immutable ID
  };

  store.products[index] = updated;
  saveStoreData(store);
  broadcastUpdate(store);
  res.json(updated);
});

app.delete('/api/products/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const store = getStoreData();
  const initialLength = store.products.length;
  store.products = store.products.filter((p) => p.id !== id);

  if (store.products.length === initialLength) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  saveStoreData(store);
  broadcastUpdate(store);
  res.json({ success: true, deletedId: id });
});

// 5. Settings endpoints
app.get('/api/settings', (_req: Request, res: Response) => {
  const store = getStoreData();
  res.json(store.settings);
});

app.put('/api/settings', (req: Request, res: Response) => {
  const store = getStoreData();
  const incoming = req.body;

  store.settings = {
    ...store.settings,
    ...incoming,
    // Preserve adminPin if not provided
    adminPin: incoming.adminPin !== undefined ? incoming.adminPin : store.settings.adminPin,
    usdToLbpRate: Number(incoming.usdToLbpRate) || store.settings.usdToLbpRate || 89500,
  };

  saveStoreData(store);
  broadcastUpdate(store);
  res.json(store.settings);
});

// 6. PIN verification endpoint
app.post('/api/verify-pin', (req: Request, res: Response) => {
  const { pin } = req.body;
  const store = getStoreData();
  const cleanPin = typeof pin === 'string' ? pin.trim() : '';

  if (cleanPin === (store.settings.adminPin || '2026').trim()) {
    res.json({ role: 'super_admin', valid: true });
    return;
  }
  if (cleanPin === (store.settings.staffPin || '5555').trim()) {
    res.json({ role: 'staff', valid: true });
    return;
  }
  res.status(401).json({ role: null, valid: false, message: 'Invalid password or PIN' });
});

// 7. Dedicated Admin password change endpoint with strict validation & global persistent sync
app.post('/api/admin/change-password', (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const store = getStoreData();

  const currentAdminPin = (store.settings.adminPin || '2026').trim();
  const providedCurrent = typeof currentPassword === 'string' ? currentPassword.trim() : '';
  const providedNew = typeof newPassword === 'string' ? newPassword.trim() : '';

  if (!providedCurrent) {
    res.status(400).json({ success: false, error: 'Please enter your current password.' });
    return;
  }

  if (providedCurrent !== currentAdminPin) {
    res.status(401).json({ success: false, error: 'Current password is incorrect. Please check your credentials.' });
    return;
  }

  if (!providedNew || providedNew.length < 4) {
    res.status(400).json({ success: false, error: 'New password must be at least 4 characters long.' });
    return;
  }

  if (providedNew === currentAdminPin) {
    res.status(400).json({ success: false, error: 'New password cannot be the same as your current password.' });
    return;
  }

  // Persist updated password into global persistent database
  store.settings.adminPin = providedNew;
  saveStoreData(store);
  broadcastUpdate(store);

  res.json({
    success: true,
    message: 'Super Admin password updated successfully and synced globally across all devices.',
  });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Jouri Boutique server running on http://0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
