import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Package, Plus, X, Search, AlertTriangle, Warehouse, History, ArrowUpCircle, ArrowDownCircle, Info } from 'lucide-react';
import { toast } from 'react-toastify';
import storeProductAPI from '../services/storeProductAPI';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';

const Store = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        costPrice: '0',
        quantity: '',
        unitsPerBag: '1',
        barcode: '',
        category: '',
        notes: ''
    });
    const [adjustData, setAdjustData] = useState({
        productId: '',
        productName: '',
        type: 'add',
        quantity: '',
        adjustmentType: 'bags',
        notes: ''
    });
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, product: null });

    const isMobile = window.innerWidth < 640;

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await storeProductAPI.getAll();
            setProducts(response.data.data);
        } catch (err) {
            setError('Failed to load store products');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleAdjustChange = (e) => {
        const { name, value } = e.target;
        setAdjustData({ ...adjustData, [name]: value });
    };

    const resetForm = () => {
        setFormData({
            name: '',
            costPrice: '0',
            quantity: '',
            unitsPerBag: '1',
            barcode: '',
            category: '',
            notes: ''
        });
        setEditingId(null);
        setIsModalOpen(false);
        setError('');
    };

    const resetAdjustForm = () => {
        setAdjustData({
            productId: '',
            productName: '',
            type: 'add',
            quantity: '',
            adjustmentType: 'bags',
            notes: ''
        });
        setIsAdjustModalOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.name || formData.quantity === '') {
            const msg = 'Product name and quantity are required';
            if (isMobile) {
                toast.error(msg);
            } else {
                setError(msg);
            }
            return;
        }

        try {
            setLoading(true);
            const upb = Number(formData.unitsPerBag) || 1;
            const bags = Number(formData.quantity);
            const cp = Number(formData.costPrice) || 0;

            let dataToSend;
            if (editingId) {
                const totalKg = bags * upb;
                dataToSend = {
                    ...formData,
                    quantity: totalKg,
                    unitsPerBag: upb,
                    costPrice: cp
                };
                await storeProductAPI.update(editingId, dataToSend);
                toast.success('Store product updated successfully');
            } else {
                dataToSend = {
                    ...formData,
                    unitsPerBag: upb,
                    costPrice: cp
                };
                await storeProductAPI.create(dataToSend);
                toast.success('Store product added successfully');
            }

            fetchProducts();
            resetForm();
        } catch (err) {
            const msg = 'Failed to save store product';
            if (isMobile) {
                toast.error(msg);
            } else {
                setError(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAdjustSubmit = async (e) => {
        e.preventDefault();
        if (!adjustData.quantity || adjustData.quantity <= 0) {
            toast.error('Please enter a valid quantity');
            return;
        }

        try {
            setLoading(true);
            await storeProductAPI.adjustStock(adjustData.productId, {
                type: adjustData.type,
                quantity: Number(adjustData.quantity),
                adjustmentType: adjustData.adjustmentType,
                notes: adjustData.notes
            });
            toast.success(`Stock ${adjustData.type === 'add' ? 'added' : 'deducted'} successfully`);
            fetchProducts();
            resetAdjustForm();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to adjust stock');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (product) => {
        const upb = product.unitsPerBag || 1;
        const bags = product.quantity / upb;
        setFormData({
            name: product.name,
            costPrice: product.costPrice || '0',
            quantity: bags,
            unitsPerBag: upb,
            barcode: product.barcode || '',
            category: product.category || '',
            notes: product.notes || ''
        });
        setEditingId(product._id);
        setIsModalOpen(true);
    };

    const openAdjustModal = (product, type) => {
        setAdjustData({
            productId: product._id,
            productName: product.name,
            type: type,
            quantity: '',
            adjustmentType: 'bags',
            notes: ''
        });
        setIsAdjustModalOpen(true);
    };

    const handleDelete = async () => {
        try {
            await storeProductAPI.delete(deleteModal.product._id);
            toast.success('Store product deleted successfully');
            fetchProducts();
            setDeleteModal({ isOpen: false, product: null });
        } catch (err) {
            toast.error('Failed to delete store product');
        }
    };

    const filteredProducts = products.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.barcode && product.barcode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const totalBags = products.reduce((sum, p) => sum + (p.quantity / (p.unitsPerBag || 1)), 0);

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-[#0A0F1C] text-slate-200">
            <Header title="Store Inventory" subtitle="Premium Warehouse Management" />

            {/* Premium Glassmorphic Statistics */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="relative group overflow-hidden bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:bg-white/10">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                        <Warehouse size={120} className="text-blue-400" />
                    </div>
                    <div className="relative z-10 flex items-center gap-6">
                        <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/20">
                            <Warehouse size={32} className="text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400 font-semibold tracking-wider uppercase">Active Products</p>
                            <p className="text-5xl font-black text-white mt-1 tracking-tight">{products.length}</p>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs font-medium text-blue-400/80">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                        Real-time Monitoring Active
                    </div>
                </div>

                <div className="relative group overflow-hidden bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:bg-white/10">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                        <Package size={120} className="text-purple-400" />
                    </div>
                    <div className="relative z-10 flex items-center gap-6">
                        <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg shadow-purple-500/20">
                            <Package size={32} className="text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400 font-semibold tracking-wider uppercase">Total Bags In Warehouse</p>
                            <p className="text-5xl font-black text-white mt-1 tracking-tight">{Math.floor(totalBags)} <span className="text-lg font-medium text-slate-400 ml-2">Bags</span></p>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs font-medium text-purple-400/80">
                        <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                        Inventory Optimized
                    </div>
                </div>
            </div>

            {/* Sleek Action Bar */}
            <div className="mt-10 flex flex-col lg:flex-row gap-6 items-stretch lg:items-center justify-between">
                <div className="relative flex-1 max-w-2xl group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                        <Search className="text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                    </div>
                    <input
                        type="text"
                        placeholder="Scan barcode or search by name / category..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-md text-white placeholder-slate-500 transition-all shadow-inner"
                    />
                </div>
                <div className="flex gap-4">
                    <button onClick={() => navigate('/store-history')} className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all group active:scale-95 shadow-lg">
                        <History size={20} className="text-slate-400 group-hover:rotate-[-45deg] transition-transform" />
                        <span className="font-bold">Access Logs</span>
                    </button>
                    <button onClick={() => setIsModalOpen(true)} className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl flex items-center justify-center gap-3 hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] hover:scale-[1.02] transition-all active:scale-95 font-bold shadow-xl">
                        <Plus size={22} />
                        New Inventory Entry
                    </button>
                </div>
            </div>

            {/* Premium Products Terminal */}
            <div className="mt-10 bg-white/5 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10">
                <div className="px-8 py-6 bg-white/5 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                        </div>
                        <h2 className="text-lg font-bold text-white tracking-wide uppercase flex items-center gap-3 ml-4">
                            <Warehouse size={22} className="text-blue-400" />
                            Inventory Database <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs ml-2">{filteredProducts.length} Entries</span>
                        </h2>
                    </div>
                    <Info size={20} className="text-slate-500 cursor-help hover:text-white transition-colors" />
                </div>

                {loading && products.length === 0 ? (
                    <div className="p-20 text-center">
                        <div className="relative w-20 h-20 mx-auto mb-6">
                            <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <p className="text-slate-400 font-bold animate-pulse uppercase tracking-widest">Hydrating Database...</p>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="p-24 text-center">
                        <div className="p-8 bg-white/5 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center border border-white/10">
                            <Package size={40} className="text-slate-600" />
                        </div>
                        <p className="text-slate-500 font-bold uppercase tracking-widest">Terminal Empty - No Results Found</p>
                    </div>
                ) : (
                    <>
                        {/* High-End Desktop Terminal */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-white/5 text-slate-400 uppercase text-[10px] font-black tracking-[0.2em] border-b border-white/5">
                                        <th className="p-6 text-left">Product / ID</th>
                                        <th className="p-6 text-left">Category Shell</th>
                                        <th className="p-6 text-right">Inventory Count</th>
                                        <th className="p-6 text-center">Control Protocol</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredProducts.map((product) => {
                                        const bagsCount = product.quantity / (product.unitsPerBag || 1);
                                        return (
                                            <tr key={product._id} className="group hover:bg-white/[0.04] transition-all duration-300">
                                                <td className="p-6">
                                                    <div>
                                                        <p className="text-white font-bold text-base tracking-tight group-hover:text-blue-400 transition-colors uppercase">{product.name}</p>
                                                        <p className="text-[10px] font-mono text-slate-500 mt-1 uppercase opacity-50">UID-{product._id.substring(18)}</p>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 text-slate-400 group-hover:border-blue-500/30 transition-colors">
                                                        {product.category || 'GENERAL'}
                                                    </span>
                                                </td>
                                                <td className="p-6 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-xl font-black text-white tracking-tight group-hover:scale-110 transition-transform origin-right">{Math.floor(bagsCount)}</span>
                                                        <span className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Full Bags</span>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex items-center justify-center gap-3">
                                                        <button onClick={() => openAdjustModal(product, 'add')} className="p-3 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-xl transition-all active:scale-90 shadow-lg shadow-green-500/0 hover:shadow-green-500/20" title="Inject Stock">
                                                            <ArrowUpCircle size={22} strokeWidth={2.5} />
                                                        </button>
                                                        <button onClick={() => openAdjustModal(product, 'deduct')} className="p-3 bg-red-500/10 text-red-500 hover:bg-red-50 hover:text-white rounded-xl transition-all active:scale-90 shadow-lg shadow-red-500/0 hover:shadow-red-500/20" title="Eject Stock">
                                                            <ArrowDownCircle size={22} strokeWidth={2.5} />
                                                        </button>
                                                        <div className="w-[1px] h-8 bg-white/10 mx-2"></div>
                                                        <button onClick={() => handleEdit(product)} className="p-3 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-xl transition-all active:scale-90" title="Modify Record">
                                                            <Edit2 size={20} strokeWidth={2.5} />
                                                        </button>
                                                        <button onClick={() => setDeleteModal({ isOpen: true, product })} className="p-3 bg-pink-500/10 text-pink-500 hover:bg-pink-500 hover:text-white rounded-xl transition-all active:scale-90" title="Purge Record">
                                                            <Trash2 size={20} strokeWidth={2.5} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Premium mobile Cards */}
                        <div className="md:hidden space-y-px bg-white/5">
                            {filteredProducts.map((product) => {
                                const bagsCount = product.quantity / (product.unitsPerBag || 1);
                                return (
                                    <div key={product._id} className="p-6 bg-white/[0.02] active:bg-white/[0.05] transition-colors">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-black text-white text-lg uppercase tracking-tight">{product.name}</h3>
                                                <span className="inline-block mt-1 text-[10px] font-bold text-blue-400 uppercase bg-blue-500/10 px-2 py-0.5 rounded-full">{product.category || 'GENERAL'}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => openAdjustModal(product, 'add')} className="p-3 bg-green-500/10 text-green-500 rounded-xl">
                                                    <ArrowUpCircle size={20} />
                                                </button>
                                                <button onClick={() => openAdjustModal(product, 'deduct')} className="p-3 bg-red-500/10 text-red-500 rounded-xl">
                                                    <ArrowDownCircle size={20} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mt-6 flex items-end justify-between border-t border-white/5 pt-4">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">Inventory Status</span>
                                                <span className="text-3xl font-black text-white">{Math.floor(bagsCount)} <span className="text-xs font-bold text-slate-500 ml-1">BAGS</span></span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleEdit(product)} className="p-3 bg-white/5 text-slate-400 rounded-xl border border-white/10">
                                                    <Edit2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* Premium Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 z-[9999] animate-fade-in">
                    <div className="bg-[#111827] rounded-[2.5rem] border border-white/10 shadow-[0_0_100px_rgba(37,99,235,0.2)] w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up">
                        <div className="px-10 py-8 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex justify-between items-center relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-white/20"></div>
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tight">{editingId ? 'Modify' : 'Initialize'} Record</h3>
                                <p className="text-blue-100/70 text-sm font-medium mt-1">Update warehouse inventory shell</p>
                            </div>
                            <button onClick={resetForm} className="p-3 hover:bg-white/10 rounded-2xl transition-all active:scale-90">
                                <X size={28} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-10 space-y-6 overflow-y-auto">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-5 rounded-[1.5rem] flex items-center gap-4 animate-shake">
                                    <AlertTriangle size={24} className="shrink-0" />
                                    <span className="text-sm font-bold uppercase tracking-wide">{error}</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-3 ml-1">Product Signature *</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder-slate-600 font-bold transition-all" placeholder="Enter formal product name" required />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-3 ml-1">{editingId ? 'Current Payload (Bags)' : 'Initial Payload (Bags)'} *</label>
                                <div className="relative group">
                                    <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder-slate-600 font-black text-xl transition-all pr-24" placeholder="0" min="0" step="1" required />
                                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 font-black uppercase tracking-widest text-xs group-focus-within:text-blue-400">Bags</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-3 ml-1">Object Barcode</label>
                                    <input type="text" name="barcode" value={formData.barcode} onChange={handleChange} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder-slate-600 text-sm font-bold" placeholder="Optional identifier" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-3 ml-1">Classification</label>
                                    <input type="text" name="category" value={formData.category} onChange={handleChange} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder-slate-600 text-sm font-bold" placeholder="E.g., FOOD, RAW" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-3 ml-1">Deployment Notes</label>
                                <textarea name="notes" value={formData.notes} onChange={handleChange} rows="3" className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder-slate-600 text-sm font-bold resize-none" placeholder="Additional operational details..."></textarea>
                            </div>

                            <div className="flex gap-4 pt-4 sticky bottom-0 bg-[#111827]">
                                <button type="button" onClick={resetForm} className="flex-1 px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl hover:bg-white/10 transition-all font-bold uppercase tracking-widest text-[10px]">
                                    Abort
                                </button>
                                <button type="submit" disabled={loading} className="flex-2 px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl hover:shadow-blue-500/20 active:scale-95 disabled:opacity-50 transition-all">
                                    {loading ? 'Processing...' : editingId ? 'Commit Changes' : 'Execute Initial Add'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Premium Adjustment Modal */}
            {isAdjustModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 z-[9999] animate-fade-in">
                    <div className="bg-[#111827] rounded-[2.5rem] border border-white/10 shadow-2xl w-full max-w-lg animate-slide-up overflow-hidden">
                        <div className={`px-10 py-8 text-white flex justify-between items-center ${adjustData.type === 'add' ? 'bg-gradient-to-r from-green-600 to-emerald-700' : 'bg-gradient-to-r from-red-600 to-rose-700'}`}>
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                                    {adjustData.type === 'add' ? <ArrowUpCircle strokeWidth={3} /> : <ArrowDownCircle strokeWidth={3} />}
                                    {adjustData.type === 'add' ? 'Inject Stock' : 'Eject Stock'}
                                </h3>
                                <p className="text-white/70 text-sm font-medium mt-1">Update inventory flow parameters</p>
                            </div>
                            <button onClick={resetAdjustForm} className="p-3 hover:bg-white/10 rounded-2xl transition-all">
                                <X size={28} />
                            </button>
                        </div>

                        <form onSubmit={handleAdjustSubmit} className="p-10 space-y-8">
                            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Target Product Signature</p>
                                <p className="text-xl font-black text-white mt-1 uppercase tracking-tight">{adjustData.productName}</p>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-3 ml-1">Payload Quantity</label>
                                <div className="relative group">
                                    <input type="number" name="quantity" value={adjustData.quantity} onChange={handleAdjustChange} className="w-full px-8 py-6 bg-white/5 border border-white/10 rounded-3xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder-slate-600 font-black text-4xl transition-all pr-32" placeholder="0" min="1" step="1" required autoFocus />
                                    <span className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-500 font-black uppercase tracking-[0.2em] text-xs">Full Bags</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-3 ml-1">Operation Log Entry</label>
                                <textarea name="notes" value={adjustData.notes} onChange={handleAdjustChange} rows="2" className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder-slate-600 text-sm font-bold resize-none" placeholder="Enter reason for this operation..."></textarea>
                            </div>

                            <div className="flex gap-4 pt-2">
                                <button type="button" onClick={resetAdjustForm} className="flex-1 px-8 py-5 border border-white/10 text-slate-400 rounded-2xl hover:bg-white/5 transition-all font-black uppercase tracking-widest text-[10px]">
                                    Cancel Op
                                </button>
                                <button type="submit" disabled={loading} className={`flex-2 px-10 py-5 text-white rounded-2xl font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 ${adjustData.type === 'add' ? 'bg-gradient-to-r from-green-600 to-emerald-700 shadow-green-500/20' : 'bg-gradient-to-r from-red-600 to-rose-700 shadow-red-500/20'}`}>
                                    {loading ? 'Processing...' : 'Confirm Execution'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* High-Contrast Delete Terminal */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 z-[10000] animate-fade-in">
                    <div className="bg-[#111827] rounded-[3rem] border-2 border-red-500/50 shadow-[0_0_150px_rgba(239,68,68,0.3)] w-full max-w-md p-10 animate-slide-up text-center">
                        <div className="p-8 bg-red-500/10 rounded-[2rem] w-24 h-24 mx-auto mb-8 flex items-center justify-center border-2 border-red-500/20 animate-pulse">
                            <AlertTriangle size={48} className="text-red-500" />
                        </div>
                        <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Purge Data?</h3>
                        <p className="text-slate-500 font-bold uppercase tracking-[0.1em] text-xs mb-8">This action will permanently delete this record from the local warehouse hive.</p>

                        <div className="p-6 bg-white/5 rounded-2xl border border-white/10 mb-10">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Target Signature</p>
                            <p className="text-xl font-black text-red-400 uppercase tracking-tight mt-1">{deleteModal.product?.name}</p>
                        </div>

                        <div className="flex flex-col gap-4">
                            <button onClick={handleDelete} className="w-full py-5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black uppercase tracking-[0.3em] transition-all shadow-xl active:scale-95 shadow-red-600/20">
                                Confirm Purge
                            </button>
                            <button onClick={() => setDeleteModal({ isOpen: false, product: null })} className="w-full py-5 bg-white/5 text-slate-400 rounded-2xl font-black uppercase tracking-[0.3em] transition-all hover:bg-white/10 text-[10px]">
                                Abort Protocol
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Premium Styles */}
            <style jsx="true">{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slide-up {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
                .animate-slide-up { animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .animate-shake { animation: shake 0.3s ease-in-out infinite; }
                
                ::-webkit-scrollbar {
                    width: 8px;
                }
                ::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.02);
                }
                ::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                ::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </div>
    );
};

export default Store;
