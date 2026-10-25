import React, { useState, useEffect, useRef } from 'react';
import { 
  Wrench, Users, Package, DollarSign, BarChart3, Settings, Plus, Search, 
  Printer, MessageSquare, Trash2, Edit, Save, RefreshCw, Download, Upload, 
  CheckCircle, Clock, AlertTriangle, ShieldCheck, Smartphone, Laptop, 
  ShoppingBag, FileText, ChevronRight, X, Camera, Lock, Check
} from 'lucide-react';

// --- TYPES ---
interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  type: 'Customer' | 'Technician';
}

interface PartItem {
  id: string;
  name: string;
  purchasePrice: number;
  salePrice: number;
  stock: number;
}

interface JobSheet {
  id: string;
  ticketNo: string;
  customerName: string;
  customerPhone: string;
  deviceType: 'Mobile' | 'Laptop' | 'Other';
  brand: string;
  model: string;
  serialNo: string;
  problem: string;
  lockType: 'Password' | 'Pin' | 'Pattern';
  lockValue: string; // e.g. "1-2-3-5-7" for pattern
  technician: string;
  repairCost: number;
  partsUsed: { partId: string; name: string; price: number; qty: number }[];
  advancePaid: number;
  status: 'Checking' | 'Pending Parts' | 'Repairing' | 'Ready' | 'Delivered' | 'Cancelled';
  rackNo: string;
  notes: string;
  date: string;
}

interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
  notes: string;
}

interface ShopSettings {
  shopName: string;
  gstin: string;
  phone: string;
  email: string;
  address: string;
  invoicePrefix: string;
  currency: string;
}

export default function App() {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'jobs' | 'pos' | 'customers' | 'stock' | 'expenses' | 'reports' | 'settings'>('dashboard');
  
  // Settings
  const [settings, setSettings] = useState<ShopSettings>(() => {
    const saved = localStorage.getItem('viraj_settings');
    return saved ? JSON.parse(saved) : {
      shopName: 'VIRAJ CONNECT',
      gstin: '07AAAAA0000A1Z5',
      phone: '+91 9876543210',
      email: 'virajconnect.in@gmail.com',
      address: 'Main Market, Mobile & Repair Hub, India',
      invoicePrefix: 'VC-',
      currency: '₹'
    };
  });

  // Customers & Technicians
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('viraj_customers');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Rahul Sharma', phone: '9876543210', address: 'Delhi', type: 'Customer' },
      { id: '2', name: 'Amit Kumar (Tech)', phone: '9123456789', address: 'Shop Floor', type: 'Technician' }
    ];
  });

  // Stock / Parts
  const [stockItems, setStockItems] = useState<PartItem[]>(() => {
    const saved = localStorage.getItem('viraj_stock');
    return saved ? JSON.parse(saved) : [
      { id: 'p1', name: 'Fast Charger 33W', purchasePrice: 250, salePrice: 499, stock: 15 },
      { id: 'p2', name: 'TWS Earbuds Pro', purchasePrice: 450, salePrice: 999, stock: 8 },
      { id: 'p3', name: 'Mobile Display OLED', purchasePrice: 1200, salePrice: 2200, stock: 5 },
      { id: 'p4', name: 'Tempered Glass UV', purchasePrice: 50, salePrice: 200, stock: 30 }
    ];
  });

  // Job Sheets
  const [jobs, setJobs] = useState<JobSheet[]>(() => {
    const saved = localStorage.getItem('viraj_jobs');
    return saved ? JSON.parse(saved) : [
      {
        id: 'j1',
        ticketNo: 'VC-1001',
        customerName: 'Rahul Sharma',
        customerPhone: '9876543210',
        deviceType: 'Mobile',
        brand: 'OnePlus',
        model: 'Nord CE 3',
        serialNo: 'OP987654',
        problem: 'Display Broken & Touch Not Working',
        lockType: 'Pattern',
        lockValue: '1-2-5-8',
        technician: 'Amit Kumar (Tech)',
        repairCost: 1800,
        partsUsed: [{ partId: 'p3', name: 'Mobile Display OLED', price: 2200, qty: 1 }],
        advancePaid: 500,
        status: 'Repairing',
        rackNo: 'Rack-A2',
        notes: 'Customer agreed for display replacement.',
        date: new Date().toISOString().split('T')[0]
      }
    ];
  });

  // Expenses
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('viraj_expenses');
    return saved ? JSON.parse(saved) : [
      { id: 'e1', category: 'Rent', amount: 5000, date: new Date().toISOString().split('T')[0], notes: 'Shop Monthly Rent' }
    ];
  });

  // POS Direct Sales Cart
  const [posCart, setPosCart] = useState<{ partId: string; name: string; price: number; qty: number }[]>([]);
  const [posCustomerName, setPosCustomerName] = useState('');
  const [posCustomerPhone, setPosCustomerPhone] = useState('');

  // New Job Form State
  const [showJobModal, setShowJobModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [deviceType, setDeviceType] = useState<'Mobile' | 'Laptop' | 'Other'>('Mobile');
  const [brand, setBrand] = useState('Samsung');
  const [model, setModel] = useState('');
  const [serialNo, setSerialNo] = useState('');
  const [problem, setProblem] = useState('');
  const [lockType, setLockType] = useState<'Password' | 'Pin' | 'Pattern'>('Pattern');
  const [patternDots, setPatternDots] = useState<number[]>([]);
  const [textLock, setTextLock] = useState('');
  const [technician, setTechnician] = useState('');
  const [repairCost, setRepairCost] = useState<number>(0);
  const [advancePaid, setAdvancePaid] = useState<number>(0);
  const [rackNo, setRackNo] = useState('Rack-1');
  const [selectedParts, setSelectedParts] = useState<{ partId: string; name: string; price: number; qty: number }[]>([]);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [activeJobReceipt, setActiveJobReceipt] = useState<JobSheet | null>(null);
  const [activePrintMode, setActivePrintMode] = useState<'a4' | 'thermal'>('a4');

  // Save to LocalStorage automatically
  useEffect(() => {
    localStorage.setItem('viraj_settings', JSON.stringify(settings));
    localStorage.setItem('viraj_customers', JSON.stringify(customers));
    localStorage.setItem('viraj_stock', JSON.stringify(stockItems));
    localStorage.setItem('viraj_jobs', JSON.stringify(jobs));
    localStorage.setItem('viraj_expenses', JSON.stringify(expenses));
  }, [settings, customers, stockItems, jobs, expenses]);

  // --- CALCULATIONS ---
  const totalJobsCount = jobs.length;
  const pendingJobsCount = jobs.filter(j => j.status !== 'Delivered' && j.status !== 'Cancelled').length;
  const totalRevenue = jobs.reduce((acc, j) => acc + j.repairCost + j.partsUsed.reduce((pAcc, p) => pAcc + (p.price * p.qty), 0), 0);
  const totalCollected = jobs.reduce((acc, j) => acc + j.advancePaid, 0); // Simplified collection tracker
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

  // --- PATTERN LOCK HANDLER ---
  const handlePatternTouch = (dotIndex: number) => {
    if (!patternDots.includes(dotIndex)) {
      setPatternDots([...patternDots, dotIndex]);
    }
  };

  const saveNewJob = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find(c => c.id === selectedCustomer);
    const newTicketNo = `${settings.invoicePrefix}${Math.floor(1000 + Math.random() * 9000)}`;
    const lockValue = lockType === 'Pattern' ? patternDots.join('-') : textLock;

    const newJob: JobSheet = {
      id: Date.now().toString(),
      ticketNo: newTicketNo,
      customerName: cust ? cust.name : 'Walk-in Customer',
      customerPhone: cust ? cust.phone : '9999999999',
      deviceType,
      brand,
      model: model || 'Generic Model',
      serialNo,
      problem: problem || 'General Repair',
      lockType,
      lockValue,
      technician: technician || 'Self',
      repairCost: Number(repairCost) || 0,
      partsUsed: selectedParts,
      advancePaid: Number(advancePaid) || 0,
      status: 'Checking',
      rackNo,
      notes: 'Job created via Viraj Connect Manager',
      date: new Date().toISOString().split('T')[0]
    };

    setJobs([newJob, ...jobs]);
    setShowJobModal(false);
    // Reset form
    setModel('');
    setProblem('');
    setPatternDots([]);
    setTextLock('');
    setRepairCost(0);
    setAdvancePaid(0);
    setSelectedParts([]);
  };

  // --- WHATSAPP SHARE ---
  const sendWhatsApp = (job: JobSheet) => {
    const totalPartsCost = job.partsUsed.reduce((acc, p) => acc + (p.price * p.qty), 0);
    const totalAmount = job.repairCost + totalPartsCost;
    const balance = totalAmount - job.advancePaid;

    const text = `*${settings.shopName} - Repair Receipt*\n` +
      `Ticket: *${job.ticketNo}*\n` +
      `Date: ${job.date}\n` +
      `Device: ${job.brand} ${job.model}\n` +
      `Problem: ${job.problem}\n` +
      `Status: *${job.status}*\n` +
      `Total Cost: ₹${totalAmount}\n` +
      `Advance Paid: ₹${job.advancePaid}\n` +
      `Balance Due: *₹${balance}*\n\n` +
      `Thank you for choosing ${settings.shopName}! Call: ${settings.phone}`;

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/91${job.customerPhone.replace(/[^0-9]/g, '')}?text=${encoded}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      
      {/* HEADER NAVBAR */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-600 p-2 rounded-xl text-white font-black text-xl shadow-lg flex items-center justify-center">
            VC
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide text-white">{settings.shopName}</h1>
            <p className="text-xs text-slate-400">Advanced Mobile & Repair Shop Management System</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setShowJobModal(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-semibold text-sm flex items-center space-x-2 shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Job Sheet</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-64 bg-slate-800/60 border-r border-slate-700 p-4 flex flex-col justify-between">
          <nav className="space-y-1.5">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'jobs', label: 'Job Sheets / Repairs', icon: Wrench },
              { id: 'pos', label: 'POS & Counter Sales', icon: ShoppingBag },
              { id: 'customers', label: 'Customers & Techs', icon: Users },
              { id: 'stock', label: 'Inventory & Parts', icon: Package },
              { id: 'expenses', label: 'Expense Tracker', icon: DollarSign },
              { id: 'reports', label: 'Reports & Statements', icon: FileText },
              { id: 'settings', label: 'Shop Settings', icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-lg' 
                      : 'text-slate-300 hover:bg-slate-700/60 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700 text-xs text-slate-400">
            <p className="font-semibold text-slate-200">System Status</p>
            <p className="text-emerald-400 flex items-center mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block mr-1.5 animate-pulse"></span>
              Live & Synced (Offline Ready)
            </p>
          </div>
        </aside>

        {/* CONTENT AREA */}
        <main className="flex-1 bg-slate-950 p-6 overflow-y-auto">

          {/* ==================== DASHBOARD ==================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
                  <p className="text-xs text-slate-400 font-medium">Total Repair Jobs</p>
                  <h3 className="text-2xl font-bold text-white mt-1">{totalJobsCount}</h3>
                  <span className="text-xs text-indigo-400 mt-2 inline-block">Active Pending: {pendingJobsCount}</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
                  <p className="text-xs text-slate-400 font-medium">Total Business Billing</p>
                  <h3 className="text-2xl font-bold text-emerald-400 mt-1">{settings.currency}{totalRevenue}</h3>
                  <span className="text-xs text-slate-500 mt-2 inline-block">Repairs + Parts</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
                  <p className="text-xs text-slate-400 font-medium">Advance & Collections</p>
                  <h3 className="text-2xl font-bold text-sky-400 mt-1">{settings.currency}{totalCollected}</h3>
                  <span className="text-xs text-slate-500 mt-2 inline-block">Received cash/online</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
                  <p className="text-xs text-slate-400 font-medium">Total Shop Expenses</p>
                  <h3 className="text-2xl font-bold text-rose-400 mt-1">{settings.currency}{totalExpenses}</h3>
                  <span className="text-xs text-slate-500 mt-2 inline-block">Rent, bills, etc.</span>
                </div>
              </div>

              {/* RECENT JOBS TABLE */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg text-white">Recent Repair Jobs</h3>
                  <button onClick={() => setActiveTab('jobs')} className="text-sm text-indigo-400 hover:underline">View All</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-800 text-slate-400 uppercase text-xs">
                      <tr>
                        <th className="p-3">Ticket</th>
                        <th className="p-3">Customer</th>
                        <th className="p-3">Device</th>
                        <th className="p-3">Problem</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {jobs.slice(0, 5).map(job => (
                        <tr key={job.id} className="hover:bg-slate-800/40">
                          <td className="p-3 font-semibold text-indigo-400">{job.ticketNo}</td>
                          <td className="p-3">{job.customerName}</td>
                          <td className="p-3">{job.brand} {job.model}</td>
                          <td className="p-3 truncate max-w-xs">{job.problem}</td>
                          <td className="p-3">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              job.status === 'Ready' ? 'bg-emerald-500/20 text-emerald-400' :
                              job.status === 'Delivered' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-amber-500/20 text-amber-400'
                            }`}>
                              {job.status}
                            </span>
                          </td>
                          <td className="p-3">
                            <button 
                              onClick={() => setActiveJobReceipt(job)}
                              className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Receipt</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================== JOB SHEETS ==================== */}
          {activeTab === 'jobs' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Job Sheets & Repair Management</h2>
                  <p className="text-xs text-slate-400">Track all ongoing mobile and laptop service requests</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search ticket, customer..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <button 
                    onClick={() => setShowJobModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Job</span>
                  </button>
                </div>
              </div>

              {/* Status Filters */}
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {['All', 'Checking', 'Repairing', 'Ready', 'Delivered'].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition ${
                      filterStatus === status ? 'bg-indigo-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {/* Jobs Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-800 text-slate-400 uppercase text-xs">
                    <tr>
                      <th className="p-3">Ticket</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Device & Problem</th>
                      <th className="p-3">Lock Info</th>
                      <th className="p-3">Cost / Advance</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {jobs
                      .filter(j => filterStatus === 'All' || j.status === filterStatus)
                      .filter(j => j.ticketNo.toLowerCase().includes(searchQuery.toLowerCase()) || j.customerName.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(job => (
                        <tr key={job.id} className="hover:bg-slate-800/40">
                          <td className="p-3 font-bold text-indigo-400">{job.ticketNo}</td>
                          <td className="p-3 text-xs text-slate-400">{job.date}</td>
                          <td className="p-3">
                            <p className="font-semibold text-white">{job.customerName}</p>
                            <p className="text-xs text-slate-400">{job.customerPhone}</p>
                          </td>
                          <td className="p-3">
                            <p className="font-semibold text-slate-200">{job.brand} {job.model}</p>
                            <p className="text-xs text-slate-400">{job.problem}</p>
                          </td>
                          <td className="p-3 text-xs font-mono text-amber-400">
                            {job.lockType}: {job.lockValue || 'None'}
                          </td>
                          <td className="p-3">
                            <p className="text-white font-semibold">₹{job.repairCost + job.partsUsed.reduce((a,b)=>a+b.price*b.qty,0)}</p>
                            <p className="text-xs text-emerald-400">Adv: ₹{job.advancePaid}</p>
                          </td>
                          <td className="p-3">
                            <select 
                              value={job.status} 
                              onChange={(e) => {
                                const newStatus = e.target.value as any;
                                setJobs(jobs.map(j => j.id === job.id ? { ...j, status: newStatus } : j));
                              }}
                              className="bg-slate-800 text-xs border border-slate-700 rounded-lg px-2 py-1 text-white"
                            >
                              <option value="Checking">Checking</option>
                              <option value="Repairing">Repairing</option>
                              <option value="Ready">Ready</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="p-3 text-right space-x-2">
                            <button 
                              onClick={() => sendWhatsApp(job)}
                              className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 p-2 rounded-lg inline-flex"
                              title="Send WhatsApp Update"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => setActiveJobReceipt(job)}
                              className="bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 p-2 rounded-lg inline-flex"
                              title="Print Receipt"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => setJobs(jobs.filter(j => j.id !== job.id))}
                              className="bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 p-2 rounded-lg inline-flex"
                              title="Delete Job"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================== POS / COUNTER SALES ==================== */}
          {activeTab === 'pos' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-xl font-bold text-white">POS & Accessories Counter Sale</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {stockItems.map(item => (
                    <div 
                      key={item.id}
                      onClick={() => {
                        const existing = posCart.find(c => c.partId === item.id);
                        if (existing) {
                          setPosCart(posCart.map(c => c.partId === item.id ? { ...c, qty: c.qty + 1 } : c));
                        } else {
                          setPosCart([...posCart, { partId: item.id, name: item.name, price: item.salePrice, qty: 1 }]);
                        }
                      }}
                      className="bg-slate-900 border border-slate-800 p-4 rounded-2xl cursor-pointer hover:border-indigo-500 transition shadow-sm"
                    >
                      <p className="font-semibold text-white">{item.name}</p>
                      <p className="text-xs text-slate-400 mt-1">Stock: {item.stock}</p>
                      <p className="text-indigo-400 font-bold mt-2">₹{item.salePrice}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cart Summary */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-lg text-white mb-4">Current Bill</h3>
                  <div className="space-y-3 mb-4">
                    <input 
                      type="text" 
                      placeholder="Customer Name"
                      value={posCustomerName}
                      onChange={(e) => setPosCustomerName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                    />
                    <input 
                      type="text" 
                      placeholder="Customer Phone"
                      value={posCustomerPhone}
                      onChange={(e) => setPosCustomerPhone(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                    />
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto mb-4 divide-y divide-slate-800">
                    {posCart.map(c => (
                      <div key={c.partId} className="pt-2 flex items-center justify-between text-sm">
                        <div>
                          <p className="font-semibold text-white">{c.name}</p>
                          <p className="text-xs text-slate-400">₹{c.price} x {c.qty}</p>
                        </div>
                        <p className="font-bold text-indigo-400">₹{c.price * c.qty}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="border-t border-slate-800 pt-3 mb-4 flex justify-between text-lg font-bold text-white">
                    <span>Total Amount:</span>
                    <span className="text-emerald-400">₹{posCart.reduce((a,b) => a + (b.price * b.qty), 0)}</span>
                  </div>
                  <button 
                    onClick={() => {
                      alert('POS Sale Completed Successfully!');
                      setPosCart([]);
                      setPosCustomerName('');
                      setPosCustomerPhone('');
                    }}
                    disabled={posCart.length === 0}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-3 rounded-xl font-bold shadow-lg transition"
                  >
                    Complete Checkout
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ==================== CUSTOMERS ==================== */}
          {activeTab === 'customers' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Customers & Technicians Directory</h2>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-800 text-slate-400 uppercase text-xs">
                    <tr>
                      <th className="p-3">Name</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Address</th>
                      <th className="p-3">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {customers.map(c => (
                      <tr key={c.id}>
                        <td className="p-3 font-semibold text-white">{c.name}</td>
                        <td className="p-3">{c.phone}</td>
                        <td className="p-3">{c.address}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${c.type === 'Technician' ? 'bg-purple-500/20 text-purple-400' : 'bg-sky-500/20 text-sky-400'}`}>
                            {c.type}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================== INVENTORY / STOCK ==================== */}
          {activeTab === 'stock' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Parts & Accessories Inventory</h2>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-800 text-slate-400 uppercase text-xs">
                    <tr>
                      <th className="p-3">Item Name</th>
                      <th className="p-3">Purchase Price</th>
                      <th className="p-3">Sale Price</th>
                      <th className="p-3">Stock Available</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {stockItems.map(item => (
                      <tr key={item.id}>
                        <td className="p-3 font-semibold text-white">{item.name}</td>
                        <td className="p-3 text-slate-400">₹{item.purchasePrice}</td>
                        <td className="p-3 text-emerald-400 font-semibold">₹{item.salePrice}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${item.stock < 5 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            {item.stock} Units
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================== EXPENSES ==================== */}
          {activeTab === 'expenses' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white">Shop Expense Tracker</h2>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-800 text-slate-400 uppercase text-xs">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Notes</th>
                      <th className="p-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {expenses.map(e => (
                      <tr key={e.id}>
                        <td className="p-3 text-slate-400">{e.date}</td>
                        <td className="p-3 font-semibold text-white">{e.category}</td>
                        <td className="p-3">{e.notes}</td>
                        <td className="p-3 text-right font-bold text-rose-400">₹{e.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================== REPORTS ==================== */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white">Reports & Financial Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                  <h3 className="font-semibold text-white mb-2">Total Gross Earnings</h3>
                  <p className="text-3xl font-extrabold text-emerald-400">₹{totalRevenue}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                  <h3 className="font-semibold text-white mb-2">Total Expenses</h3>
                  <p className="text-3xl font-extrabold text-rose-400">₹{totalExpenses}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                  <h3 className="font-semibold text-white mb-2">Net Estimated Profit</h3>
                  <p className="text-3xl font-extrabold text-indigo-400">₹{totalRevenue - totalExpenses}</p>
                </div>
              </div>
            </div>
          )}

          {/* ==================== SETTINGS ==================== */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h2 className="text-xl font-bold text-white">Shop Settings & Branding</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400">Shop Name</label>
                  <input 
                    type="text" 
                    value={settings.shopName} 
                    onChange={(e) => setSettings({...settings, shopName: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Phone Number</label>
                  <input 
                    type="text" 
                    value={settings.phone} 
                    onChange={(e) => setSettings({...settings, phone: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Address</label>
                  <input 
                    type="text" 
                    value={settings.address} 
                    onChange={(e) => setSettings({...settings, address: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white mt-1"
                  />
                </div>
                <button 
                  onClick={() => alert('Settings Saved Successfully!')}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg transition"
                >
                  Save Settings
                </button>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ==================== NEW JOB SHEET MODAL ==================== */}
      {showJobModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 max-w-xl w-full p-6 rounded-2xl space-y-4 my-8">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-white">Create New Repair Job Sheet</h3>
              <button onClick={() => setShowJobModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={saveNewJob} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400">Select Customer</label>
                <select 
                  value={selectedCustomer} 
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white mt-1"
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.filter(c => c.type === 'Customer').map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400">Device Type</label>
                  <select 
                    value={deviceType} 
                    onChange={(e) => setDeviceType(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white mt-1"
                  >
                    <option value="Mobile">Mobile</option>
                    <option value="Laptop">Laptop</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Brand & Model</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <input type="text" placeholder="Brand" value={brand} onChange={(e) => setBrand(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white" />
                    <input type="text" placeholder="Model" value={model} onChange={(e) => setModel(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400">Problem Description</label>
                <input type="text" placeholder="e.g. Display Broken, Charging Issue" value={problem} onChange={(e) => setProblem(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white mt-1" />
              </div>

              {/* INTERACTIVE PATTERN LOCK DRAWING */}
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <label className="text-xs text-slate-300 font-semibold mb-2 block">Draw Pattern Lock (9 Dots)</label>
                <div className="grid grid-cols-3 gap-3 w-40 mx-auto my-3">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(dot => (
                    <button
                      key={dot}
                      type="button"
                      onClick={() => handlePatternTouch(dot)}
                      className={`w-10 h-10 rounded-full border-2 transition flex items-center justify-center font-bold text-xs ${
                        patternDots.includes(dot) ? 'bg-indigo-600 border-indigo-400 text-white' : 'border-slate-600 bg-slate-800 text-slate-400'
                      }`}
                    >
                      {patternDots.indexOf(dot) !== -1 ? patternDots.indexOf(dot) + 1 : ''}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400 mt-2">
                  <span>Sequence: {patternDots.join(' → ') || 'None'}</span>
                  <button type="button" onClick={() => setPatternDots([])} className="text-rose-400 hover:underline">Reset Pattern</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400">Repair Cost (₹)</label>
                  <input type="number" value={repairCost} onChange={(e) => setRepairCost(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white mt-1" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Advance Paid (₹)</label>
                  <input type="number" value={advancePaid} onChange={(e) => setAdvancePaid(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white mt-1" />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setShowJobModal(false)} className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-800 text-slate-300">Cancel</button>
                <button type="submit" className="px-6 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg">Save Job Sheet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== RECEIPT PRINT MODAL ==================== */}
      {activeJobReceipt && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white text-slate-900 max-w-lg w-full p-8 rounded-2xl shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-xl font-black text-indigo-900">{settings.shopName}</h2>
                <p className="text-xs text-slate-600">{settings.address} | Ph: {settings.phone}</p>
              </div>
              <button onClick={() => setActiveJobReceipt(null)} className="no-print bg-slate-100 hover:bg-slate-200 p-2 rounded-full"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="font-bold">Ticket: {activeJobReceipt.ticketNo}</span>
                <span className="text-slate-600">Date: {activeJobReceipt.date}</span>
              </div>
              <div>
                <p><strong className="text-slate-700">Customer:</strong> {activeJobReceipt.customerName} ({activeJobReceipt.customerPhone})</p>
                <p><strong className="text-slate-700">Device:</strong> {activeJobReceipt.brand} {activeJobReceipt.model}</p>
                <p><strong className="text-slate-700">Problem:</strong> {activeJobReceipt.problem}</p>
                <p><strong className="text-slate-700">Lock:</strong> {activeJobReceipt.lockType} ({activeJobReceipt.lockValue})</p>
              </div>

              <div className="border-t pt-3 flex justify-between font-bold text-base">
                <span>Total Cost:</span>
                <span>₹{activeJobReceipt.repairCost + activeJobReceipt.partsUsed.reduce((a,b)=>a+b.price*b.qty,0)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Advance Paid:</span>
                <span>₹{activeJobReceipt.advancePaid}</span>
              </div>
              <div className="flex justify-between text-rose-600 font-bold border-b pb-3">
                <span>Balance Due:</span>
                <span>₹{(activeJobReceipt.repairCost + activeJobReceipt.partsUsed.reduce((a,b)=>a+b.price*b.qty,0)) - activeJobReceipt.advancePaid}</span>
              </div>
            </div>

            <div className="flex space-x-3 no-print pt-2">
              <button onClick={() => window.print()} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl font-bold flex items-center justify-center space-x-2">
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>
              <button onClick={() => sendWhatsApp(activeJobReceipt)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold flex items-center space-x-2">
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}