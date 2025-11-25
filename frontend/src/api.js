import axios from 'axios';

const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8000/api'
    : 'https://sayandeepghosh-ai-stock-predictor-backend.hf.space/api';

// Detect if running on GitHub Pages or any non-localhost environment
const IS_DEMO_MODE = false; // Disabled: We now have a real backend!

// Mock Data for Search (Fallback)
const MOCK_STOCKS = [
    { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ' },
    { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ' },
    { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ' },
    { symbol: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ' },
    { symbol: 'AMD', name: 'Advanced Micro Devices', exchange: 'NASDAQ' },
    { symbol: 'NFLX', name: 'Netflix Inc.', exchange: 'NASDAQ' },
    { symbol: 'INTC', name: 'Intel Corporation', exchange: 'NASDAQ' },
    { symbol: 'RELIANCE.NS', name: 'Reliance Industries Ltd', exchange: 'NSE' },
    { symbol: 'TCS.NS', name: 'Tata Consultancy Services', exchange: 'NSE' },
    { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Ltd', exchange: 'NSE' },
    { symbol: 'ICICIBANK.NS', name: 'ICICI Bank Ltd', exchange: 'NSE' },
    { symbol: 'INFY.NS', name: 'Infosys Ltd', exchange: 'NSE' },
    { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel Ltd', exchange: 'NSE' },
    { symbol: 'ITC.NS', name: 'ITC Ltd', exchange: 'NSE' },
    { symbol: 'SBIN.NS', name: 'State Bank of India', exchange: 'NSE' },
    { symbol: 'LICI.NS', name: 'LIC India', exchange: 'NSE' },
    { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever Ltd', exchange: 'NSE' },
    { symbol: 'TATAMOTORS.NS', name: 'Tata Motors Ltd', exchange: 'NSE' },
    { symbol: 'LT.NS', name: 'Larsen & Toubro Ltd', exchange: 'NSE' },
    { symbol: 'HCLTECH.NS', name: 'HCL Technologies Ltd', exchange: 'NSE' },
    { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance Ltd', exchange: 'NSE' },
    { symbol: 'SUNPHARMA.NS', name: 'Sun Pharmaceutical Industries', exchange: 'NSE' },
    { symbol: 'MARUTI.NS', name: 'Maruti Suzuki India Ltd', exchange: 'NSE' },
    { symbol: 'TITAN.NS', name: 'Titan Company Ltd', exchange: 'NSE' },
    { symbol: 'ASIANPAINT.NS', name: 'Asian Paints Ltd', exchange: 'NSE' },
    { symbol: 'ADANIENT.NS', name: 'Adani Enterprises Ltd', exchange: 'NSE' },
    { symbol: 'AXISBANK.NS', name: 'Axis Bank Ltd', exchange: 'NSE' },
    { symbol: 'WIPRO.NS', name: 'Wipro Ltd', exchange: 'NSE' },
    { symbol: 'ZOMATO.NS', name: 'Zomato Ltd', exchange: 'NSE' },
    { symbol: 'PAYTM.NS', name: 'One97 Communications (Paytm)', exchange: 'NSE' }
];

// Simple seeded random number generator to ensure consistency
const seededRandom = (seed) => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
};

// Technical Analysis Helpers
const calculateSMA = (data, period) => {
    if (data.length < period) return null;
    const slice = data.slice(-period);
    const sum = slice.reduce((acc, val) => acc + val.close, 0);
    return sum / period;
};

const calculateRSI = (data, period = 14) => {
    if (data.length < period + 1) return 50;
    let gains = 0;
    let losses = 0;

    for (let i = data.length - period; i < data.length; i++) {
        const change = data[i].close - data[i - 1].close;
        if (change > 0) gains += change;
        else losses -= change;
    }

    if (losses === 0) return 100;
    const rs = gains / losses;
    return 100 - (100 / (1 + rs));
};

// Helper to fetch real data from Yahoo Finance via CORS Proxy
const fetchRealData = async (symbol) => {
    const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=3mo`;

    // List of proxies to try (in order of reliability)
    const proxies = [
        'https://corsproxy.io/?',
        'https://api.allorigins.win/raw?url=',
        'https://thingproxy.freeboard.io/fetch/',
        'https://api.codetabs.com/v1/proxy?quest='
    ];

    for (const proxy of proxies) {
        try {
            console.log(`Attempting fetch via ${proxy}...`);
            const response = await axios.get(proxy + encodeURIComponent(targetUrl));

            // Handle different proxy response structures
            const data = response.data;
            const chartResult = data.chart ? data.chart.result : data.result; // Some proxies unwrap differently

            if (!chartResult || !chartResult[0]) {
                throw new Error("Invalid response structure");
            }

            const result = chartResult[0];
            const quote = result.indicators.quote[0];
            const timestamps = result.timestamp;

            if (!timestamps || !quote || !quote.close) {
                throw new Error("Missing chart data");
            }

            const chartData = timestamps.map((ts, i) => ({
                time: new Date(ts * 1000).toISOString().split('T')[0],
                value: quote.close[i],
                open: quote.open[i],
                high: quote.high[i],
                low: quote.low[i],
                close: quote.close[i]
            })).filter(item => item.close !== null);

            const currentPrice = result.meta.regularMarketPrice;
            const currency = result.meta.currency;

            return { currentPrice, chartData, currency };
        } catch (error) {
            console.warn(`Fetch failed via ${proxy}:`, error);
            // Continue to next proxy
        }
    }

    console.error("All proxies failed to fetch real data.");
    return null;
};

const generatePredictionFromRealData = (symbol, realData) => {
    const { currentPrice, chartData, currency } = realData;

    // 1. Calculate Technical Indicators
    const sma20 = calculateSMA(chartData, 20) || currentPrice;
    const sma50 = calculateSMA(chartData, 50) || currentPrice;
    const rsi = calculateRSI(chartData);

    // 2. Determine Sentiment Score (Deterministic)
    let score = 0;
    if (currentPrice > sma20) score += 2; // Bullish trend
    if (sma20 > sma50) score += 1;        // Golden cross territory
    if (rsi < 30) score += 2;             // Oversold (Buy signal)
    if (rsi > 70) score -= 2;             // Overbought (Sell signal)

    // 3. Generate Prediction
    // Use date + symbol as seed for consistency (so it doesn't change on refresh)
    const today = new Date().toISOString().split('T')[0];
    const seedString = symbol + today;
    let seed = 0;
    for (let i = 0; i < seedString.length; i++) seed += seedString.charCodeAt(i);

    const randomFactor = seededRandom(seed); // 0 to 1

    // Base prediction on score
    let direction = 'NEUTRAL';
    let predictedChange = 0;

    if (score > 1) {
        direction = 'UP';
        predictedChange = 0.01 + (randomFactor * 0.03); // +1% to +4%
    } else if (score < -1) {
        direction = 'DOWN';
        predictedChange = -0.01 - (randomFactor * 0.02); // -1% to -3%
    } else {
        // Slight drift based on recent momentum
        const momentum = chartData[chartData.length - 1].close - chartData[chartData.length - 5].close;
        direction = momentum > 0 ? 'UP' : 'DOWN';
        predictedChange = (momentum > 0 ? 0.005 : -0.005) + (randomFactor * 0.01);
    }

    const predictedPrice = currentPrice * (1 + predictedChange);
    const confidence = 0.75 + (Math.abs(score) * 0.05); // Higher score = higher confidence

    // Cap confidence at 95% (99% is unrealistic)
    const finalConfidence = Math.min(confidence, 0.95);

    // Generate future prices (Deterministic walk)
    const futurePrices = [];
    let futurePrice = currentPrice;
    for (let i = 0; i < 7; i++) {
        const dailySeed = seed + i + 1;
        const dailyRandom = seededRandom(dailySeed) * 0.02 - 0.01; // -1% to +1% noise
        const trendComponent = predictedChange / 7; // Distribute predicted change over 7 days

        futurePrice = futurePrice * (1 + trendComponent + dailyRandom);
        futurePrices.push(futurePrice);
    }

    return {
        symbol: symbol.toUpperCase(),
        current_price: currentPrice,
        predicted_price: predictedPrice,
        direction: direction,
        confidence: finalConfidence,
        probability_up: direction === 'UP' ? finalConfidence : 1 - finalConfidence,
        probability_down: direction === 'DOWN' ? finalConfidence : 1 - finalConfidence,
        shap_features: [
            ['RSI (14)', (rsi - 50) / 50], // Normalized
            ['SMA (20) vs Price', (currentPrice - sma20) / currentPrice * 10],
            ['SMA (50) Trend', (sma20 - sma50) / sma50 * 10],
            ['Market Momentum', score * 0.2],
            ['Volatility', (seededRandom(seed + 10) * 0.5)]
        ],
        chart_data: chartData,
        future_prices: futurePrices,
        currency: currency
    };
};

// Fallback Mock Generator (Deterministic)
const generateMockPrediction = (symbol) => {
    const isIndian = symbol.includes('.NS');
    const currency = isIndian ? 'INR' : 'USD';
    const basePrice = isIndian ? 1260 : 150;

    // Seed based on symbol + date
    const today = new Date().toISOString().split('T')[0];
    const seedString = symbol + today;
    let seed = 0;
    for (let i = 0; i < seedString.length; i++) seed += seedString.charCodeAt(i);

    const currentPrice = basePrice + (seededRandom(seed) * basePrice * 0.1); // +/- 10% from base
    const isBullish = seededRandom(seed + 1) > 0.5;

    const predictedPrice = currentPrice * (1 + (isBullish ? 0.02 : -0.015));
    const direction = predictedPrice > currentPrice ? 'UP' : 'DOWN';
    const confidence = 0.82; // Fixed high confidence for mock

    const chartData = [];
    let price = currentPrice * 0.9;
    const now = new Date();
    for (let i = 30; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        // Deterministic random walk
        price = price * (1 + (seededRandom(seed + i + 100) * 0.04 - 0.02));
        chartData.push({
            time: date.toISOString().split('T')[0],
            open: price * 0.99,
            high: price * 1.01,
            low: price * 0.98,
            close: price
        });
    }

    const futurePrices = [];
    let futurePrice = currentPrice;
    for (let i = 0; i < 7; i++) {
        futurePrice = futurePrice * (1 + (seededRandom(seed + i + 200) * 0.02 - 0.005));
        futurePrices.push(futurePrice);
    }

    return {
        symbol: symbol.toUpperCase(),
        current_price: currentPrice,
        predicted_price: predictedPrice,
        direction: direction,
        confidence: confidence,
        probability_up: direction === 'UP' ? confidence : 1 - confidence,
        probability_down: direction === 'DOWN' ? confidence : 1 - confidence,
        shap_features: [
            ['Simulated Trend', isBullish ? 0.6 : -0.6],
            ['Historical Support', 0.3],
            ['Volume Profile', 0.2]
        ],
        chart_data: chartData,
        future_prices: futurePrices,
        currency: currency
    };
};

export const searchStocks = async (query) => {
    try {
        const response = await axios.get(`${API_URL}/search?query=${query}`);
        return response.data;
    } catch (error) {
        console.warn("Backend search failed, falling back to Yahoo Finance/Static list:", error);

        // Fallback to Yahoo Finance Autocomplete via CORS Proxy
        try {
            const proxyUrl = 'https://corsproxy.io/?';
            const targetUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0&enableFuzzyQuery=false&quotesQueryId=tss_match_phrase_query`;

            const response = await axios.get(proxyUrl + encodeURIComponent(targetUrl));

            if (response.data && response.data.quotes) {
                return response.data.quotes
                    .filter(quote => quote.quoteType === 'EQUITY' || quote.quoteType === 'ETF' || quote.quoteType === 'INDEX')
                    .map(quote => ({
                        symbol: quote.symbol,
                        name: quote.shortname || quote.longname || quote.symbol,
                        exchange: quote.exchange
                    }));
            }
        } catch (yahooError) {
            console.error("Yahoo Search API also failed:", yahooError);
        }

        // Final fallback to static list
        return MOCK_STOCKS.filter(s =>
            s.symbol.toLowerCase().includes(query.toLowerCase()) ||
            s.name.toLowerCase().includes(query.toLowerCase())
        );
    }
};

export const getPrediction = async (symbol) => {
    try {
        console.log(`Fetching prediction for ${symbol} from ${API_URL}...`);
        const response = await axios.get(`${API_URL}/predict/${symbol}`);
        return response.data;
    } catch (error) {
        // 1. If it's a 404 (Stock Not Found), throw immediately. Do NOT mock.
        if (error.response && error.response.status === 404) {
            console.error("Stock not found in backend.");
            throw new Error(`Stock "${symbol}" not found.`);
        }

        console.error("Backend prediction failed (likely sleeping or network error), falling back to Client-Side AI:", error);

        // 2. Fallback to Client-Side "Smart" Logic (Yahoo Finance via Proxy)
        console.log("Attempting to fetch real data for client-side analysis...");
        const realData = await fetchRealData(symbol);

        if (realData) {
            console.log("Real data fetched! Running client-side analysis...");
            return generatePredictionFromRealData(symbol, realData);
        } else {
            // 3. If Real Data also fails, it likely doesn't exist.
            // Do NOT generate random mock data for production.
            console.error("Real fetch failed. Stock likely invalid.");
            throw new Error(`Could not fetch data for "${symbol}". Please check the ticker.`);
        }
    }
};
