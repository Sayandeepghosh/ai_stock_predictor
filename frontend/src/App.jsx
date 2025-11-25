import React, { useState } from 'react';
import { Search, TrendingUp, TrendingDown, Activity, AlertCircle, BarChart2, Zap, Target, Layers } from 'lucide-react';
import { getPrediction, searchStocks } from './api';
import { Chart } from './components/Chart';
import { FutureChart } from './components/FutureChart';
import { PredictionCalculator } from './components/PredictionCalculator';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isShaking, setIsShaking] = useState(false);

    const handleSearchChange = async (e) => {
        const value = e.target.value;
        setQuery(value);

        if (value.length > 1) {
            try {
                const results = await searchStocks(value);
                setSuggestions(results);
                setShowSuggestions(true);
            } catch (err) {
                console.error("Autocomplete error:", err);
            }
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const selectStock = (symbol) => {
        setQuery(symbol);
        setSuggestions([]);
        setShowSuggestions(false);
        // Trigger search immediately
        handleSearch(null, symbol);
    };

    const handleSearch = async (e, overrideQuery = null) => {
        if (e) e.preventDefault();
        const searchQuery = overrideQuery || query;

        if (!searchQuery || !searchQuery.trim()) {
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500);
            return;
        }

        console.log("Searching for:", searchQuery);
        setLoading(true);
        setError(null);
        setPrediction(null);
        setShowSuggestions(false);

        try {
            const data = await getPrediction(searchQuery);
            console.log("Received prediction data:", data);
            setPrediction(data);
        } catch (err) {
            console.error("Search error:", err);
            setError(err.message || 'Failed to fetch prediction.');
        } finally {
            setLoading(false);
        }
    };

    // Helper to generate future dates for the chart
    const getFutureData = (startPrice, futurePrices) => {
        if (!futurePrices) return [];
        const data = [];
        const today = new Date();

        // Add current price as start point
        data.push({
            time: today.toISOString().split('T')[0],
            value: startPrice
        });

        futurePrices.forEach((price, index) => {
            const date = new Date(today);
            date.setDate(today.getDate() + index + 1);
            data.push({
                time: date.toISOString().split('T')[0],
                value: price
            });
        });
        return data;
    };

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans selection:bg-brand-accent selection:text-brand-dark" onClick={() => setShowSuggestions(false)}>

            {/* Navbar */}
            <nav className="border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
                            <Activity size={20} className="text-white" />
                        </div>
                        <span className="font-bold text-xl tracking-tight">Antigravity<span className="text-blue-400">Trade</span></span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-mono text-slate-500">v1.0.0-beta</span>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-12">

                {/* Hero / Search Section */}
                <div className="text-center mb-16">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400"
                    >
                        Predict the Market with AI
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-slate-400 text-lg max-w-2xl mx-auto mb-10"
                    >
                        Institutional-grade analysis powered by Ensemble Learning and Temporal Fusion Transformers.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : { opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4 }}
                        className="max-w-2xl mx-auto relative group z-50"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={`absolute -inset-1 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 ${isShaking ? 'bg-red-600 opacity-75' : 'bg-gradient-to-r from-blue-600 to-cyan-600'}`}></div>
                        <form onSubmit={handleSearch} className={`relative bg-slate-900 rounded-xl overflow-hidden flex shadow-2xl border transition-colors duration-300 ${isShaking ? 'border-red-500' : 'border-slate-800'}`}>
                            <div className="pl-6 flex items-center pointer-events-none">
                                <Search className={`transition-colors ${isShaking ? 'text-red-500' : 'text-slate-500'}`} size={24} />
                            </div>
                            <input
                                type="text"
                                value={query}
                                onChange={handleSearchChange}
                                onFocus={() => query.length > 1 && setShowSuggestions(true)}
                                placeholder="Search ticker (e.g. NVDA, RELIANCE.NS)..."
                                className="w-full bg-transparent text-xl py-5 px-4 focus:outline-none placeholder:text-slate-600"
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className={`font-semibold px-8 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isShaking ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                            >
                                {loading ? (
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : 'Analyze'}
                            </button>
                        </form>

                        {/* Autocomplete Dropdown */}
                        <AnimatePresence>
                            {showSuggestions && suggestions.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50"
                                >
                                    {suggestions.map((stock) => (
                                        <div
                                            key={stock.symbol}
                                            onClick={() => selectStock(stock.symbol)}
                                            className="px-6 py-3 hover:bg-slate-700 cursor-pointer flex justify-between items-center transition-colors border-b border-slate-700/50 last:border-0"
                                        >
                                            <div className="text-left">
                                                <p className="font-bold text-white">{stock.symbol}</p>
                                                <p className="text-sm text-slate-400">{stock.name}</p>
                                            </div>
                                            <span className="text-xs font-mono bg-slate-900 text-slate-500 px-2 py-1 rounded">
                                                {stock.exchange}
                                            </span>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>

                {/* Error State */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="max-w-2xl mx-auto mb-12 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-3"
                        >
                            <AlertCircle size={20} />
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Dashboard */}
                <AnimatePresence>
                    {prediction && (
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
                        >

                            {/* Left Column: Key Metrics & Prediction */}
                            <div className="lg:col-span-4 space-y-6">

                                {/* Main Card */}
                                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <Zap size={100} />
                                    </div>

                                    <div className="flex justify-between items-start mb-8">
                                        <div>
                                            <h2 className="text-4xl font-bold tracking-tight">{prediction.symbol}</h2>
                                            <p className="text-slate-400 mt-1">Real-time Analysis</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-3xl font-mono font-bold">
                                                {prediction.currency === 'INR' ? '₹' : '$'}{prediction.current_price.toFixed(2)}
                                            </p>
                                            <p className="text-sm text-slate-500">Last Close</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className={`p-4 rounded-xl border ${prediction.direction === 'UP' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-slate-400 font-medium">AI Prediction</span>
                                                {prediction.direction === 'UP' ?
                                                    <TrendingUp className="text-emerald-500" size={24} /> :
                                                    <TrendingDown className="text-rose-500" size={24} />
                                                }
                                            </div>
                                            <div className={`text-3xl font-bold ${prediction.direction === 'UP' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {prediction.direction}
                                            </div>
                                            <div className="mt-2 flex items-center gap-2">
                                                <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${prediction.direction === 'UP' ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                                        style={{ width: `${prediction.confidence * 100}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm font-mono text-slate-300">{(prediction.confidence * 100).toFixed(1)}% Conf.</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                                                <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Bullish Prob</p>
                                                <p className="text-xl font-bold text-emerald-400">{(prediction.probability_up * 100).toFixed(1)}%</p>
                                            </div>
                                            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                                                <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Bearish Prob</p>
                                                <p className="text-xl font-bold text-rose-400">{(prediction.probability_down * 100).toFixed(1)}%</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* SHAP Features */}
                                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-xl">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <Layers size={18} className="text-blue-400" />
                                        Key Drivers
                                    </h3>
                                    <div className="space-y-3">
                                        {prediction.shap_features.map(([feature, value], index) => (
                                            <div key={index} className="flex items-center justify-between group">
                                                <span className="text-slate-400 text-sm group-hover:text-slate-200 transition-colors">{feature}</span>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden flex justify-center relative">
                                                        {/* Center line */}
                                                        <div className="absolute w-px h-full bg-slate-500 left-1/2"></div>
                                                        <div
                                                            className={`h-full absolute ${value > 0 ? 'bg-emerald-500 left-1/2' : 'bg-rose-500 right-1/2'}`}
                                                            style={{ width: `${Math.min(Math.abs(value) * 50, 50)}%` }} // Scale for visual
                                                        />
                                                    </div>
                                                    <span className={`text-xs font-mono w-12 text-right ${value > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                        {value > 0 ? '+' : ''}{value.toFixed(3)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Prediction Calculator */}
                                <PredictionCalculator
                                    currentPrice={prediction.current_price}
                                    predictedPrice={prediction.predicted_price}
                                    futurePrices={prediction.future_prices}
                                    currency={prediction.currency}
                                />
                            </div>

                            {/* Right Column: Chart */}
                            <div className="lg:col-span-8 space-y-6">
                                {/* Historical Chart */}
                                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-xl flex flex-col">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-bold flex items-center gap-2">
                                            <BarChart2 size={18} className="text-blue-400" />
                                            Technical Analysis
                                        </h3>
                                        <div className="flex gap-2">
                                            {['1D', '1W', '1M', '3M', '1Y'].map(tf => (
                                                <button key={tf} className="px-3 py-1 text-xs font-medium rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors">
                                                    {tf}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex-1 min-h-[400px] bg-slate-900/50 rounded-xl overflow-hidden border border-slate-700/30">
                                        <Chart data={prediction.chart_data} />
                                    </div>
                                </div>

                                {/* Future Forecast Section */}
                                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-xl">
                                    <div className="flex justify-between items-center mb-6">
                                        <div>
                                            <h3 className="text-lg font-bold flex items-center gap-2">
                                                <Target size={18} className="text-purple-400" />
                                                7-Day AI Forecast
                                            </h3>
                                            <p className="text-slate-400 text-sm mt-1">
                                                Projected path based on volatility and trend analysis
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-slate-400 text-sm">Tomorrow's Target</p>
                                            <p className="text-2xl font-bold text-purple-400">
                                                {prediction.currency === 'INR' ? '₹' : '$'}{prediction.predicted_price ? prediction.predicted_price.toFixed(2) : 'N/A'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="h-[300px] bg-slate-900/50 rounded-xl overflow-hidden border border-slate-700/30">
                                        <FutureChart data={getFutureData(prediction.current_price, prediction.future_prices)} />
                                    </div>
                                </div>
                            </div>

                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}

export default App;
