import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const RealTimeClock = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <Clock size={18} className="text-primary-600 dark:text-primary-400" />
            <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-900 dark:text-white leading-none">
                    {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-none mt-1">
                    {time.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
            </div>
        </div>
    );
};

export default RealTimeClock;
