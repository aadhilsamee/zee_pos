import React, { useState, useEffect } from 'react';
import { Search, History as HistoryIcon, Filter, Calendar, Package, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import storeProductAPI from '../services/storeProductAPI';
import Header from '../components/Header';

const StoreHistory = () => {
    const [history, setHistory] = useState([]);
    const [filteredHistory, setFilteredHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        searchProduct: '',
        searchDate: '',
        typeFilter: 'all',
    });

    useEffect(() => {
        fetchHistory();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [filters, history]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const response = await storeProductAPI.getHistory();
            setHistory(response.data.data);
        } catch (err) {
            setError('Failed to load store history');
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = history;

        if (filters.searchProduct) {
            filtered = filtered.filter((h) =>
                h.productName.toLowerCase().includes(filters.searchProduct.toLowerCase())
            );
        }

        if (filters.searchDate) {
            filtered = filtered.filter((h) =>
                new Date(h.createdAt).toLocaleDateString() === new Date(filters.searchDate).toLocaleDateString()
            );
        }

        if (filters.typeFilter !== 'all') {
            filtered = filtered.filter((h) => h.type === filters.typeFilter);
        }

        setFilteredHistory(filtered);
    };

    const handleFilterChange = (field, value) => {
        setFilters({ ...filters, [field]: value });
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <Header title="Store History" subtitle="Track all stock entries and deductions" />

            {error && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">{error}</div>
            )}

            {/* Filters */}
            <div className="mt-6 bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-soft border border-gray-100 dark:border-gray-700">
                <h2 className="text-base sm:text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                    <Search size={20} className="text-primary-600 dark:text-primary-400" />
                    Filters
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <input
                        type="text"
                        placeholder="Search by Product Name"
                        value={filters.searchProduct}
                        onChange={(e) => handleFilterChange('searchProduct', e.target.value)}
                        className="border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                    />
                    <input
                        type="date"
                        value={filters.searchDate}
                        onChange={(e) => handleFilterChange('searchDate', e.target.value)}
                        className="border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <select
                        value={filters.typeFilter}
                        onChange={(e) => handleFilterChange('typeFilter', e.target.value)}
                        className="border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="all">All Types</option>
                        <option value="add">Additions</option>
                        <option value="deduct">Deductions</option>
                    </select>
                </div>
            </div>

            {/* History Table */}
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-soft overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <HistoryIcon size={20} className="text-primary-600 dark:text-primary-400" />
                        Stock History ({filteredHistory.length})
                    </h2>
                </div>

                {loading && history.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">Loading history...</p>
                    </div>
                ) : filteredHistory.length === 0 ? (
                    <div className="p-12 text-center">
                        <HistoryIcon size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                        <p className="text-gray-500 dark:text-gray-400">No history found</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
                                    <tr>
                                        <th className="p-4 text-left text-xs font-semibold">Date</th>
                                        <th className="p-4 text-left text-xs font-semibold">Product</th>
                                        <th className="p-4 text-center text-xs font-semibold">Type</th>
                                        <th className="p-4 text-right text-xs font-semibold">Adjusted Qty</th>
                                        <th className="p-4 text-right text-xs font-semibold">Bag Config</th>
                                        <th className="p-4 text-right text-xs font-semibold">Total kg</th>
                                        <th className="p-4 text-left text-xs font-semibold">Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {filteredHistory.map((h, index) => (
                                        <tr key={h._id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/50'}`}>
                                            <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                                                {new Date(h.createdAt).toLocaleString()}
                                            </td>
                                            <td className="p-4 font-medium text-gray-900 dark:text-white">{h.productName}</td>
                                            <td className="p-4 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                                                    ${h.type === 'add' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                    {h.type === 'add' ? <ArrowUpCircle size={14} /> : <ArrowDownCircle size={14} />}
                                                    {h.type}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right font-semibold text-gray-900 dark:text-white">
                                                {h.quantity} {h.adjustmentType === 'units' ? 'kg' : 'Bags'}
                                            </td>
                                            <td className="p-4 text-right text-sm text-gray-600 dark:text-gray-400">
                                                {h.adjustmentType === 'bags' ? `${h.unitsPerBag} kg/bag` : '-'}
                                            </td>
                                            <td className="p-4 text-right font-bold text-primary-600 dark:text-primary-400">
                                                {h.type === 'add' ? '+' : '-'}{h.totalQuantityAdjusted.toFixed(2)}
                                            </td>
                                            <td className="p-4 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">{h.notes || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default StoreHistory;
