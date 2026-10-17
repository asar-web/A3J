import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { UserPlus, X, MapPin, Phone, Mail } from 'lucide-react';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerAdded?: (customer: any) => void;
}

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  isOpen,
  onClose,
  onCustomerAdded,
}) => {
  const { addCustomer, setActiveLoyaltyCustomer, loyaltyConfig } = usePOS();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [tierId, setTierId] = useState(loyaltyConfig.tiers[0]?.id || 'tier_bronze');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    const newCust = addCustomer({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@customer.lk`,
      deliveryAddress: deliveryAddress.trim() || undefined,
      city: city.trim() || undefined,
      postalCode: postalCode.trim() || undefined,
      tierId,
      verifiedByAdmin: true,
      notes: notes.trim() || undefined,
    });
    setActiveLoyaltyCustomer(newCust);
    if (onCustomerAdded) {
      onCustomerAdded(newCust);
    }
    setName('');
    setPhone('');
    setEmail('');
    setDeliveryAddress('');
    setCity('');
    setPostalCode('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-neutral-800" />
            <div>
              <h3 className="text-base font-bold text-neutral-900">Add Customer Profile</h3>
              <p className="text-xs text-neutral-500">
                Enroll customer for checkout, invoicing &amp; Cash On Delivery (COD)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Customer Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Kasun Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Mobile Phone Number *</label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  placeholder="+94 77 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-neutral-300 rounded-lg font-mono"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                placeholder="customer@domain.lk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-neutral-300 rounded-lg"
              />
            </div>
          </div>

          <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2.5">
            <span className="font-semibold text-neutral-900 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-neutral-500" />
              Delivery &amp; Billing Address (for COD &amp; 80mm Receipt)
            </span>
            <input
              type="text"
              placeholder="Street address, building, suite..."
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-neutral-300 rounded-lg"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-neutral-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="Postal Code"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-neutral-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-neutral-600 hover:text-neutral-900 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold rounded-lg shadow-xs cursor-pointer"
            >
              Add Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
