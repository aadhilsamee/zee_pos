import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Package, Plus, X, Search, AlertTriangle, Warehouse, History, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
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
        <div className="p-4 sm:p-6 lg:p-8">
            <Header title="Store Inventory" subtitle="Manage warehouse products" />

            {/* Statistics */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg border border-blue-400">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-blue-100 font-medium">Total Products</p>
                            <p className="text-3xl font-bold text-white mt-1">{products.length}</p>
                        </div>
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                            <Warehouse size={28} className="text-white" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg border border-purple-400">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-purple-100 font-medium">Total Bags In Stock</p>
                            <p className="text-3xl font-bold text-white mt-1">{Math.floor(totalBags)} Bags</p>
                        </div>
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                            <Package size={28} className="text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Add Button */}
            <div className="mt-6 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search store products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400"
                    />
                </div>
                <div className="flex gap-2">
                    <button onClick={() => navigate('/store-history')} className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-semibold">
                        <History size={20} />
                        History
                    </button>
                    <button onClick={() => setIsModalOpen(true)} className="btn-primary px-6 py-3 flex items-center justify-center gap-2 shrink-0">
                        <Plus size={20} />
                        Add Product
                    </button>
                </div>
            </div>

            {/* Products Table */}
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-soft overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Warehouse size={24} className="text-primary-600 dark:text-primary-400" />
                        Store Products ({filteredProducts.length})
                    </h2>
                </div>

                {loading && products.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">Loading store products...</p>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="p-12 text-center">
                        <Package size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                        <p className="text-gray-500 dark:text-gray-400">No store products found</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table - Bags Only */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
                                    <tr>
                                        <th className="p-4 text-left text-xs font-semibold">Product Name</th>
                                        <th className="p-4 text-left text-xs font-semibold">Category</th>
                                        <th className="p-4 text-right text-xs font-semibold">Stock (Bags)</th>
                                        <th className="p-4 text-center text-xs font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {filteredProducts.map((product, index) => {
                                        const bagsCount = product.quantity / (product.unitsPerBag || 1);
                                        return (
                                            <tr key={product._id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/50'}`}>
                                                <td className="p-4 font-medium text-gray-900 dark:text-white">{product.name}</td>
                                                <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{product.category || '-'}</td>
                                                <td className="p-4 text-right font-bold text-primary-600 dark:text-primary-400">{Math.floor(bagsCount)} Bags</td>
                                                <td className="p-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button onClick={() => openAdjustModal(product, 'add')} className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors" title="Add Bags">
                                                            <ArrowUpCircle size={20} />
                                                        </button>
                                                        <button onClick={() => openAdjustModal(product, 'deduct')} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="Deduct Bags">
                                                            <ArrowDownCircle size={20} />
                                                        </button>
                                                        <div className="w-[1px] h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>
                                                        <button onClick={() => handleEdit(product)} className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="Edit">
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button onClick={() => setDeleteModal({ isOpen: true, product })} className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="Delete">
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View - Bags Only */}
                        <div className="md:hidden">
                            {filteredProducts.map((product) => {
                                const bagsCount = product.quantity / (product.unitsPerBag || 1);
                                return (
                                    <div key={product._id} className="p-4 border-b border-gray-100 dark:border-gray-700 last:border-0">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-gray-900 dark:text-white">{product.name}</h3>
                                            <div className="flex gap-1">
                                                <button onClick={() => openAdjustModal(product, 'add')} className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg">
                                                    <ArrowUpCircle size={18} />
                                                </button>
                                                <button onClick={() => openAdjustModal(product, 'deduct')} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg">
                                                    <ArrowDownCircle size={18} />
                                                </button>
                                                <button onClick={() => handleEdit(product)} className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg">
                                                    <Edit2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <div className="text-gray-500 dark:text-gray-400">{product.category || 'General'}</div>
                                            <div className="text-right font-bold text-primary-600 dark:text-primary-400">{Math.floor(bagsCount)} Bags</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-up">
                        <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 rounded-t-2xl flex justify-between items-center">
                            <h3 className="text-xl font-bold">{editingId ? 'Edit' : 'Add'} Store Product</h3>
                            <button onClick={resetForm} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-lg flex items-center gap-2">
                                    <AlertTriangle size={20} />
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Product Name *</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Enter product name" required />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{editingId ? 'Quantity (Bags)' : 'Initial Quantity (Bags)'} *</label>
                                <div className="relative">
                                    <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white pr-16" placeholder="0" min="0" step="1" required />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">Bags</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Barcode</label>
                                <input type="text" name="barcode" value={formData.barcode} onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Enter barcode (optional)" />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Category</label>
                                <input type="text" name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="E.g., Electronics, Food (optional)" />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Notes</label>
                                <textarea name="notes" value={formData.notes} onChange={handleChange} rows="2" className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none" placeholder="Storage location or additional notes (optional)"></textarea>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={resetForm} className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-semibold">
                                    Cancel
                                </button>
                                <button type="submit" disabled={loading} className="flex-1 btn-primary px-6 py-3">
                                    {loading ? 'Saving...' : editingId ? 'Update' : 'Add'} Product
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Adjustment Modal */}
            {isAdjustModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
                        <div className={`p-6 rounded-t-2xl text-white flex justify-between items-center ${adjustData.type === 'add' ? 'bg-green-600' : 'bg-red-600'}`}>
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                {adjustData.type === 'add' ? <ArrowUpCircle /> : <ArrowDownCircle />}
                                {adjustData.type === 'add' ? 'Add Bags' : 'Deduct Bags'}
                            </h3>
                            <button onClick={resetAdjustForm} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleAdjustSubmit} className="p-6 space-y-4">
                            <p className="text-gray-600 dark:text-gray-400 font-medium">
                                Product: <span className="text-gray-900 dark:text-white font-bold">{adjustData.productName}</span>
                            </p>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Number of Bags</label>
                                <div className="relative">
                                    <input type="number" name="quantity" value={adjustData.quantity} onChange={handleAdjustChange} className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white pr-16" placeholder="0" min="1" step="1" required autoFocus />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">Bags</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Notes</label>
                                <textarea name="notes" value={adjustData.notes} onChange={handleAdjustChange} rows="2" className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none" placeholder="Reason for adjustment..."></textarea>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={resetAdjustForm} className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-semibold">
                                    Cancel
                                </button>
                                <button type="submit" disabled={loading} className={`flex-1 px-6 py-3 text-white rounded-xl font-bold transition-all shadow-lg ${adjustData.type === 'add' ? 'bg-green-600 hover:bg-green-700 shadow-green-500/30' : 'bg-red-600 hover:bg-red-700 shadow-red-500/30'}`}>
                                    {loading ? 'Processing...' : 'Confirm'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slide-up">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                                <AlertTriangle size={24} className="text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Store Product</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">This action cannot be undone</p>
                            </div>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 mb-6">
                            Are you sure you want to delete <span className="font-bold">{deleteModal.product?.name}</span>?
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteModal({ isOpen: false, product: null })} className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-semibold">
                                Cancel
                            </button>
                            <button onClick={handleDelete} className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx="true">{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slide-up {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-fade-in { animation: fade-in 0.3s ease-out; }
                .animate-slide-up { animation: slide-up 0.4s ease-out; }
            `}</style>
        </div>
    );
};

export default Store;
