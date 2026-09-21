import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Download, MessageCircle, FileText } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { Proposal, ProposalItem } from '../../types';
import { formatCurrency, getTodayISO } from '../../lib/dateUtils';
import html2pdf from 'html2pdf.js';

interface ProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposalToEdit?: Proposal | null;
}

export const ProposalModal: React.FC<ProposalModalProps> = ({ isOpen, onClose, proposalToEdit }) => {
  const { clients, addProposal, updateProposal, settings } = useData();

  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [title, setTitle] = useState('Official Software Quotation & Cost Estimate');
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().slice(0, 10);
  });
  const [items, setItems] = useState<ProposalItem[]>([
    { id: '1', description: 'WebRajya Software License (12 Months)', quantity: 1, unit_price: 12000, total: 12000 },
    { id: '2', description: 'Initial Setup & Training Package', quantity: 1, unit_price: 3000, total: 3000 },
  ]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [includeGst, setIncludeGst] = useState(true);
  const [notes, setNotes] = useState('Payment Terms: 50% advance upon quotation acceptance, 50% upon deployment.\nBank UPI / NEFT: webrajya@upi / ICICI Bank 000105001234');

  useEffect(() => {
    if (proposalToEdit) {
      setSelectedClientId(proposalToEdit.client_id || '');
      setClientName(proposalToEdit.client_name);
      setClientEmail(proposalToEdit.client_email || '');
      setClientPhone(proposalToEdit.client_phone || '');
      setTitle(proposalToEdit.title || 'Official Software Quotation & Cost Estimate');
      setValidUntil(proposalToEdit.valid_until);
      setItems(proposalToEdit.items || []);
      setNotes(proposalToEdit.notes || '');
    } else {
      setSelectedClientId('');
      setClientName('');
      setClientEmail('');
      setClientPhone('');
      setTitle('Official Software Quotation & Cost Estimate');
      setDiscountAmount(0);
      setItems([
        { id: '1', description: 'WebRajya Software License (12 Months)', quantity: 1, unit_price: 12000, total: 12000 },
        { id: '2', description: 'Initial Setup & Training Package', quantity: 1, unit_price: 3000, total: 3000 },
      ]);
    }
  }, [proposalToEdit, isOpen]);

  if (!isOpen) return null;

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setClientName(client.business_name);
      setClientEmail(client.email || '');
      setClientPhone(client.phone || '');
    }
  };

  const handleItemChange = (id: string, field: keyof ProposalItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unit_price') {
            const qty = field === 'quantity' ? Number(value) : item.quantity;
            const price = field === 'unit_price' ? Number(value) : item.unit_price;
            updated.total = qty * price;
          }
          return updated;
        }
        return item;
      })
    );
  };

  const handleAddItem = () => {
    const newItem: ProposalItem = {
      id: Math.random().toString(36).substring(2, 9),
      description: 'Custom Service Module',
      quantity: 1,
      unit_price: 2000,
      total: 2000,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const rawSubtotal = items.reduce((sum, item) => sum + item.total, 0);
  const subtotal = Math.max(0, rawSubtotal - (discountAmount || 0));
  const taxAmount = includeGst ? Math.round(subtotal * 0.18) : 0;
  const totalAmount = subtotal + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      alert('Please enter or select a Client Name.');
      return;
    }

    if (proposalToEdit) {
      await updateProposal(proposalToEdit.id, {
        client_id: selectedClientId || null,
        client_name: clientName,
        client_email: clientEmail || null,
        client_phone: clientPhone || null,
        title,
        valid_until: validUntil,
        items,
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        notes,
      });
    } else {
      await addProposal({
        client_id: selectedClientId || null,
        client_name: clientName,
        client_email: clientEmail || null,
        client_phone: clientPhone || null,
        title,
        valid_until: validUntil,
        items,
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        status: 'DRAFT',
        notes,
      });
    }
    onClose();
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('proposal-pdf-preview');
    if (!element) return;
    try {
      const opt = {
        margin: 10,
        filename: `Proposal_${clientName.replace(/\s+/g, '_') || 'Quotation'}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
      };
      await html2pdf().set(opt).from(element).save();
    } catch (e) {
      console.warn('PDF Export fallback:', e);
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-[999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-200 my-8">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              {proposalToEdit ? 'Edit Software Quotation & Proposal' : 'Create New Software Quotation'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Client & Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Select Existing Client</label>
              <select
                value={selectedClientId}
                onChange={(e) => handleClientSelect(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium bg-white"
              >
                <option value="">-- New / Custom Lead --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.business_name} ({c.owner_name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Client / Company Name *</label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Acme Enterprises"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Valid Until Date</label>
              <input
                type="date"
                required
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Contact Phone</label>
              <input
                type="text"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Contact Email</label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="billing@client.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Proposal Subject</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium"
              />
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Scope of Work & Line Items</h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                <Plus className="w-3.5 h-3.5" /> Add Module Item
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <tr>
                    <th className="p-3">Description / Module Name</th>
                    <th className="p-3 w-20">Qty</th>
                    <th className="p-3 w-32">Unit Price (₹)</th>
                    <th className="p-3 w-32 text-right">Total (₹)</th>
                    <th className="p-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs font-mono"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(item.id, 'unit_price', e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs font-mono"
                        />
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(item.total)}
                      </td>
                      <td className="p-2 text-center">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="space-y-3 max-w-sm w-full">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeGst}
                  onChange={(e) => setIncludeGst(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                Apply 18% GST Tax Breakdown
              </label>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Special Discount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs font-mono bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Payment Terms & Bank Details
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Payment terms, bank details..."
                  rows={2}
                  className="w-full p-2 text-xs border border-slate-200 rounded bg-white"
                />
              </div>
            </div>

            <div className="space-y-1 text-xs text-right font-mono w-full sm:w-64">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500 font-sans">Gross Total:</span>
                <span className="font-bold text-slate-800">{formatCurrency(rawSubtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-200 text-emerald-600">
                  <span className="font-sans">Discount:</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500 font-sans">Net Subtotal:</span>
                <span className="font-bold text-slate-800">{formatCurrency(subtotal)}</span>
              </div>
              {includeGst && (
                <div className="flex justify-between py-1 border-b border-slate-200 text-slate-600">
                  <span className="font-sans">GST (18%):</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 text-sm font-bold text-indigo-700">
                <span className="font-sans">Grand Total:</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* PDF Visual Template (Off-screen render target) */}
          <div className="fixed -left-[9999px] top-0 w-[800px] pointer-events-none opacity-0">
            <div id="proposal-pdf-preview" className="p-8 bg-white font-sans text-slate-900 space-y-6">
              <div className="flex justify-between border-b-2 border-indigo-600 pb-4">
                <div>
                  <h1 className="text-2xl font-bold text-indigo-700">{settings.business_name}</h1>
                  <p className="text-xs text-slate-500">{settings.address}</p>
                  <p className="text-xs text-slate-500">Phone: {settings.phone} | GSTIN: {settings.gstin}</p>
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-bold uppercase tracking-wide text-slate-800">OFFICIAL QUOTATION</h2>
                  <p className="text-xs font-mono">Date: {getTodayISO()}</p>
                  <p className="text-xs font-mono">Valid Until: {validUntil}</p>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">QUOTATION PREPARED FOR</h3>
                <p className="text-base font-bold text-slate-900">{clientName}</p>
                {clientPhone && <p className="text-xs text-slate-600">Phone: {clientPhone}</p>}
                {clientEmail && <p className="text-xs text-slate-600">Email: {clientEmail}</p>}
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold">
                    <tr>
                      <th className="p-2.5">Item Description / Software Module</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Price</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td className="p-2.5 font-medium">{item.description}</td>
                        <td className="p-2.5 text-center font-mono">{item.quantity}</td>
                        <td className="p-2.5 text-right font-mono">{formatCurrency(item.unit_price)}</td>
                        <td className="p-2.5 text-right font-mono font-bold">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-start pt-4 border-t border-slate-200">
                <div className="max-w-xs text-xs text-slate-500 space-y-1">
                  <p className="font-bold text-slate-700">Payment Terms & Bank Details:</p>
                  <p className="whitespace-pre-line">{notes}</p>
                </div>
                <div className="w-64 space-y-1.5 text-xs font-mono text-right">
                  <div className="flex justify-between">
                    <span>Gross Total:</span>
                    <span>{formatCurrency(rawSubtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount:</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {includeGst && (
                    <div className="flex justify-between text-slate-600">
                      <span>GST (18%):</span>
                      <span>{formatCurrency(taxAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-indigo-700 border-t pt-1">
                    <span>Grand Total:</span>
                    <span>{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Download Vector PDF
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Save Proposal
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
