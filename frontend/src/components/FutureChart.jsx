import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, LineSeries } from 'lightweight-charts';

export const FutureChart = ({ data, colors: {
    backgroundColor = '#1e293b',
    lineColor = '#2962FF',
    textColor = 'white',
} = {} }) => {
    const chartContainerRef = useRef();
    const chartRef = useRef();
    const seriesRef = useRef();

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const handleResize = () => {
            if (chartRef.current) {
                chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: backgroundColor },
                textColor,
            },
            width: chartContainerRef.current.clientWidth,
            height: 300,
            grid: {
                vertLines: { color: '#334155' },
                horzLines: { color: '#334155' },
            },
            timeScale: {
                borderColor: '#475569',
            },
            rightPriceScale: {
                borderColor: '#475569',
            },
        });

        // Create Line Series for Future
        const lineSeries = chart.addSeries(LineSeries, {
            color: '#38bdf8',
            lineWidth: 3,
            lineStyle: 2, // Dashed
        });

        chartRef.current = chart;
        seriesRef.current = lineSeries;

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
            chartRef.current = null;
            seriesRef.current = null;
        };
    }, [backgroundColor, textColor]);

    useEffect(() => {
        if (seriesRef.current && data) {
            // Data should be { time: 'yyyy-mm-dd', value: 123 }
            seriesRef.current.setData(data);
            if (chartRef.current) {
                chartRef.current.timeScale().fitContent();
            }
        }
    }, [data]);

    return (
        <div ref={chartContainerRef} className="w-full h-[300px]" style={{ height: '300px' }} />
    );
};
