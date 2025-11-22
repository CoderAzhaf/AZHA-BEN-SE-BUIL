import React, { useState, useEffect, useRef } from 'react';
import { Plane, Coins, User, Lock, Shield, Check, AlertCircle, LogOut, Gauge, Users, Gavel, Trash2, StopCircle, Clock, MessageSquare, Save, RotateCcw } from 'lucide-react';

// --- Constants ---

const STARTING_MONEY = 25000;
const FLIGHT_DISTANCE = 5000; // Longer flight for sim feel
const STORAGE_KEY = 'azha_game_v3_data'; // New key for fresh storage

const PLANES_DATABASE = [
  { id: 'p1', name: 'Cessna Skyhawk', price: 25000, speed: 5, turnRate: 2, capacity: '4 Pax', rarity: 'Common', image: '🛩️', isHidden: false },
  { id: 'p2', name: 'Learjet 75', price: 500000, speed: 8, turnRate: 3, capacity: '9 Pax', rarity: 'Rare', image: '✈️', isHidden: false },
  { id: 'p3', name: 'Boeing 747', price: 2500000, speed: 7, turnRate: 1.5, capacity: '416 Pax', rarity: 'Epic', image: '🛫', isHidden: false },
  { id: 'p4', name: 'Concorde X', price: 10000000, speed: 12, turnRate: 2.5, capacity: '100 Pax', rarity: 'Legendary', image: '🚀', isHidden: false },
  // THE CEO PLANE
  { id: 'p_azha', name: 'AZHA Plane', price: 0, speed: 15, turnRate: 5, capacity: 'Infinite', rarity: 'Owner', image: '🛸', isHidden: true }
];

// Initial CEO Data
const INITIAL_ADMIN = {
  username: 'AZHA',
  password: 'Mohammed',
  role: 'admin',
  money: 'Infinite', 
  inventory: ['p_azha'],
  isBanned: false,
  warnings: []
};

export default function AzhaGame() {
  // --- Global State ---
  const [allUsers, setAllUsers] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure Admin always exists even in old saves
        if (!parsed['AZHA']) parsed['AZHA'] = INITIAL_ADMIN;
        return parsed;
      }
      return { 'AZHA': INITIAL_ADMIN };
    } catch (e) {
      console.error("Storage Load Error:", e);
      return { 'AZHA': INITIAL_ADMIN };
    }
  });

  const [currentUser, setCurrentUser] = useState(null); 
  const [view, setView] = useState('login'); 
  const [notification, setNotification] = useState(null);
  
  // Persist to Local Storage on ANY change to allUsers
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allUsers));
    } catch (e) {
      console.error("Save Error:", e);
      showNotification("Error saving game data!", "error");
    }
  }, [allUsers]);

  // --- Actions ---

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const resetGameData = () => {
    if (window.confirm("Are you sure? This will delete ALL accounts and progress.")) {
      localStorage.removeItem(STORAGE_KEY);
      setAllUsers({ 'AZHA': INITIAL_ADMIN });
      window.location.reload();
    }
  };

  const login = (username, password) => {
    const user = allUsers[username];
    if (!user) return showNotification("User not found", "error");
    if (user.password !== password) return showNotification("Invalid Password", "error");

    if (user.isBanned) {
        if (user.bannedUntil && new Date(user.bannedUntil) > new Date()) {
             return showNotification(`Banned until ${new Date(user.bannedUntil).toLocaleString()}`, "error");
        } else if (!user.bannedUntil) {
             return showNotification("Account Permanently BANNED by CEO", "error");
        }
        // Ban expired
        updateUser(username, 'isBanned', false);
    }

    setCurrentUser(username);
    setView('dashboard');
    showNotification(`Welcome back, ${username}`);
  };

  const signup = (username, password) => {
    if (allUsers[username]) return showNotification("Username taken", "error");
    if (username.length < 3) return showNotification("Username too short", "error");

    const newUser = {
      username,
      password,
      role: 'user',
      money: STARTING_MONEY,
      inventory: [],
      isBanned: false,
      warnings: []
    };

    setAllUsers(prev => ({ ...prev, [username]: newUser }));
    setCurrentUser(username);
    setView('dashboard');
    showNotification(`Account Created! +${STARTING_MONEY.toLocaleString()} AZ`);
  };

  const updateUser = (targetUsername, field, value) => {
    setAllUsers(prev => ({
      ...prev,
      [targetUsername]: { ...prev[targetUsername], [field]: value }
    }));
  };

  const modifyInventory = (targetUsername, itemId, action) => {
    setAllUsers(prev => {
        const currentInv = prev[targetUsername].inventory || [];
        let newInv = [...currentInv];
        if (action === 'add' && !newInv.includes(itemId)) newInv.push(itemId);
        if (action === 'remove') newInv = newInv.filter(id => id !== itemId);
        
        return {
            ...prev,
            [targetUsername]: { ...prev[targetUsername], inventory: newInv }
        };
    });
  };

  const handleMoneyChange = (targetUsername, amount, type) => {
     const user = allUsers[targetUsername];
     if (user.money === 'Infinite') return; 

     let newAmount = user.money;
     if (type === 'add') newAmount += amount;
     if (type === 'subtract') newAmount -= amount;
     if (type === 'set') newAmount = amount;

     updateUser(targetUsername, 'money', newAmount);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-indigo-500 selection:text-white overflow-hidden">
      {notification && (
        <div className={`fixed top-4 right-4 z-[100] px-6 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-bounce-in ${notification.type === 'admin' ? 'bg-yellow-600 text-white' : notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          {notification.type === 'admin' ? <Shield size={20} /> : notification.type === 'error' ? <AlertCircle size={20} /> : <Check size={20} />}
          <span className="font-medium">{notification.msg}</span>
        </div>
      )}

      {view === 'login' && <AuthScreen onLogin={login} onSwitch={() => setView('signup')} mode="login" onReset={resetGameData} />}
      {view === 'signup' && <AuthScreen onLogin={signup} onSwitch={() => setView('login')} mode="signup" />}
      
      {view === 'dashboard' && currentUser && (
        <Dashboard 
          user={allUsers[currentUser]} 
          allUsers={allUsers} 
          onLogout={() => { setCurrentUser(null); setView('login'); }}
          onFly={() => setView('flying')}
          onBuy={(amount) => handleMoneyChange(currentUser, amount, 'subtract')}
          onAcquire={(id) => modifyInventory(currentUser, id, 'add')}
          
          adminActions={{
              banUser: (target, until) => { updateUser(target, 'isBanned', true); updateUser(target, 'bannedUntil', until); },
              unbanUser: (target) => { updateUser(target, 'isBanned', false); updateUser(target, 'bannedUntil', null); },
              updateMoney: handleMoneyChange,
              updateInventory: modifyInventory,
              setRole: (target, role) => updateUser(target, 'role', role),
              warnUser: (target, msg) => { const w = allUsers[target].warnings || []; updateUser(target, 'warnings', [...w, msg]); },
              clearWarnings: (target) => updateUser(target, 'warnings', [])
          }}
          notify={showNotification}
        />
      )}

      {view === 'flying' && currentUser && (
        <RealFlightSim 
          planeId={allUsers[currentUser].activePlane}
          onComplete={(score) => {
            const reward = 50000;
            handleMoneyChange(currentUser, reward, 'add');
            setView('dashboard');
            showNotification(`Landed Successfully! Earned ${reward.toLocaleString()} AZ`);
          }}
          onCrash={() => {
            setView('dashboard');
            showNotification("CRASHED! Hull Destroyed.", "error");
          }}
        />
      )}
    </div>
  );
}

// --- Components ---

function AuthScreen({ onLogin, onSwitch, mode, onReset }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[url('https://images.unsplash.com/photo-1569629743817-70d8db6c323b?auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center relative">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"></div>
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700 relative z-10">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-indigo-600 rounded-full mb-4 shadow-lg shadow-indigo-500/30">
            <Plane size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-wider">AZHA AIRLINES</h1>
          <p className="text-slate-400 mt-2">Flight Simulator V3.0</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onLogin(user, pass); }} className="space-y-6">
          <div>
            <label className="block text-slate-400 text-sm font-bold mb-2">Username</label>
            <input required type="text" value={user} onChange={(e) => setUser(e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg py-3 px-4 focus:outline-none focus:border-indigo-500" placeholder="Callsign" />
          </div>
          <div>
            <label className="block text-slate-400 text-sm font-bold mb-2">Password</label>
            <input required type="password" value={pass} onChange={(e) => setPass(e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg py-3 px-4 focus:outline-none focus:border-indigo-500" placeholder="Security Code" />
          </div>
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-all hover:scale-[1.02] shadow-lg">
            {mode === 'login' ? 'Enter Cockpit' : 'Sign Up'}
          </button>
          <div className="text-center text-sm text-slate-400 flex flex-col gap-2">
             <button type="button" onClick={onSwitch} className="text-indigo-400 hover:text-indigo-300 underline">
              {mode === 'login' ? 'New Pilot? Start with 25k AZ' : 'Back to Login'}
            </button>
            {mode === 'login' && (
                <button type="button" onClick={onReset} className="text-xs text-red-500 hover:text-red-400 flex items-center justify-center gap-1 mt-4">
                    <RotateCcw size={12} /> Reset Saved Data (Fix Storage)
                </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function Dashboard({ user, allUsers, onLogout, onFly, onBuy, onAcquire, adminActions, notify }) {
  const [activeTab, setActiveTab] = useState('hangar'); 
  const [selectedPlaneId, setSelectedPlaneId] = useState(user.activePlane);

  const inventory = (user.inventory || []).map(id => PLANES_DATABASE.find(p => p.id === id)).filter(Boolean);
  const activePlane = PLANES_DATABASE.find(p => p.id === selectedPlaneId);
  const displayMoney = user.money === 'Infinite' ? 'Infinite' : user.money.toLocaleString();

  return (
    <div className="pb-20 h-screen overflow-y-auto bg-slate-900">
      <nav className="bg-slate-800 border-b border-slate-700 p-4 sticky top-0 z-40 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg"><Plane size={24} /></div>
            <div>
              <h1 className="font-bold text-lg hidden md:block">AZHA AIRLINES</h1>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span className={user.role === 'admin' ? 'text-yellow-400 font-bold' : ''}>
                  {user.username} {user.role === 'admin' && '(CEO)'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-full border border-slate-700 shadow-inner">
              <Coins className="text-yellow-400" size={20} />
              <span className="font-mono font-bold text-yellow-400 text-lg">{displayMoney} AZ</span>
            </div>
            <button onClick={onLogout} className="text-slate-400 hover:text-red-400 transition-colors"><LogOut size={24} /></button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto p-4 space-y-6">
        {user.warnings && user.warnings.length > 0 && (
            <div className="bg-red-500/20 border border-red-500 p-4 rounded-xl animate-pulse">
                <h3 className="font-bold text-red-400 flex items-center gap-2"><AlertCircle /> CEO WARNINGS:</h3>
                <ul className="list-disc list-inside text-red-200 mt-2">
                    {user.warnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
                <button onClick={() => adminActions.clearWarnings(user.username)} className="mt-2 text-xs underline text-red-400 hover:text-white">Acknowledge & Clear</button>
            </div>
        )}

        {user.role === 'admin' && <AdminPanel allUsers={allUsers} actions={adminActions} notify={notify} />}

        {/* FLIGHT DECK */}
        <div className="bg-[url('https://images.unsplash.com/photo-1517428090084-5df95f641055?auto=format&fit=crop&w=1000&q=80')] bg-cover bg-center rounded-2xl p-8 shadow-2xl relative overflow-hidden border-2 border-indigo-500/50 group">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm group-hover:backdrop-blur-0 transition-all duration-500"></div>
           <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Flight Deck</h2>
                <p className="text-indigo-100 drop-shadow-md">
                  {activePlane ? `Pre-flight checks complete for ${activePlane.name}` : 'Select an aircraft from Hangar'}
                </p>
              </div>
              <div className="flex items-center gap-6">
                {activePlane && <div className="text-6xl animate-pulse drop-shadow-2xl">{activePlane.image}</div>}
                <button 
                  onClick={() => {
                    if (!activePlane) return notify('Select a plane first!', 'error');
                    user.activePlane = selectedPlaneId; 
                    onFly();
                  }}
                  className={`px-8 py-4 rounded-xl font-bold text-xl shadow-lg transition-all transform hover:scale-105 ${activePlane ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer border-2 border-indigo-400' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                >
                  Take Off
                </button>
              </div>
           </div>
        </div>

        {/* TABS */}
        <div className="flex gap-4 border-b border-slate-700">
          <button onClick={() => setActiveTab('hangar')} className={`pb-2 px-4 font-bold transition-colors ${activeTab === 'hangar' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}>Hangar</button>
          <button onClick={() => setActiveTab('shop')} className={`pb-2 px-4 font-bold transition-colors ${activeTab === 'shop' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}>Dealership</button>
        </div>

        {activeTab === 'hangar' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {inventory.length === 0 && <div className="col-span-full text-center py-12 text-slate-500 bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-700">No aircraft found. Visit the dealership.</div>}
             {inventory.map((plane, idx) => (
               <div 
                key={`${plane.id}-${idx}`} onClick={() => setSelectedPlaneId(plane.id)}
                className={`bg-slate-800 p-4 rounded-xl border-2 cursor-pointer transition-all hover:bg-slate-700 relative ${selectedPlaneId === plane.id ? 'border-indigo-500 shadow-lg shadow-indigo-500/20' : 'border-transparent'}`}
               >
                 <div className="flex justify-between items-start mb-2">
                   <span className="text-4xl">{plane.image}</span>
                   <span className={`text-xs px-2 py-1 rounded font-bold ${plane.rarity === 'Owner' ? 'bg-yellow-500 text-black' : 'bg-slate-600 text-slate-300'}`}>{plane.rarity}</span>
                 </div>
                 <h3 className="font-bold text-lg">{plane.name}</h3>
                 {selectedPlaneId === plane.id && <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow">SELECTED</div>}
               </div>
             ))}
          </div>
        )}

        {activeTab === 'shop' && (
          <div className="grid grid-cols-1 gap-4">
            {PLANES_DATABASE.map(plane => {
              if (plane.isHidden && user.role !== 'admin') return null;
              const owned = user.inventory && user.inventory.includes(plane.id);
              const canAfford = user.money === 'Infinite' || user.money >= plane.price;
              return (
                <div key={plane.id} className="bg-slate-800 p-4 rounded-xl flex justify-between items-center border border-slate-700">
                   <div className="flex items-center gap-4">
                      <div className="text-3xl bg-slate-900 p-3 rounded-lg">{plane.image}</div>
                      <div>
                        <h3 className="font-bold">{plane.name}</h3>
                        <p className="text-yellow-400 font-mono">{plane.price === 0 ? 'FREE' : plane.price.toLocaleString() + ' AZ'}</p>
                      </div>
                   </div>
                   <button 
                    disabled={owned || !canAfford}
                    onClick={() => {
                      if (canAfford) {
                        onBuy(plane.price);
                        onAcquire(plane.id);
                        notify(`Bought ${plane.name}!`);
                      }
                    }}
                    className={`px-4 py-2 rounded font-bold transition-transform active:scale-95 ${owned ? 'bg-slate-700 text-slate-500' : canAfford ? 'bg-white text-black hover:bg-indigo-50' : 'bg-slate-700 text-slate-500'}`}
                   >
                     {owned ? 'Owned' : 'Purchase'}
                   </button>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function AdminPanel({ allUsers, actions, notify }) {
    const [targetUser, setTargetUser] = useState('');
    const [amount, setAmount] = useState(10000);
    const [warningMsg, setWarningMsg] = useState('');
    const userList = Object.keys(allUsers).filter(u => u !== 'AZHA'); 

    return (
        <div className="bg-slate-800 border border-yellow-600/30 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-yellow-500 mb-4 flex items-center gap-2"><Shield /> CEO CONTROL PANEL</h2>
            <div className="mb-6">
                <select value={targetUser} onChange={(e) => setTargetUser(e.target.value)} className="w-full bg-slate-900 text-white p-3 rounded-lg border border-slate-700">
                    <option value="">-- Select User --</option>
                    {userList.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
            </div>
            {targetUser && (
                <div className="grid lg:grid-cols-2 gap-8">
                    <div className="space-y-4 bg-slate-900 p-4 rounded-lg">
                        <h3 className="font-bold text-slate-300 border-b border-slate-700 pb-2">Economy</h3>
                        <div className="flex gap-2">
                            <input type="number" value={amount} onChange={e => setAmount(parseInt(e.target.value))} className="w-full bg-slate-800 p-2 rounded text-white" />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => { actions.updateMoney(targetUser, amount, 'add'); notify('Funds Added', 'admin'); }} className="flex-1 bg-green-700 p-2 rounded text-sm font-bold">Give AZ</button>
                            <button onClick={() => { actions.updateMoney(targetUser, amount, 'subtract'); notify('Funds Removed', 'admin'); }} className="flex-1 bg-red-700 p-2 rounded text-sm font-bold">Take AZ</button>
                        </div>
                    </div>
                    <div className="space-y-4 bg-slate-900 p-4 rounded-lg">
                        <h3 className="font-bold text-slate-300 border-b border-slate-700 pb-2">Discipline</h3>
                        <div className="flex gap-2">
                            <input type="text" placeholder="Warning..." value={warningMsg} onChange={e => setWarningMsg(e.target.value)} className="flex-1 bg-slate-800 p-2 rounded text-white text-sm" />
                            <button onClick={() => { actions.warnUser(targetUser, warningMsg || 'Warning'); setWarningMsg(''); notify('Sent', 'admin'); }} className="bg-orange-600 p-2 rounded"><MessageSquare size={16}/></button>
                        </div>
                        <button onClick={() => { actions.banUser(targetUser, null); notify('Banned', 'admin'); }} className="w-full bg-red-600 p-2 rounded text-sm font-bold">PERMA BAN</button>
                         <button onClick={() => { actions.unbanUser(targetUser); notify('Unbanned', 'admin'); }} className="w-full bg-green-600 p-2 rounded text-sm font-bold mt-2">UNBAN</button>
                    </div>
                    <div className="col-span-full bg-slate-900 p-4 rounded-lg">
                         <h3 className="font-bold text-slate-300 mb-2">Give Aircraft</h3>
                         <div className="flex flex-wrap gap-2">
                            {PLANES_DATABASE.map(p => (
                                <button key={p.id} onClick={() => { actions.updateInventory(targetUser, p.id, 'add'); notify(`Gave ${p.name}`, 'admin'); }} className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded border border-slate-600">{p.name}</button>
                            ))}
                         </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- NEW REALISTIC FLIGHT SIM ---

function RealFlightSim({ planeId, onComplete, onCrash }) {
  const canvasRef = useRef(null);
  const requestRef = useRef();
  const planeData = PLANES_DATABASE.find(p => p.id === planeId) || PLANES_DATABASE[0];

  // Simulation State
  const state = useRef({
    x: 0,          // Distance traveled
    y: 250,        // Altitude (Canvas height is 500, so 250 is middle)
    pitch: 0,      // Angle in degrees (-45 to +45)
    clouds: [],
    finished: false
  });

  useEffect(() => {
    // Initialize Clouds
    for(let i=0; i<20; i++) {
        state.current.clouds.push({
            x: Math.random() * FLIGHT_DISTANCE + 400,
            y: Math.random() * 400 + 50,
            scale: Math.random() * 0.5 + 0.5
        });
    }

    const handleKeyDown = (e) => {
        if(e.key === 'ArrowUp') state.current.pitch = Math.max(state.current.pitch - 5, -45); // Nose Up
        if(e.key === 'ArrowDown') state.current.pitch = Math.min(state.current.pitch + 5, 45); // Nose Down
    };

    // Mobile/Touch controls
    const handleTouchStart = (e) => {
        // Top half of screen = Up, Bottom half = Down
        if(e.touches[0].clientY < window.innerHeight / 2) state.current.pitch -= 15;
        else state.current.pitch += 15;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart);

    const update = () => {
        if (state.current.finished) return;

        const s = state.current;
        
        // Physics
        // Vertical Movement based on Pitch angle
        // If pitch is negative (nose up), y decreases (goes up on canvas)
        const verticalSpeed = (s.pitch / 45) * (planeData.turnRate * 2); 
        s.y += verticalSpeed;

        // Forward Movement
        s.x += planeData.speed;

        // Boundaries check
        // Ground collision (Canvas height 500)
        if (s.y > 460) {
            state.current.finished = true;
            onCrash();
            return;
        }
        // Ceiling cap (can't fly into space forever)
        if (s.y < 20) s.y = 20;

        // Completion check
        if (s.x >= FLIGHT_DISTANCE) {
            state.current.finished = true;
            onComplete(100);
            return;
        }

        draw();
        requestRef.current = requestAnimationFrame(update);
    };

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const s = state.current;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. Sky Gradient (Changes based on altitude)
        const altitudeFactor = Math.max(0, Math.min(1, 1 - (s.y / 500)));
        const skyColor = `rgb(${70 * altitudeFactor}, ${130 * altitudeFactor}, ${200 + (50 * (1-altitudeFactor))})`;
        ctx.fillStyle = skyColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. Clouds (Visual Only - No Collision)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        s.clouds.forEach(cloud => {
            // Parallax scrolling
            const drawX = cloud.x - s.x + 100; // Offset so plane stays somewhat left
            if (drawX > -100 && drawX < canvas.width + 100) {
                ctx.beginPath();
                ctx.arc(drawX, cloud.y, 30 * cloud.scale, 0, Math.PI * 2);
                ctx.arc(drawX + 20, cloud.y - 10, 35 * cloud.scale, 0, Math.PI * 2);
                ctx.arc(drawX + 40, cloud.y, 30 * cloud.scale, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // 3. Ground
        ctx.fillStyle = '#22c55e'; // Grass green
        ctx.fillRect(0, 480, canvas.width, 20);
        
        // 4. Plane
        // Save context to rotate plane
        ctx.save();
        ctx.translate(100, s.y); // Plane is fixed at X=100
        ctx.rotate((s.pitch * Math.PI) / 180); // Rotate by pitch
        ctx.font = '50px Arial';
        ctx.fillText(planeData.image, -25, 15); // Center the emoji
        ctx.restore();

        // 5. HUD (Heads Up Display)
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px monospace';
        ctx.fillText(`ALTITUDE: ${Math.floor(500 - s.y)} ft`, 20, 30);
        ctx.fillText(`DIST: ${Math.floor(s.x)} / ${FLIGHT_DISTANCE}`, 20, 50);
        ctx.fillText(`PITCH: ${-s.pitch}°`, 20, 70);
        
        // Flight Instructions
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.roundRect(canvas.width/2 - 100, 10, 200, 30, 10);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText("ARROW UP to Climb | DOWN to Dive", canvas.width/2, 30);
        ctx.textAlign = 'left';
    };

    requestRef.current = requestAnimationFrame(update);
    return () => {
        cancelAnimationFrame(requestRef.current);
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('touchstart', handleTouchStart);
    };
  }, [planeId]); // eslint-disable-line

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center p-4">
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={500} 
        className="bg-slate-800 rounded-xl shadow-2xl max-w-full w-full md:w-auto border-4 border-white"
      />
    </div>
  );
}