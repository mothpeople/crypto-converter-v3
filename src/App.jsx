import React, { useState, useEffect } from 'react';
import { 
  ArrowDown, 
  RefreshCcw, 
  Info, 
  Wallet, 
  TrendingUp, 
  AlertCircle, 
  Moon, 
  Sun, 
  LineChart, 
  X,
  Heart // Added Heart icon
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// --- CONFIGURATION ---
// REPLACE THIS WITH YOUR OWN PAYPAL LINK
const PAYPAL_LINK = 'https://paypal.me/sivarajpragasm'; 

const STABLECOINS = [
  'tether',
  'usd-coin',
  'dai',
  'first-digital-usd',
  'ethena-usde',
  'usdd',
  'true-usd',
  'paxos-standard',
  'binance-usd',
  'frax',
  'paypal-usd',
  'sky-dollar', 
  'gemini-dollar',
  'liquity-usd',
  's-usd'
];

const PRIORITY_COINS = ['bitcoin', 'ethereum', 'ripple'];

const FIAT_OPTIONS = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', flag: '🇻🇳' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' }
];

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [fiatCurrency, setFiatCurrency] = useState(FIAT_OPTIONS[0]);
  const [fiatAmount, setFiatAmount] = useState('0'); 
  const [cryptos, setCryptos] = useState([]);
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Chart State
  const [showChart, setShowChart] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);

  // Fetch crypto data from CoinGecko
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${fiatCurrency.code.toLowerCase()}&order=market_cap_desc&per_page=150&page=1&sparkline=false`
      );

      if (!response.ok) {
        throw new Error('Rate limit exceeded. Please wait a moment.');
      }

      const data = await response.json();

      const processedData = data
        .filter((coin) => {
          const isStable = STABLECOINS.includes(coin.id) || coin.symbol.toLowerCase().includes('usd');
          const isWrapped = coin.name.toLowerCase().includes('wrapped') || coin.id.toLowerCase().includes('wrapped');
          return !isStable && !isWrapped;
        })
        .slice(0, 100)
        .sort((a, b) => {
          const indexA = PRIORITY_COINS.indexOf(a.id);
          const indexB = PRIORITY_COINS.indexOf(b.id);

          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;
          
          return a.name.localeCompare(b.name);
        });

      setCryptos(processedData);
      
      if (!selectedCrypto && processedData.length > 0) {
        setSelectedCrypto(processedData[0]);
      } else if (selectedCrypto) {
        const updatedCrypto = processedData.find(c => c.id === selectedCrypto.id);
        if (updatedCrypto) setSelectedCrypto(updatedCrypto);
      }

      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    if (!selectedCrypto) return;
    setChartLoading(true);
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${selectedCrypto.id}/market_chart?vs_currency=${fiatCurrency.code.toLowerCase()}&days=7`
      );
      const data = await response.json();
      const formattedData = data.prices.map(item => ({
        date: new Date(item[0]).toLocaleDateString(),
        price: item[1]
      }));
      setChartData(formattedData);
    } catch (err) {
      console.error("Failed to load chart", err);
    } finally {
      setChartLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fiatCurrency]);

  useEffect(() => {
    if (showChart) {
      fetchChartData();
    }
  }, [showChart, selectedCrypto]);

  const calculateConversion = () => {
    if (!fiatAmount || !selectedCrypto) return '0.00';
    const amount = parseFloat(fiatAmount.replace(/,/g, ''));
    if (isNaN(amount)) return '0.00';
    
    const value = amount / selectedCrypto.current_price;
    
    if (value === 0) return '0.00';
    if (value < 0.00001) return value.toFixed(8);
    if (value < 0.01) return value.toFixed(6);
    if (value < 1) return value.toFixed(4);
    return value.toFixed(2);
  };

  const handleFiatAmountChange = (e) => {
    const val = e.target.value;
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setFiatAmount(val);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center font-sans sm:p-4 transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      
      <div className={`w-full h-screen sm:h-auto sm:max-w-md ${darkMode ? 'bg-slate-900' : 'bg-white'} sm:rounded-3xl sm:shadow-2xl overflow-hidden relative border ${darkMode ? 'border-gray-800' : 'border-gray-100'} flex flex-col transition-colors duration-300`}>
        
        {/* Header */}
        <div className="absolute top-0 left-0 w-full p-4 pt-6 flex justify-between items-center z-10">
          <div className={`flex items-center gap-2 ${darkMode ? 'text-gray-300 bg-black/40' : 'text-gray-600 bg-white/80'} backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold shadow-sm`}>
            <TrendingUp size={14} />
            <span>Live Rates</span>
          </div>
          
          <div className="flex gap-2">
            {/* Donation Button */}
            <button 
              onClick={() => window.open(PAYPAL_LINK, '_blank')}
              className={`p-2 rounded-full backdrop-blur-md shadow-sm transition-all ${darkMode ? 'bg-black/40 text-pink-400 hover:bg-black/60' : 'bg-white/80 text-pink-500 hover:bg-white'}`}
              title="Donate"
            >
              <Heart size={16} fill="currentColor" className="opacity-80" />
            </button>

            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-full backdrop-blur-md shadow-sm transition-all ${darkMode ? 'bg-black/40 text-yellow-400 hover:bg-black/60' : 'bg-white/80 text-gray-600 hover:bg-white'}`}
            >
              {darkMode ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            <button 
              onClick={fetchData}
              disabled={loading}
              className={`p-2 rounded-full backdrop-blur-md shadow-sm transition-all ${darkMode ? 'bg-black/40 text-gray-300 hover:bg-black/60' : 'bg-white/80 text-gray-600 hover:bg-white'} ${loading ? 'animate-spin' : ''}`}
            >
              <RefreshCcw size={16} />
            </button>
          </div>
        </div>

        {/* TOP HALF: FIAT */}
        <div className={`flex-1 ${darkMode ? 'bg-slate-900' : 'bg-gradient-to-br from-indigo-50 to-blue-50'} p-8 pt-20 flex flex-col justify-center relative transition-colors duration-300`}>
          <label className={`text-xs font-bold ${darkMode ? 'text-indigo-300' : 'text-indigo-400'} uppercase tracking-wider mb-2`}>You Pay</label>
          
          <div className="flex items-end justify-between gap-4 mb-2">
            <input
              type="text"
              inputMode="decimal"
              value={fiatAmount}
              onChange={handleFiatAmountChange}
              className={`w-full bg-transparent text-4xl font-bold ${darkMode ? 'text-white placeholder-gray-600' : 'text-indigo-950 placeholder-indigo-200'} outline-none border-none p-0 transition-colors`}
              placeholder="0"
            />
            <div className="relative group shrink-0">
              <select
                value={fiatCurrency.code}
                onChange={(e) => setFiatCurrency(FIAT_OPTIONS.find(f => f.code === e.target.value))}
                className={`appearance-none py-2 pl-3 pr-8 rounded-xl shadow-sm font-bold cursor-pointer focus:ring-2 focus:outline-none border ${darkMode ? 'bg-gray-800 text-white border-gray-700 focus:ring-indigo-500' : 'bg-white text-gray-700 border-indigo-100 focus:ring-indigo-200'}`}
              >
                {FIAT_OPTIONS.map((f) => (
                  <option key={f.code} value={f.code}>
                    {f.code}
                  </option>
                ))}
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <ArrowDown size={14} strokeWidth={3} />
              </div>
            </div>
          </div>

          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-indigo-400'} font-medium flex items-center gap-2`}>
            <span>{fiatCurrency.flag} {fiatCurrency.name}</span>
          </div>

          <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 z-20">
            <div className={`${darkMode ? 'bg-gray-800 border-slate-900 text-indigo-400' : 'bg-white border-gray-50 text-indigo-600'} p-2 rounded-full shadow-lg border-4 transition-colors duration-300`}>
              <ArrowDown size={20} strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* BOTTOM HALF: CRYPTO */}
        <div className={`flex-1 ${darkMode ? 'bg-black' : 'bg-indigo-950'} p-8 pt-16 text-white flex flex-col justify-between transition-colors duration-300`}>
          
          <div>
            <div className="flex justify-between items-end mb-2">
                <label className="text-xs font-bold text-indigo-300 uppercase tracking-wider block">You Receive</label>
            </div>
            
            {loading && !selectedCrypto ? (
              <div className="animate-pulse space-y-4">
                <div className="h-12 bg-white/10 rounded w-2/3"></div>
                <div className="h-8 bg-white/10 rounded w-1/3"></div>
              </div>
            ) : error ? (
               <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                 <AlertCircle className="text-red-400 shrink-0" size={20} />
                 <div>
                   <p className="text-sm text-red-200 font-medium">{error}</p>
                   <button onClick={fetchData} className="text-xs text-white underline mt-1">Try again</button>
                 </div>
               </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="text-4xl font-bold tracking-tight text-white truncate max-w-[200px] sm:max-w-xs">
                    {calculateConversion()}
                  </div>
                </div>

                <div className="relative mb-6">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    {selectedCrypto?.image ? (
                        <img src={selectedCrypto.image} alt={selectedCrypto.name} className="w-6 h-6 rounded-full" />
                    ) : (
                        <Wallet size={20} className="text-indigo-400" />
                    )}
                  </div>
                  
                  <select
                    value={selectedCrypto?.id || ''}
                    onChange={(e) => {
                        const coin = cryptos.find(c => c.id === e.target.value);
                        setSelectedCrypto(coin);
                    }}
                    className={`w-full appearance-none ${darkMode ? 'bg-gray-900 border-gray-800 hover:bg-gray-800' : 'bg-indigo-900/50 border-indigo-800 hover:bg-indigo-900'} transition-colors border text-white py-4 pl-12 pr-10 rounded-2xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium`}
                  >
                    {cryptos.map((coin) => (
                      <option key={coin.id} value={coin.id} className="bg-gray-900 text-white">
                        {coin.name} ({coin.symbol.toUpperCase()})
                      </option>
                    ))}
                  </select>
                  
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400">
                    <ArrowDown size={16} />
                  </div>
                </div>

                {selectedCrypto && (
                  <div className={`flex flex-col gap-3 text-xs font-medium text-indigo-300 ${darkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-indigo-900/30 border-indigo-800/50'} p-4 rounded-xl border`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                           <Info size={12} />
                           <span>Current Price</span>
                        </div>
                        <div className="text-white text-base font-bold">
                          1 {selectedCrypto.symbol.toUpperCase()} = {fiatCurrency.symbol}{selectedCrypto.current_price.toLocaleString(undefined, {maximumFractionDigits: 2})}
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => setShowChart(true)}
                        className="flex items-center justify-center gap-2 w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors mt-1"
                    >
                        <LineChart size={14} />
                        View 7-Day Chart
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="text-center mt-4">
             <p className="text-[10px] text-indigo-400/60">
                {lastUpdated ? `Rates updated: ${lastUpdated.toLocaleTimeString()}` : 'Connecting to market...'}
             </p>
             <p className="text-[10px] text-indigo-400/40 mt-1">
                Data provided by CoinGecko API • Top 100 Cryptos (No Stablecoins)
             </p>
          </div>
        </div>

        {/* CHART MODAL */}
        {showChart && selectedCrypto && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
            <div className={`w-full max-w-sm ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'} rounded-2xl p-4 shadow-2xl relative`}>
              <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{selectedCrypto.name}</h3>
                    <p className="text-xs opacity-60">Last 7 Days Trend</p>
                  </div>
                  <button onClick={() => setShowChart(false)} className="p-2 rounded-full hover:bg-gray-100/10">
                    <X size={20} />
                  </button>
              </div>

              <div className="h-[200px] w-full">
                {chartLoading ? (
                    <div className="h-full flex items-center justify-center">
                        <RefreshCcw className="animate-spin opacity-50" />
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="date" hide={true} />
                        <YAxis hide={true} domain={['auto', 'auto']} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            labelStyle={{ color: darkMode ? '#9ca3af' : '#6b7280', fontSize: '10px' }}
                            itemStyle={{ color: '#6366f1', fontSize: '12px', fontWeight: 'bold' }}
                            formatter={(value) => [`${fiatCurrency.symbol}${value.toLocaleString()}`, 'Price']}
                        />
                        <Area type="monotone" dataKey="price" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}