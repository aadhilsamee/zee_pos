import React, { useState, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import { BarChart3, TrendingUp, Banknote, AlertCircle, Bell, Calendar, X } from 'lucide-react';
import { transactionAPI } from '../services/transactionAPI';
import { debtAPI } from '../services/debtAPI';
import { customerAPI } from '../services/customerAPI';
import Header from '../components/Header';
import RealTimeClock from '../components/RealTimeClock';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalSales: 0,
    totalPaid: 0,
    pendingDebts: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [debts, setDebts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [reportType, setReportType] = useState('week');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [txRes, debtRes, cusRes] = await Promise.all([
        transactionAPI.getAll(),
        debtAPI.getAll(),
        customerAPI.getAll(),
      ]);

      setTransactions(txRes.data);
      setDebts(debtRes.data);
      setCustomers(cusRes.data);

      // Calculate stats
      const totalTransactions = txRes.data.length;
      const totalSales = txRes.data
        .filter(tx => tx.type !== 'debt_payment')
        .reduce((sum, tx) => sum + tx.totalAmount, 0);
      const totalPaid = txRes.data.reduce((sum, tx) => sum + tx.paidAmount, 0);

      const customersWithDebt = new Set(debtRes.data
        .filter(d => d.remainingAmount > 0 && d.customerId) // Filter valid debts with existing customers
        .map(d => d.customerId._id)
      ).size;

      setStats({
        totalTransactions,
        totalSales,
        totalPaid,
        pendingDebts: customersWithDebt,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get due date status
  const getDueDateStatus = (dueDate) => {
    if (!dueDate) return null;

    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: 'overdue', label: 'Overdue', color: 'red', days: Math.abs(diffDays) };
    } else if (diffDays <= 3) {
      return { status: 'due-soon', label: 'Due Soon', color: 'yellow', days: diffDays };
    } else {
      return { status: 'on-track', label: 'On Track', color: 'green', days: diffDays };
    }
  };

  // Get debts with reminders (overdue or due soon)
  const reminderDebts = customers.map((customer) => {
    const customerDebts = debts.filter(
      (d) => d.customerId && d.customerId._id === customer._id && d.remainingAmount > 0
    );
    const totalRemaining = customerDebts.reduce((sum, d) => sum + d.remainingAmount, 0);

    const debtsWithDueDate = customerDebts.filter(d => d.dueDate);
    let earliestDueDate = null;
    let dueDateStatus = null;

    if (debtsWithDueDate.length > 0) {
      earliestDueDate = debtsWithDueDate.reduce((earliest, debt) => {
        return new Date(debt.dueDate) < new Date(earliest.dueDate) ? debt : earliest;
      }).dueDate;
      dueDateStatus = getDueDateStatus(earliestDueDate);
    }

    return {
      customer,
      totalRemaining,
      earliestDueDate,
      dueDateStatus,
    };
  })
    .filter((item) => item.totalRemaining > 0 && item.dueDateStatus &&
      (item.dueDateStatus.status === 'overdue' || item.dueDateStatus.status === 'due-soon'))
    .sort((a, b) => {
      if (a.dueDateStatus.status === 'overdue' && b.dueDateStatus.status !== 'overdue') return -1;
      if (a.dueDateStatus.status !== 'overdue' && b.dueDateStatus.status === 'overdue') return 1;
      return a.dueDateStatus.days - b.dueDateStatus.days;
    });

  const generateReport = () => {
    let startDate, endDate;
    const now = new Date();

    if (reportType === 'week') {
      const selected = new Date(selectedDate);
      startDate = new Date(selected);
      // Adjust to start of week if needed, or just 7 days from selected
      // Let's assume user picks a date and wants that week (Monday to Sunday)
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
      startDate.setDate(diff);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else if (reportType === 'month') {
      startDate = new Date(selectedYear, selectedMonth, 1);
      endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);
    } else if (reportType === 'year') {
      startDate = new Date(selectedYear, 0, 1);
      endDate = new Date(selectedYear, 11, 31, 23, 59, 59, 999);
    }

    const filteredTransactions = transactions.filter(
      (tx) => {
        const txDate = new Date(tx.createdAt);
        return txDate >= startDate && txDate <= endDate;
      }
    );

    const totalAmount = filteredTransactions
      .filter(tx => tx.type !== 'debt_payment')
      .reduce((sum, tx) => sum + tx.totalAmount, 0);
    const totalPaidAmount = filteredTransactions.reduce((sum, tx) => sum + tx.paidAmount, 0);
    const totalDebtAmount = filteredTransactions.reduce((sum, tx) => sum + tx.debtAmount, 0);

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #1e3a8a; margin: 0; font-size: 28px;">Sarfan Stores</h1>
          <p style="color: #666; font-size: 13px; margin: 5px 0;">KK Street, Puttalam</p>
          <p style="color: #666; font-size: 12px; margin: 2px 0;">Tel: +94752255989 / +94723806943</p>
        </div>
        <h2 style="text-align: center; color: #3b82f6;">${reportType.toUpperCase()} REPORT</h2>
        <p style="text-align: center; color: #666;">Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}</p>
        <hr style="border: 1px solid #ddd; margin: 20px 0;">

        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0;">
          <div style="background: #dbeafe; padding: 15px; border-radius: 8px; text-align: center;">
            <p style="color: #666; font-size: 12px;">Total Transactions</p>
            <p style="font-size: 24px; font-weight: bold; color: #1e40af;">${filteredTransactions.length}</p>
          </div>
          <div style="background: #dcfce7; padding: 15px; border-radius: 8px; text-align: center;">
            <p style="color: #666; font-size: 12px;">Total Sales</p>
            <p style="font-size: 24px; font-weight: bold; color: #15803d;">Rs ${totalAmount.toFixed(0)}</p>
          </div>
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; text-align: center;">
            <p style="color: #666; font-size: 12px;">Total Paid</p>
            <p style="font-size: 24px; font-weight: bold; color: #b45309;">Rs ${totalPaidAmount.toFixed(0)}</p>
          </div>
          <div style="background: #fee2e2; padding: 15px; border-radius: 8px; text-align: center;">
            <p style="color: #666; font-size: 12px;">Total Debt</p>
            <p style="font-size: 24px; font-weight: bold; color: #991b1b;">Rs ${totalDebtAmount.toFixed(0)}</p>
          </div>
        </div>

        <h3 style="color: #1e40af; margin-top: 30px; margin-bottom: 15px;">Transaction Details</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background: #1e40af; color: white;">
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Transaction ID</th>
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Date</th>
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Customer</th>
              <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Amount</th>
              <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Paid</th>
              <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Debt</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${filteredTransactions.map((tx, idx) => `
              <tr style="background: ${idx % 2 === 0 ? '#f9fafb' : 'white'}; border: 1px solid #ddd;">
                <td style="padding: 10px; border: 1px solid #ddd;">${tx.transactionId.substring(0, 12)}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${new Date(tx.createdAt).toLocaleDateString()}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${tx.customerId?.name || 'N/A'}</td>
                <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">Rs ${tx.totalAmount.toFixed(0)}</td>
                <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">Rs ${tx.paidAmount.toFixed(0)}</td>
                <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">Rs ${tx.debtAmount.toFixed(0)}</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">
                  <span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; 
                    background: ${tx.paymentStatus === 'paid' ? '#dcfce7' : tx.paymentStatus === 'partial' ? '#fef3c7' : '#fee2e2'};
                    color: ${tx.paymentStatus === 'paid' ? '#15803d' : tx.paymentStatus === 'partial' ? '#b45309' : '#991b1b'};">
                    ${tx.paymentStatus.toUpperCase()}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <hr style="border: 1px solid #ddd; margin: 20px 0;">
        <p style="text-align: center; color: #999; font-size: 12px;">Generated on: ${new Date().toLocaleString()}</p>
      </div>
    `;

    const element = document.createElement('div');
    element.innerHTML = htmlContent;

    const opt = {
      margin: 10,
      filename: `report_${reportType}_${new Date().getTime()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'landscape', unit: 'mm', format: 'a4' },
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Top Bar: Clock & Notifications */}
      <div className="flex flex-col sm:flex-row justify-end items-end sm:items-center gap-4 mb-4">
        <RealTimeClock />

        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-95"
            title="Debt Reminders"
          >
            <div className="relative">
              <Bell size={20} className={reminderDebts.length > 0 ? 'text-orange-600 dark:text-orange-400 animate-pulse' : 'text-gray-600 dark:text-gray-400'} />
              {reminderDebts.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center ring-1 ring-white dark:ring-gray-800">
                  {reminderDebts.length}
                </span>
              )}
            </div>
          </button>

          {/* Notification Popup */}
          {showNotifications && reminderDebts.length > 0 && (
            <div className="absolute top-12 right-0 z-50 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 animate-slide-up">
              <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="text-orange-600 dark:text-orange-400" size={16} />
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">Reminders</h3>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto p-2">
                {reminderDebts.map((item) => (
                  <div
                    key={item.customer._id}
                    className={`p-2 m-1 rounded-lg border ${item.dueDateStatus.status === 'overdue'
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                      : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex-1">
                        <div className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold mb-1 ${item.dueDateStatus.status === 'overdue'
                          ? 'bg-red-600 text-white'
                          : 'bg-yellow-600 text-white'
                          }`}>
                          {item.dueDateStatus.status === 'overdue'
                            ? `${item.dueDateStatus.days}d OVERDUE`
                            : `DUE IN ${item.dueDateStatus.days}d`
                          }
                        </div>
                        <p className="font-bold text-sm text-gray-900 dark:text-white">{item.customer.name}</p>
                        {item.earliestDueDate && (
                          <div className="flex items-center gap-1 mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                            <Calendar size={10} />
                            <span>{new Date(item.earliestDueDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-red-600 dark:text-red-400">
                          {item.totalRemaining.toFixed(0)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="relative">
        <Header title="Dashboard" subtitle="System Overview & Analytics" />
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-6">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 sm:p-5 rounded-xl shadow-lg shadow-blue-500/20 card-hover border border-blue-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs font-medium uppercase tracking-wider">Total Transactions</p>
                  <p className="text-xl sm:text-2xl font-bold text-white mt-1.5">{stats.totalTransactions}</p>
                </div>
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <BarChart3 className="text-white" size={24} />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-4 sm:p-5 rounded-xl shadow-lg shadow-emerald-500/20 card-hover border border-emerald-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-xs font-medium uppercase tracking-wider">Total Sales</p>
                  <p className="text-xl sm:text-2xl font-bold text-white mt-1.5">Rs. {stats.totalSales.toFixed(0)}</p>
                </div>
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Banknote className="text-white" size={24} />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4 sm:p-5 rounded-xl shadow-lg shadow-amber-500/20 card-hover border border-amber-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-xs font-medium uppercase tracking-wider">Total Paid</p>
                  <p className="text-xl sm:text-2xl font-bold text-white mt-1.5">Rs. {stats.totalPaid.toFixed(0)}</p>
                </div>
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <TrendingUp className="text-white" size={24} />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-rose-600 to-rose-700 p-4 sm:p-5 rounded-xl shadow-lg shadow-rose-500/20 card-hover border border-rose-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-rose-100 text-xs font-medium uppercase tracking-wider">Pending Debts</p>
                  <p className="text-xl sm:text-2xl font-bold text-white mt-1.5">{stats.pendingDebts}</p>
                </div>
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <AlertCircle className="text-white" size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Report Generation Section */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-soft border border-gray-100 dark:border-gray-700 mt-6 sm:mt-8">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-primary-600" />
              Generate Report
            </h3>
            <div className="flex flex-col sm:flex-row items-end gap-4 flex-wrap">
              <div className="w-full sm:w-auto">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full sm:w-32 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                >
                  <option value="week">Weekly</option>
                  <option value="month">Monthly</option>
                  <option value="year">Yearly</option>
                </select>
              </div>

              {reportType === 'week' && (
                <div className="w-full sm:w-auto">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Select Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    max={new Date().toISOString().split('T')[0]} // Restrict future dates
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full sm:w-auto px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}

              {reportType === 'month' && (
                <>
                  <div className="w-full sm:w-auto">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Month</label>
                    <select
                      value={selectedMonth}
                      onChange={e => setSelectedMonth(parseInt(e.target.value))}
                      className="w-full sm:w-32 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i} value={i}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full sm:w-auto">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
                    <select
                      value={selectedYear}
                      onChange={e => setSelectedYear(parseInt(e.target.value))}
                      className="w-full sm:w-24 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    >
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </>
              )}

              {reportType === 'year' && (
                <div className="w-full sm:w-auto">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
                  <select
                    value={selectedYear}
                    onChange={e => setSelectedYear(parseInt(e.target.value))}
                    className="w-full sm:w-24 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              )}

              <button
                onClick={generateReport}
                className="w-full sm:w-auto btn-primary flex items-center justify-center gap-2"
              >
                <Banknote size={18} />
                Generate Report
              </button>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="mt-6 sm:mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-soft overflow-hidden border border-gray-100 dark:border-gray-700">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Recent Transactions</h2>
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
                  <tr>
                    <th className="p-3 sm:p-4 text-left text-xs sm:text-sm font-semibold">Transaction ID</th>
                    <th className="p-3 sm:p-4 text-left text-xs sm:text-sm font-semibold">Customer</th>
                    <th className="p-3 sm:p-4 text-right text-xs sm:text-sm font-semibold">Amount</th>
                    <th className="p-3 sm:p-4 text-right text-xs sm:text-sm font-semibold">Paid</th>
                    <th className="p-3 sm:p-4 text-center text-xs sm:text-sm font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {transactions.slice(0, 10).map((tx, index) => (
                    <tr key={tx._id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/50'}`}>
                      <td className="p-3 sm:p-4 text-xs sm:text-sm font-mono text-gray-700 dark:text-gray-300">{tx.transactionId.substring(0, 12)}</td>
                      <td className="p-3 sm:p-4 text-xs sm:text-sm text-gray-900 dark:text-white font-medium">{tx.customerId?.name || 'Walk-in'}</td>
                      <td className="p-3 sm:p-4 text-right text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">Rs {tx.totalAmount.toFixed(0)}</td>
                      <td className="p-3 sm:p-4 text-right text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Rs {tx.paidAmount.toFixed(0)}</td>
                      <td className="p-3 sm:p-4 text-center">
                        <span className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs font-bold ${tx.paymentStatus === 'paid'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : tx.paymentStatus === 'partial'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                          {tx.paymentStatus.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-700">
              {transactions.slice(0, 10).map((tx) => (
                <div key={tx._id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Transaction ID</p>
                      <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
                        {tx.transactionId.substring(0, 12)}
                      </span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${tx.paymentStatus === 'paid'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : tx.paymentStatus === 'partial'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                      {tx.paymentStatus.toUpperCase()}
                    </span>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Customer</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{tx.customerId?.name || 'Walk-in Customer'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Amount</p>
                      <p className="text-base font-bold text-gray-900 dark:text-white">Rs {tx.totalAmount.toFixed(0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Paid Amount</p>
                      <p className="text-base font-bold text-green-600 dark:text-green-400">Rs {tx.paidAmount.toFixed(0)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
