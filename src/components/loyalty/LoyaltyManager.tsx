import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { LoyaltyProgramConfig } from '../../types/pos';
import {
  Gift,
  Award,
  Search,
  Plus,
  ShieldCheck,
  X,
} from 'lucide-react';

export const LoyaltyManager: React.FC = () => {
  const {
    customers,
    loyaltyConfig,
    updateLoyaltyConfig,
    addCustomer,
    verifyCustomer,
    formatMoney,
    currency,
  } = usePOS();

  const [search, setSearch] = useState('');
  const [selectedTierFilter, setSelectedTierFilter] = useState('all');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);

  // New Customer Form state
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const [tempConfig, setTempConfig] = useState<LoyaltyProgramConfig>(loyaltyConfig);

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchesTier = selectedTierFilter === 'all' || c.tierId === selectedTierFilter;
    return matchesSearch && matchesTier;
  });

  const totalPointsInCirculation = customers.reduce((sum, c) => sum + c.loyaltyPoints, 0);
  const totalMemberSpend = customers.reduce((sum, c) => sum + c.lifetimeSpend, 0);

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;
    addCustomer({
      name: newName.trim(),
      phone: newPhone.trim(),
      email: newEmail.trim() || `${newName.toLowerCase().replace(' ', '.')}@domain.lk`,
      tierId: 'tier_bronze',
      notes: newNotes.trim() || undefined,
    });
    setNewName('');
    setNewPhone('');
    setNewEmail('');
    setNewNotes('');
    setIsAddCustomerOpen(false);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateLoyaltyConfig(tempConfig);
    setIsConfigOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Customer Loyalty CRM</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Configurable loyalty tiers, points multiplier rules, and member directory ({currency.code}).
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setTempConfig(loyaltyConfig);
              setIsConfigOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 rounded-xl hover:bg-neutral-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Award className="w-3.5 h-3.5" />
            <span>Configure Rules &amp; Tiers</span>
          </button>
          <button
            onClick={() => setIsAddCustomerOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-neutral-900 rounded-xl hover:bg-neutral-800 transition-colors shadow-xs active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Enroll New Member</span>
          </button>
        </div>
      </div>

      {/* Program Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
          <p className="text-xs text-neutral-500 font-semibold">Active Loyalty Members</p>
          <p className="text-2xl font-bold font-mono text-neutral-900 mt-1 tabular-nums">
            {customers.length}
          </p>
          <p className="text-[11px] text-emerald-700 mt-1">Confirmed customer accounts</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
          <p className="text-xs text-neutral-500 font-semibold">Points in Circulation</p>
          <p className="text-2xl font-bold font-mono text-neutral-900 mt-1 tabular-nums">
            {totalPointsInCirculation.toLocaleString()}
          </p>
          <p className="text-[11px] text-neutral-400 mt-1">
            {formatMoney(totalPointsInCirculation * loyaltyConfig.redemptionRate)} voucher credit value
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
          <p className="text-xs text-neutral-500 font-semibold">Member Lifetime Spend</p>
          <p className="text-2xl font-bold font-mono text-neutral-900 mt-1 tabular-nums">
            {formatMoney(totalMemberSpend)}
          </p>
          <p className="text-[11px] text-neutral-400 mt-1">Cumulative sales in {currency.code}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
          <p className="text-xs text-neutral-500 font-semibold">Points Accrual Velocity</p>
          <p className="text-2xl font-bold font-mono text-neutral-900 mt-1 tabular-nums">
            {loyaltyConfig.pointsPerDollar} pts / Unit
          </p>
          <p className="text-[11px] text-neutral-400 mt-1">Base earning rule</p>
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-neutral-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-neutral-50">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search member by name, phone or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-neutral-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedTierFilter}
              onChange={(e) => setSelectedTierFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-white border border-neutral-300 rounded-xl text-neutral-700 focus:outline-none font-semibold cursor-pointer"
            >
              <option value="all">All Tiers</option>
              {loyaltyConfig.tiers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Member Name</th>
                <th className="py-3 px-4">Phone &amp; Email</th>
                <th className="py-3 px-4">Delivery Address (COD)</th>
                <th className="py-3 px-4">Tier</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Points Balance</th>
                <th className="py-3 px-4 text-right">Lifetime Spend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredCustomers.map((cust) => {
                const tier = loyaltyConfig.tiers.find((t) => t.id === cust.tierId);
                return (
                  <tr key={cust.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-neutral-900">{cust.name}</p>
                      {cust.businessName && (
                        <p className="text-[11px] text-neutral-500">{cust.businessName}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-neutral-600 font-mono text-[11px]">
                      <div>{cust.phone}</div>
                      <div className="text-neutral-400">{cust.email}</div>
                    </td>
                    <td className="py-3 px-4 text-neutral-600 text-[11px]">
                      {cust.deliveryAddress ? (
                        <span>
                          {cust.deliveryAddress}, {cust.city || ''}
                        </span>
                      ) : (
                        <span className="text-neutral-400 italic">None on file</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-neutral-800">
                      {tier ? tier.name : 'Bronze'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        cust.adminConfirmed
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {cust.adminConfirmed ? 'Confirmed' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-right text-emerald-800 tabular-nums">
                      {cust.loyaltyPoints.toLocaleString()} pts
                    </td>
                    <td className="py-3 px-4 font-mono text-right text-neutral-900 tabular-nums font-bold">
                      {formatMoney(cust.lifetimeSpend)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Program Config Modal */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-5 py-3.5 border-b border-neutral-200 bg-neutral-50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-neutral-900">Customizable Loyalty Program Rules</h3>
              <button
                type="button"
                onClick={() => setIsConfigOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveConfig} className="p-5 space-y-4 text-xs overflow-y-auto">
              <div className="flex items-center justify-between p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl">
                <div>
                  <p className="font-bold text-neutral-900">Enable Customer Loyalty Program</p>
                  <p className="text-[11px] text-neutral-500">
                    Earn points on retail checkouts and redeem as monetary vouchers.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={tempConfig.enabled}
                  onChange={(e) => setTempConfig({ ...tempConfig, enabled: e.target.checked })}
                  className="w-4 h-4 text-neutral-900 rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Points Earned per Unit Spent
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={tempConfig.pointsPerDollar}
                    onChange={(e) =>
                      setTempConfig({ ...tempConfig, pointsPerDollar: parseInt(e.target.value) || 1 })
                    }
                    className="w-full px-3 py-2 font-mono font-bold border border-neutral-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Redemption Rate ({currency.code} per point)
                  </label>
                  <input
                    type="number"
                    step="0.005"
                    min="0.01"
                    value={tempConfig.redemptionRate}
                    onChange={(e) =>
                      setTempConfig({ ...tempConfig, redemptionRate: parseFloat(e.target.value) || 0.05 })
                    }
                    className="w-full px-3 py-2 font-mono font-bold border border-neutral-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsConfigOpen(false)}
                  className="px-3 py-1.5 text-xs text-neutral-600 hover:text-neutral-900 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 shadow-xs cursor-pointer"
                >
                  Save Rules
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enroll Member Modal */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-neutral-200 bg-neutral-50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-neutral-900">Enroll Loyalty Member</h3>
              <button
                type="button"
                onClick={() => setIsAddCustomerOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateCustomer} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kasun Silva"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="+94 77 123 4567"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="customer@domain.lk"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="px-3 py-1.5 text-xs text-neutral-600 hover:text-neutral-900 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 shadow-xs cursor-pointer"
                >
                  Enroll Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
