import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Download,
  MessageCircle,
  FileText,
  Trash2,
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { SubscriptionStatus, Subscription, Product } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatCurrency, formatDateDisplay, getDaysRemaining } from '../lib/dateUtils';
import { SubscriptionFormModal } from '../components/subscriptions/SubscriptionFormModal';
import { RenewSubscriptionModal } from '../components/subscriptions/RenewSubscriptionModal';
import { PaymentFormModal } from '../components/payments/PaymentFormModal';
import { InvoiceModal } from '../components/payments/InvoiceModal';
import { EmptyState } from '../components/common/EmptyState';

export const SubscriptionsPage: React.FC = () => {
  const { subscriptions, products, sendReminder, deleteSubscription } = useData();
  const navigate = useNavigate();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | SubscriptionStatus>('ALL');
  const [productFilter, setProductFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'END_DATE_ASC' | 'END_DATE_DESC' | 'AMOUNT_DESC'>('END_DATE_ASC');

  // Modals state
  const [isNewSubOpen, setIsNewSubOpen] = useState(false);
  const [renewSub, setRenewSub] = useState<Subscription | null>(null);
  const [paymentSub, setPaymentSub] = useState<Subscription | null>(null);
  const [invoiceSub, setInvoiceSub] = useState<Subscription | null>(null);

  // Summary Metrics
  const activeCount = subscriptions.filter((s: Subscription) => s.status === 'ACTIVE').length;
  const expiringSoonCount = subscriptions.filter((s: Subscription) => s.status === 'EXPIRING_SOON').length;
  const expiredCount = subscriptions.filter((s: Subscription) => s.status === 'EXPIRED').length;
  const activeARR = subscriptions
    .filter((s: Subscription) => s.status === 'ACTIVE' || s.status === 'EXPIRING_SOON')
    .reduce((sum: number, s: Subscription) => sum + s.amount, 0);

  // Filtered & Sorted Subscriptions
  const filteredSubscriptions = useMemo(() => {
    return subscriptions
      .filter((s: Subscription) => {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          !q ||
          (s.client?.business_name && s.client.business_name.toLowerCase().includes(q)) ||
          (s.product?.name && s.product.name.toLowerCase().includes(q)) ||
          (s.plan?.name && s.plan.name.toLowerCase().includes(q));

        const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
        const matchesProduct = productFilter === 'ALL' || s.product_id === productFilter;

        return matchesQuery && matchesStatus && matchesProduct;
      })
      .sort((a: Subscription, b: Subscription) => {
        if (sortBy === 'END_DATE_ASC') return a.end_date.localeCompare(b.end_date);
        if (sortBy === 'END_DATE_DESC') return b.end_date.localeCompare(a.end_date);
        if (sortBy === 'AMOUNT_DESC') return b.amount - a.amount;
        return 0;
      });
  }, [subscriptions, searchQuery, statusFilter, productFilter, sortBy]);

  // CSV Export handler
  const handleExportCSV = () => {
    const headers = [
      'Client Name',
      'Product',
      'Plan',
      'Start Date',
      'End Date',
      'Amount (INR)',
      'Outstanding Balance (INR)',
      'Status',
    ];
    const rows = filteredSubscriptions.map((s: Subscription) => [
      `"${s.client?.business_name || ''}"`,
      `"${s.product?.name || ''}"`,
      `"${s.plan?.name || ''}"`,
      s.start_date,
      s.end_date,
      s.amount,
      s.outstanding_balance || 0,
      s.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r: (string | number)[]) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `WebRajya_Subscriptions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSendReminder = async (sub: Subscription) => {
    if (!sub.client?.phone) {
      alert(`Client ${sub.client?.business_name} has no phone number on record.`);
      return;
    }
    const cleanPhone = sub.client.phone.replace(/\D/g, '');
    const message = `Hello ${sub.client.business_name}, this is a reminder from WebRajya Solutions that your subscription for ${sub.product?.name} (${sub.plan?.name || 'Annual'}) expires on ${formatDateDisplay(sub.end_date)}. Please renew to avoid interruption.`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
    await sendReminder(sub.id, 'WHATSAPP', 'OPENED');
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#171A21]">
            Subscriptions & Licenses
          </h1>
          <p className="text-xs text-[#687080] mt-0.5">
            Monitor active software licenses, term dates, and renewal status
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleExportCSV}
            className="btn-secondary px-3.5 py-2 text-xs inline-flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-[#687080]" />
            <span>Export CSV</span>
          </button>
          <button
            id="btn-new-subscription"
            onClick={() => setIsNewSubOpen(true)}
            className="btn-primary px-4 py-2 text-xs inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Subscription</span>
          </button>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="surface-card p-4">
          <span className="text-xs font-semibold text-[#687080] block uppercase tracking-wider">Active Subscriptions</span>
          <span className="text-2xl font-bold text-[#171A21] mt-1 block">{activeCount}</span>
        </div>
        <div className="surface-card p-4">
          <span className="text-xs font-semibold text-[#687080] block uppercase tracking-wider">Expiring (30 Days)</span>
          <span className="text-2xl font-bold text-[#D99000] mt-1 block">{expiringSoonCount}</span>
        </div>
        <div className="surface-card p-4">
          <span className="text-xs font-semibold text-[#687080] block uppercase tracking-wider">Expired Licenses</span>
          <span className="text-2xl font-bold text-[#D94B63] mt-1 block">{expiredCount}</span>
        </div>
        <div className="surface-card p-4">
          <span className="text-xs font-semibold text-[#687080] block uppercase tracking-wider">Contract Value</span>
          <span className="text-2xl font-bold text-[#171A21] font-mono mt-1 block">
            {formatCurrency(activeARR)}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="surface-card p-4 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#9299A7] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client name, product, or plan..."
            className="w-full pl-10 pr-4 py-2 text-xs input-search"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-[#687080]">
            <Filter className="w-3.5 h-3.5" />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | SubscriptionStatus)}
            className="text-xs input-search bg-white px-3 py-2 font-medium"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRING_SOON">Expiring Soon</option>
            <option value="EXPIRED">Expired</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="text-xs input-search bg-white px-3 py-2 font-medium"
          >
            <option value="ALL">All Products</option>
            {products.map((p: Product) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs input-search bg-white px-3 py-2 font-medium"
          >
            <option value="END_DATE_ASC">Nearest Expiry</option>
            <option value="END_DATE_DESC">Latest Expiry</option>
            <option value="AMOUNT_DESC">Highest Amount</option>
          </select>
        </div>
      </div>

      {/* Subscriptions Table */}
      {filteredSubscriptions.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No subscriptions found"
          description="No subscriptions match your current filter parameters."
          actionLabel="Create Subscription"
          onAction={() => setIsNewSubOpen(true)}
        />
      ) : (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F8FA] border-b border-[#E7E9EE] text-[#687080] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Client</th>
                  <th className="p-3.5">Product / Plan</th>
                  <th className="p-3.5">Start Date</th>
                  <th className="p-3.5">End Date</th>
                  <th className="p-3.5">Time Remaining</th>
                  <th className="p-3.5">Contract Value</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E9EE]">
                {filteredSubscriptions.map((sub: Subscription) => {
                  const days = getDaysRemaining(sub.end_date);
                  return (
                    <tr key={sub.id} className="hover:bg-[#F7F8FA] transition-colors">
                      <td className="p-3.5">
                        <button
                          onClick={() => navigate(`/clients/${sub.client_id}`)}
                          className="font-semibold text-[#171A21] hover:text-[#5B5CE2] text-left block truncate max-w-xs transition-colors"
                        >
                          {sub.client?.business_name}
                        </button>
                        <span className="text-[11px] text-[#9AA2B1]">
                          {sub.client?.owner_name} • {sub.client?.city}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <p className="font-semibold text-[#171A21]">{sub.product?.name}</p>
                        <p className="text-[11px] text-[#687080]">
                          {sub.plan?.name || `${sub.plan?.duration_months || 12} mo term`}
                        </p>
                      </td>

                      <td className="p-3.5 text-[#687080] font-medium">
                        {formatDateDisplay(sub.start_date)}
                      </td>

                      <td className="p-3.5 font-semibold text-[#171A21]">
                        {formatDateDisplay(sub.end_date)}
                      </td>

                      <td className="p-3.5">
                        {sub.status === 'EXPIRED' ? (
                          <span className="text-[#D94B63] font-semibold">
                            Expired {Math.abs(days)}d ago
                          </span>
                        ) : sub.status === 'EXPIRING_SOON' ? (
                          <span className="text-[#D99000] font-semibold bg-[#FFF6DF] px-2 py-0.5 rounded border border-[#D99000]/20">
                            Expires in {days}d
                          </span>
                        ) : sub.status === 'ACTIVE' ? (
                          <span className="text-[#687080] font-medium">{days} days</span>
                        ) : (
                          <span className="text-[#9AA2B1]">Cancelled</span>
                        )}
                      </td>

                      <td className="p-3.5 font-mono">
                        <div className="font-semibold text-[#171A21]">
                          {formatCurrency(sub.amount)}
                        </div>
                        {(sub.outstanding_balance || 0) > 0 ? (
                          <div className="text-[11px] text-[#D94B63] font-semibold">
                            Due: {formatCurrency(sub.outstanding_balance!)}
                          </div>
                        ) : (
                          <div className="text-[11px] text-[#18A86B] font-medium">Fully Paid</div>
                        )}
                      </td>

                      <td className="p-3.5">
                        <StatusBadge status={sub.status} size="sm" />
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setInvoiceSub(sub)}
                            title="Generate & Download Tax Invoice PDF"
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleSendReminder(sub)}
                            title="Send WhatsApp Expiry Reminder"
                            className="p-1.5 text-[#18A86B] hover:bg-[#EAF8F2] rounded-lg transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                          {(sub.outstanding_balance || 0) > 0 && (
                            <button
                              onClick={() => setPaymentSub(sub)}
                              title="Record Balance Payment"
                              className="btn-primary px-2.5 py-1 text-xs"
                            >
                              Collect
                            </button>
                          )}
                          <button
                            onClick={() => setRenewSub(sub)}
                            className="btn-secondary px-2.5 py-1 text-xs"
                          >
                            Renew
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to permanently delete this subscription record for ${sub.client?.business_name || 'this client'}?`)) {
                                deleteSubscription(sub.id);
                              }
                            }}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Subscription Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <SubscriptionFormModal isOpen={isNewSubOpen} onClose={() => setIsNewSubOpen(false)} />
      <RenewSubscriptionModal
        isOpen={Boolean(renewSub)}
        onClose={() => setRenewSub(null)}
        subscription={renewSub}
      />
      <PaymentFormModal
        isOpen={Boolean(paymentSub)}
        onClose={() => setPaymentSub(null)}
        preselectedClientId={paymentSub?.client_id}
        preselectedSubscriptionId={paymentSub?.id}
      />
      <InvoiceModal
        isOpen={Boolean(invoiceSub)}
        onClose={() => setInvoiceSub(null)}
        subscription={invoiceSub}
      />
    </div>
  );
};
