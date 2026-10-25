import React, { useState, useEffect, useRef } from 'react';

// --- Types & Interfaces ---
interface RepairJob {
  id: string;
  bookingDate: string;
  bookingTime: string;
  customerName: string;
  customerMobile: string;
  phoneModel: string;
  problem: string;
  totalCost: number;
  advancePayment: number;
  remainingBalance: number;
  status: 'RECEIVED' | 'PENDING' | 'REPAIRING' | 'COMPLETED' | 'NOT REPAIR' | 'RETURN' | 'DELIVERED';
  paymentStatus: 'Paid' | 'Partial' | 'Unpaid';
  lockInfo: string;
  folderWarranty: string;
  imei: string;
  technician: string;
}

interface AccessoryWarranty {
  id: string;
  activationDate: string;
  itemName: string;
  sellingPrice: number;
  duration: string;
  expiryDate: string;
  status: 'ACTIVE' | 'EXPIRING SOON' | 'EXPIRED';
}

interface StockItem {
  code: string;
  name: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  lastUpdated: string;
}

interface ShopExpense {
  id: string;
  date: string;
  name: string;
  amount: number;
}

export default function App() {
  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('vc_is_logged_in') === 'true';
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Main App State
  const [activeTab, setActiveTab] = useState<'jobs' | 'create' | 'warranty' | 'stock' | 'expenses' | 'balance' | 'reports'>('jobs');
  
  // Data States with LocalStorage Persistence
  const [jobs, setJobs] = useState<RepairJob[]>(() => {
    const saved = localStorage.getItem('vc_jobs');
    return saved ? JSON.parse(saved) : [];
  });
  const [warranties, setWarranties] = useState<AccessoryWarranty[]>(() => {
    const saved = localStorage.getItem('vc_warranties');
    return saved ? JSON.parse(saved) : [];
  });
  const [stock, setStock] = useState<StockItem[]>(() => {
    const saved = localStorage.getItem('vc_stock');
    return saved ? JSON.parse(saved) : [];
  });
  const [expenses, setExpenses] = useState<ShopExpense[]>(() => {
    const saved = localStorage.getItem('vc_expenses');
    return saved ? JSON.parse(saved) : [];
  });

  // Filters & Search
  const [jobSearch, setJobSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // New Job Form State
  const [custMobile, setCustMobile] = useState('');
  const [custName, setCustName] = useState('');
  const [phoneModel, setPhoneModel] = useState('');
  const [problem, setProblem] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [advancePayment, setAdvancePayment] = useState('');
  const [folderWarranty, setFolderWarranty] = useState('');
  const [lockType, setLockType] = useState('NO LOCK');
  const [lockInfo, setLockInfo] = useState('');
  const [imei, setImei] = useState('');

  // Pattern Lock Canvas State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawingPattern, setIsDrawingPattern] = useState(false);
  const [patternDots, setPatternDots] = useState<number[]>([]);

  // Print Receipt Modal
  const [selectedReceiptJob, setSelectedReceiptJob] = useState<RepairJob | null>(null);

  // Sync Data to LocalStorage
  useEffect(() => {
    localStorage.setItem('vc_jobs', JSON.stringify(jobs));
  }, [jobs]);

  useEffect(() => {
    localStorage.setItem('vc_warranties', JSON.stringify(warranties));
  }, [warranties]);

  useEffect(() => {
    localStorage.setItem('vc_stock', JSON.stringify(stock));
  }, [stock]);

  useEffect(() => {
    localStorage.setItem('vc_expenses', JSON.stringify(expenses));
  }, [expenses]);

  // Login Handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'viraj123') {
      setIsLoggedIn(true);
      localStorage.setItem('vc_is_logged_in', 'true');
      setLoginError('');
    } else {
      setLoginError('गलत यूज़रनेम या पासवर्ड! (Default: admin / viraj123)');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.setItem('vc_is_logged_in', 'false');
  };

  // Pattern Canvas Logic
  const dotCoords = [
    { x: 35, y: 35, num: 1 }, { x: 110, y: 35, num: 2 }, { x: 185, y: 35, num: 3 },
    { x: 35, y: 110, num: 4 }, { x: 110, y: 110, num: 5 }, { x: 185, y: 110, num: 6 },
    { x: 35, y: 185, num: 7 }, { x: 110, y: 185, num: 8 }, { x: 185, y: 185, num: 9 }
  ];

  const drawPatternCanvas = (selected: number[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (selected.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 4;
      selected.forEach((dotNum, idx) => {
        const pt = dotCoords[dotNum - 1];
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
    }

    dotCoords.forEach((d) => {
      ctx.beginPath();
      ctx.arc(d.x, d.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = selected.includes(d.num) ? '#2563eb' : '#000000';
      ctx.fill();
    });
  };

  useEffect(() => {
    if (lockType === 'PATTERN') {
      drawPatternCanvas(patternDots);
    }
  }, [patternDots, lockType]);

  const handleCanvasInteraction = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    dotCoords.forEach((d) => {
      const dist = Math.sqrt((x - d.x) ** 2 + (y - d.y) ** 2);
      if (dist < 20 && !patternDots.includes(d.num)) {
        const updated = [...patternDots, d.num];
        setPatternDots(updated);
        setLockInfo(`PATTERN (${updated.join('-')})`);
      }
    });
  };

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    const cost = parseFloat(totalCost) || 0;
    const adv = parseFloat(advancePayment) || 0;
    const rem = Math.max(0, cost - adv);
    const payStatus = adv >= cost ? 'Paid' : adv > 0 ? 'Partial' : 'Unpaid';
    const now = new Date();

    const newJob: RepairJob = {
      id: String(Math.floor(100000 + Math.random() * 900000)),
      bookingDate: now.toLocaleDateString('en-IN'),
      bookingTime: now.toLocaleTimeString('en-IN'),
      customerName: custName,
      customerMobile: custMobile,
      phoneModel,
      problem,
      totalCost: cost,
      advancePayment: adv,
      remainingBalance: rem,
      status: 'RECEIVED',
      paymentStatus: payStatus,
      lockInfo: lockInfo || lockType,
      folderWarranty,
      imei,
      technician: 'Admin'
    };

    setJobs([newJob, ...jobs]);
    setSelectedReceiptJob(newJob);

    // Reset Form
    setCustMobile(''); setCustName(''); setPhoneModel('');
    setProblem(''); setTotalCost(''); setAdvancePayment('');
    setFolderWarranty(''); setLockInfo(''); setLockType('NO LOCK');
    setPatternDots([]); setImei('');
    setActiveTab('jobs');
  };

  const updateStatus = (id: string, newStatus: RepairJob['status']) => {
    setJobs(jobs.map(j => j.id === id ? { ...j, status: newStatus } : j));
  };

  // Login Screen Render
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full border-t-8 border-yellow-500">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-slate-900 text-amber-400 font-extrabold text-2xl rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
              VC
            </div>
            <h1 className="text-2xl font-black text-slate-900">VIRAJ CONNECT</h1>
            <p className="text-sm font-semibold text-amber-600 uppercase tracking-wider">Management Portal Login</p>
          </div>

          {loginError && (
            <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-lg text-sm mb-4 text-center font-bold">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Username / यूजरनेम</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter Username"
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Password / पासवर्ड</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Password"
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition shadow-md"
            >
              🔒 Secure Login
            </button>
          </form>
          <p className="text-center text-xs text-slate-400 mt-6">VIRAJ CONNECT &copy; All Rights Reserved</p>
        </div>
      </div>
    );
  }

  // Filter Jobs
  const filteredJobs = jobs.filter(j => {
    const matchStatus = statusFilter === 'ALL' || j.status === statusFilter;
    const q = jobSearch.toLowerCase();
    const matchSearch = j.id.toLowerCase().includes(q) ||
      j.customerName.toLowerCase().includes(q) ||
      j.customerMobile.includes(q) ||
      j.phoneModel.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-100 font-sans text-slate-800">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-amber-400 text-slate-900 flex flex-col border-r border-amber-500 shrink-0">
        <div className="p-4 border-b border-black/10 text-center">
          <div className="w-12 h-12 bg-slate-900 text-amber-400 font-extrabold text-xl rounded-full flex items-center justify-center mx-auto mb-2 shadow">
            VC
          </div>
          <h2 className="font-black text-lg tracking-wider">VIRAJ CONNECT</h2>
          <p className="text-xs text-slate-800 font-semibold">Repair & Inventory Portal</p>
        </div>

        <nav className="p-2 space-y-1 overflow-y-auto flex-grow">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`w-full text-left font-bold px-4 py-3 rounded-lg flex items-center gap-2 text-sm transition ${activeTab === 'jobs' ? 'bg-white text-slate-900 shadow' : 'hover:bg-amber-300'}`}
          >
            📋 Repair Job Sheet
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`w-full text-left font-bold px-4 py-3 rounded-lg flex items-center gap-2 text-sm transition ${activeTab === 'create' ? 'bg-white text-slate-900 shadow' : 'hover:bg-amber-300'}`}
          >
            ➕ New Repair Entry
          </button>
          <button
            onClick={() => setActiveTab('warranty')}
            className={`w-full text-left font-bold px-4 py-3 rounded-lg flex items-center gap-2 text-sm transition ${activeTab === 'warranty' ? 'bg-white text-slate-900 shadow' : 'hover:bg-amber-300'}`}
          >
            🎧 Accessories Warranty
          </button>
          <button
            onClick={() => setActiveTab('stock')}
            className={`w-full text-left font-bold px-4 py-3 rounded-lg flex items-center gap-2 text-sm transition ${activeTab === 'stock' ? 'bg-white text-slate-900 shadow' : 'hover:bg-amber-300'}`}
          >
            📦 Stock Inventory
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`w-full text-left font-bold px-4 py-3 rounded-lg flex items-center gap-2 text-sm transition ${activeTab === 'expenses' ? 'bg-white text-slate-900 shadow' : 'hover:bg-amber-300'}`}
          >
            💸 Shop Expenses
          </button>
          <button
            onClick={() => setActiveTab('balance')}
            className={`w-full text-left font-bold px-4 py-3 rounded-lg flex items-center gap-2 text-sm transition ${activeTab === 'balance' ? 'bg-white text-slate-900 shadow' : 'hover:bg-amber-300'}`}
          >
            💰 Customer Balance
          </button>
        </nav>

        <div className="p-4 border-t border-black/10">
          <button
            onClick={handleLogout}
            className="w-full bg-slate-900 text-white font-bold py-2 rounded-lg text-sm hover:bg-slate-800 transition"
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        {/* Header Branding Banner */}
        <div className="bg-slate-900 text-white rounded-xl p-4 md:p-6 mb-6 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="bg-amber-500 text-slate-900 font-extrabold text-xs px-2.5 py-1 rounded uppercase tracking-wider">PRO REPAIR SOLUTIONS</span>
            <h1 className="text-2xl md:text-3xl font-black text-amber-400 mt-1">VIRAJ CONNECT</h1>
            <p className="text-xs text-slate-300">मोबाइल रिपेयरिंग, एक्सेसरीज एवं ऑल स्मार्टफोन सॉल्यूशन</p>
          </div>
          <div className="text-left md:text-right text-xs text-slate-300 space-y-1">
            <p>📞 संपर्क: +91 98765 43210</p>
            <p>📍 पता: मुख्य बाजार, बस स्टैंड रोड</p>
          </div>
        </div>

        {/* Tab 1: Job Sheet List */}
        {activeTab === 'jobs' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-900">📋 Repair Job Sheet</h2>
              <button
                onClick={() => setActiveTab('create')}
                className="bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-lg hover:bg-slate-800 transition"
              >
                + Create New Job
              </button>
            </div>

            {/* Status Grid Counter */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
              {['ALL', 'PENDING', 'REPAIRING', 'COMPLETED', 'NOT REPAIR', 'DELIVERED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`p-3 rounded-lg font-bold text-xs text-center border-2 transition ${statusFilter === st ? 'border-slate-900 shadow-md scale-105' : 'border-transparent'} ${st === 'ALL' ? 'bg-blue-600 text-white' :
                    st === 'PENDING' ? 'bg-orange-500 text-white' :
                      st === 'REPAIRING' ? 'bg-yellow-500 text-slate-900' :
                        st === 'COMPLETED' ? 'bg-emerald-600 text-white' :
                          st === 'NOT REPAIR' ? 'bg-slate-600 text-white' : 'bg-teal-600 text-white'
                    }`}
                >
                  {st}
                  <div className="text-base font-extrabold mt-0.5">
                    {st === 'ALL' ? jobs.length : jobs.filter(j => j.status === st).length}
                  </div>
                </button>
              ))}
            </div>

            {/* Search Input */}
            <input
              type="text"
              placeholder="🔍 Search Job ID, Customer Name, Mobile or Phone Model..."
              value={jobSearch}
              onChange={(e) => setJobSearch(e.target.value)}
              className="w-full bg-white border border-slate-300 p-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
            />

            {/* Jobs Table */}
            <div className="bg-white rounded-xl shadow border border-slate-200 overflow-x-auto">
              {filteredJobs.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  कोई रिकॉर्ड नहीं मिला। (No repair jobs found)
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white">
                      <th className="p-3">Action</th>
                      <th className="p-3">Job ID</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Mobile</th>
                      <th className="p-3">Model</th>
                      <th className="p-3">Lock Info</th>
                      <th className="p-3">Cost</th>
                      <th className="p-3">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredJobs.map((j) => (
                      <tr key={j.id} className="hover:bg-slate-50">
                        <td className="p-3">
                          <button
                            onClick={() => setSelectedReceiptJob(j)}
                            className="bg-sky-600 text-white font-bold px-2.5 py-1 rounded text-xs hover:bg-sky-700"
                          >
                            📄 Receipt
                          </button>
                        </td>
                        <td className="p-3 font-bold text-slate-900">#{j.id}</td>
                        <td className="p-3">
                          <select
                            value={j.status}
                            onChange={(e) => updateStatus(j.id, e.target.value as RepairJob['status'])}
                            className="border border-slate-300 rounded p-1 text-xs bg-white font-semibold"
                          >
                            <option value="RECEIVED">RECEIVED</option>
                            <option value="PENDING">PENDING</option>
                            <option value="REPAIRING">REPAIRING</option>
                            <option value="COMPLETED">COMPLETED</option>
                            <option value="NOT REPAIR">NOT REPAIR</option>
                            <option value="RETURN">RETURN</option>
                            <option value="DELIVERED">DELIVERED</option>
                          </select>
                        </td>
                        <td className="p-3 text-slate-500">{j.bookingDate}</td>
                        <td className="p-3 font-semibold">{j.customerName}</td>
                        <td className="p-3 font-mono">{j.customerMobile}</td>
                        <td className="p-3 font-medium">{j.phoneModel}</td>
                        <td className="p-3 text-blue-600 font-bold">{j.lockInfo || '-'}</td>
                        <td className="p-3 font-bold">₹{j.totalCost}</td>
                        <td className="p-3 font-bold text-red-600">₹{j.remainingBalance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Create New Repair Job */}
        {activeTab === 'create' && (
          <div className="bg-white rounded-xl shadow border border-slate-200 p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-4 border-b pb-2">📱 Create New Repair Job Card</h3>
            <form onSubmit={handleCreateJob} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer Mobile Number *</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="10 Digit Mobile Number"
                  value={custMobile}
                  onChange={(e) => setCustMobile(e.target.value)}
                  className="w-full border border-slate-300 p-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Customer Full Name"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="w-full border border-slate-300 p-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Model *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vivo Y20 / Samsung A12"
                    value={phoneModel}
                    onChange={(e) => setPhoneModel(e.target.value)}
                    className="w-full border border-slate-300 p-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">IMEI / Serial (Optional)</label>
                  <input
                    type="text"
                    placeholder="15 Digit IMEI Number"
                    value={imei}
                    onChange={(e) => setImei(e.target.value)}
                    className="w-full border border-slate-300 p-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Problem / Repair Issue *</label>
                <textarea
                  required
                  placeholder="e.g. Display Combo Change, Charging Jack Repair"
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  rows={2}
                  className="w-full border border-slate-300 p-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Repair Cost (₹) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="Billing Amount"
                    value={totalCost}
                    onChange={(e) => setTotalCost(e.target.value)}
                    className="w-full border border-slate-300 p-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Advance Deposit (₹)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={advancePayment}
                    onChange={(e) => setAdvancePayment(e.target.value)}
                    className="w-full border border-slate-300 p-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Folder Warranty</label>
                  <input
                    type="text"
                    placeholder="e.g. 3 Months Warranty"
                    value={folderWarranty}
                    onChange={(e) => setFolderWarranty(e.target.value)}
                    className="w-full border border-slate-300 p-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lock Type *</label>
                  <select
                    value={lockType}
                    onChange={(e) => {
                      setLockType(e.target.value);
                      if (e.target.value !== 'PATTERN') setLockInfo(e.target.value);
                    }}
                    className="w-full border border-slate-300 p-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="NO LOCK">No Lock</option>
                    <option value="PIN">PIN Code</option>
                    <option value="PASSWORD">Password</option>
                    <option value="PATTERN">Draw Pattern</option>
                  </select>
                </div>
              </div>

              {lockType === 'PIN' || lockType === 'PASSWORD' ? (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Enter {lockType}</label>
                  <input
                    type="text"
                    placeholder={`Enter ${lockType} Code`}
                    value={lockInfo}
                    onChange={(e) => setLockInfo(e.target.value)}
                    className="w-full border border-slate-300 p-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              ) : null}

              {lockType === 'PATTERN' && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-center">
                  <p className="font-bold text-blue-900 text-xs mb-2">Draw Pattern Lock Below:</p>
                  <canvas
                    ref={canvasRef}
                    width={220}
                    height={220}
                    className="bg-blue-100 rounded-lg mx-auto touch-none cursor-crosshair shadow-inner"
                    onMouseDown={(e) => { setIsDrawingPattern(true); handleCanvasInteraction(e.clientX, e.clientY); }}
                    onMouseMove={(e) => { if (isDrawingPattern) handleCanvasInteraction(e.clientX, e.clientY); }}
                    onMouseUp={() => setIsDrawingPattern(false)}
                    onTouchStart={(e) => { setIsDrawingPattern(true); handleCanvasInteraction(e.touches[0].clientX, e.touches[0].clientY); }}
                    onTouchMove={(e) => { if (isDrawingPattern) handleCanvasInteraction(e.touches[0].clientX, e.touches[0].clientY); }}
                    onTouchEnd={() => setIsDrawingPattern(false)}
                  />
                  <div className="mt-2 font-bold text-blue-700 text-xs">
                    Pattern: {patternDots.join('-') || 'None'}
                  </div>
                  <button
                    type="button"
                    onClick={() => { setPatternDots([]); setLockInfo(''); }}
                    className="mt-2 bg-red-600 text-white font-bold text-xs px-3 py-1 rounded hover:bg-red-700"
                  >
                    ↺ Reset Pattern
                  </button>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition text-sm shadow-md"
              >
                💾 Save Repair Job & Generate Receipt
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: Accessories Warranty */}
        {activeTab === 'warranty' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">🎧 Accessories Warranty Management</h2>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow text-xs">
              <p className="text-slate-500">यहाँ पर बेचे गए ब्लूटूथ नेकबैंड, चार्जर, डेटा केबल आदि की वारंटी कार्ड एंट्री करें।</p>
            </div>
          </div>
        )}

        {/* Tab 4: Stock Inventory */}
        {activeTab === 'stock' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">📦 Stock Inventory</h2>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow text-xs">
              <p className="text-slate-500">दुकान में मौजूद फोल्डर, बैटरी और एक्सेसरीज का स्टॉक मैनेज करें।</p>
            </div>
          </div>
        )}

        {/* Tab 5: Shop Expenses */}
        {activeTab === 'expenses' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">💸 Shop Expenses</h2>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow text-xs">
              <p className="text-slate-500">दुकान का रोज़ाना का खर्चा (चाय, टूल, ट्रांसपोर्ट आदि) यहाँ दर्ज करें।</p>
            </div>
          </div>
        )}

        {/* Tab 6: Customer Balance */}
        {activeTab === 'balance' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">💰 Customer Pending Balance</h2>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow text-xs">
              <p className="text-slate-500">पुराने ग्राहकों का बकाया पैसा चेक करें और पेमेंट जमा करें।</p>
            </div>
          </div>
        )}
      </main>

      {/* Printable Receipt Modal */}
      {selectedReceiptJob && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full border border-slate-300">
            <div className="text-center border-b pb-4 mb-4">
              <h2 className="text-2xl font-black text-slate-900">VIRAJ CONNECT</h2>
              <p className="text-xs text-slate-600 font-bold">Mobile Repairing & Smartphone Solutions</p>
              <p className="text-xs text-slate-500">Contact: +91 98765 43210</p>
              <div className="mt-2 inline-block bg-slate-900 text-white font-extrabold text-xs px-3 py-1 rounded">
                REPAIR RECEIPT / TOKEN
              </div>
            </div>

            <div className="space-y-2 text-xs border-b pb-4 mb-4">
              <div className="flex justify-between font-bold">
                <span>Receipt No: #{selectedReceiptJob.id}</span>
                <span>Date: {selectedReceiptJob.bookingDate}</span>
              </div>
              <p><strong>Customer:</strong> {selectedReceiptJob.customerName} ({selectedReceiptJob.customerMobile})</p>
              <p><strong>Phone Model:</strong> {selectedReceiptJob.phoneModel}</p>
              <p><strong>Problem:</strong> {selectedReceiptJob.problem}</p>
              <p><strong>Lock Info:</strong> {selectedReceiptJob.lockInfo}</p>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200 mt-2 space-y-1">
                <div className="flex justify-between">
                  <span>Total Cost:</span>
                  <span className="font-bold">₹{selectedReceiptJob.totalCost}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Advance Paid:</span>
                  <span className="font-bold">₹{selectedReceiptJob.advancePayment}</span>
                </div>
                <div className="flex justify-between text-red-600 font-bold border-t pt-1">
                  <span>Remaining Balance:</span>
                  <span>₹{selectedReceiptJob.remainingBalance}</span>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 mb-6 space-y-1 leading-tight">
              <p className="font-bold text-slate-700">📌 Terms & Conditions:</p>
              <p>1. Please check phone thoroughly at the time of delivery.</p>
              <p>2. No warranty on water damage or physical screen breakage.</p>
              <p>3. Receipt required for phone collection.</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-slate-900 text-white font-bold py-2.5 rounded-lg text-xs hover:bg-slate-800"
              >
                🖨️ Print Receipt
              </button>
              <button
                onClick={() => setSelectedReceiptJob(null)}
                className="bg-slate-200 text-slate-800 font-bold px-4 py-2.5 rounded-lg text-xs hover:bg-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}