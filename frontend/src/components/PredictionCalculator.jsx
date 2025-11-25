import React, { useState, useEffect } from 'react';
import { Calculator, DollarSign, TrendingUp, ArrowRight } from 'lucide-react';

export const PredictionCalculator = ({ currentPrice, predictedPrice, futurePrices, currency = 'USD' }) => {
    const [investment, setInvestment] = useState(1000);
    const [projection, setProjection] = useState(null);

    const currencySymbol = currency === 'INR' ? '₹' : '$';

    useEffect(() => {
        if (!currentPrice || !predictedPrice) return;

        const shares = investment / currentPrice;

        // Tomorrow's Projection
        const valueTomorrow = shares * predictedPrice;
        const profitTomorrow = valueTomorrow - investment;
        const roiTomorrow = (profitTomorrow / investment) * 100;

        // 7-Day Projection (using the last price in futurePrices)
        let value7Day = 0;
        let profit7Day = 0;
        let roi7Day = 0;

        if (futurePrices && futurePrices.length > 0) {
            const price7Day = futurePrices[futurePrices.length - 1];
            value7Day = shares * price7Day;
            profit7Day = value7Day - investment;
            roi7Day = (profit7Day / investment) * 100;
        }

        setProjection({
            shares: shares.toFixed(4),
            tomorrow: {
                value: valueTomorrow,
                profit: profitTomorrow,
                roi: roiTomorrow
            },
            sevenDay: {
                value: value7Day,
                profit: profit7Day,
                roi: roi7Day
            }
        });

    }, [investment, currentPrice, predictedPrice, futurePrices]);

    if (!projection) return null;

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Calculator size={18} className="text-orange-400" />
                Profit Calculator
            </h3>

            <div className="mb-6">
                <label className="block text-sm text-slate-400 mb-2">Investment Amount ({currencySymbol})</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-slate-500 font-bold">{currencySymbol}</span>
                    </div>
                    <input
                        type="number"
                        value={investment}
                        onChange={(e) => setInvestment(Math.max(0, Number(e.target.value)))}
                        className="bg-slate-900/50 border border-slate-700 text-white text-lg rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-3"
                        placeholder="1000"
                    />
                </div>
                <p className="text-xs text-slate-500 mt-2 text-right">
                    Buying ~{projection.shares} shares
                </p>
            </div>

            <div className="space-y-4">
                {/* Tomorrow's Projection */}
                <div className="bg-slate-900/30 rounded-xl p-4 border border-slate-700/30">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-400">Tomorrow</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${projection.tomorrow.roi >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                            {projection.tomorrow.roi >= 0 ? '+' : ''}{projection.tomorrow.roi.toFixed(2)}%
                        </span>
                    </div>
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-2xl font-bold text-white">{currencySymbol}{projection.tomorrow.value.toFixed(2)}</p>
                            <p className={`text-sm ${projection.tomorrow.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {projection.tomorrow.profit >= 0 ? '+' : ''}{currencySymbol}{projection.tomorrow.profit.toFixed(2)}
                            </p>
                        </div>
                        <ArrowRight size={20} className="text-slate-600 mb-1" />
                    </div>
                </div>

                {/* 7-Day Projection */}
                {projection.sevenDay.value > 0 && (
                    <div className="bg-slate-900/30 rounded-xl p-4 border border-slate-700/30">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-slate-400">In 7 Days</span>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${projection.sevenDay.roi >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                {projection.sevenDay.roi >= 0 ? '+' : ''}{projection.sevenDay.roi.toFixed(2)}%
                            </span>
                        </div>
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-2xl font-bold text-white">{currencySymbol}{projection.sevenDay.value.toFixed(2)}</p>
                                <p className={`text-sm ${projection.sevenDay.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {projection.sevenDay.profit >= 0 ? '+' : ''}{currencySymbol}{projection.sevenDay.profit.toFixed(2)}
                                </p>
                            </div>
                            <TrendingUp size={20} className="text-slate-600 mb-1" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
