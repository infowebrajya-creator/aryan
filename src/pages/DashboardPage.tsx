import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Plus,
  Receipt,
  ArrowUpRight,
  MessageCircle,
  FileText,
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { formatCurrency, formatDateDisplay, getDaysRemaining } from '../lib/dateUtils';
import { SubscriptionFormModal } from '../components/subscriptions/SubscriptionFormModal';
import { ClientFormModal } from '../components/clients/ClientFormModal';
import { PaymentFormModal } from '../components/payments/PaymentFormModal';
import { RenewSubscriptionModal } from '../components/subscriptions/RenewSubscriptionModal';
import { ReceiptModal } from '../components/payments/ReceiptModal';
import { ProposalModal } from '../components/proposals/ProposalModal';
import { Subscription, Payment, Client } from '../types';

export const DashboardPage: React.FC = () => {
  const { clients, subscriptions, payments, sendReminder } = useData();
  const navigate = useNavigate();

  // Modals state
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);
  const [isNewSubOpen, setIsNewSubOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isProposalOpen, setIsProposalOpen] = useState(false);
  const [renewSub, setRenewSub] = useState<Subscription | null>(null);
  const [viewPayment, setViewPayment] = useState<Payment | null>(null);

  // Metric calculations
  const totalClients = clients.length;
  const activeClients = clients.filter((c: Client) => c.status === 'ACTIVE').length;

  const activeSubscriptions = subscriptions.filter((s: Subscription) => s.status === 'ACTIVE').length;
  const expiringSoonSubscriptions = subscriptions.filter((s: Subscription) => s.status === 'EXPIRING_SOON');

  // Revenue metrics
  const currentMonthYear = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const monthlyRevenue = payments
    .filter((p: Payment) => p.payment_date.startsWith(currentMonthYear))
    .reduce((acc: number, p: Payment) => acc + p.amount, 0);

  // Outstanding subscription balances
  const subscriptionsWithOutstanding = subscriptions.filter(
    (s: Subscription) => (s.outstanding_balance || 0) > 0
  );
  const totalOutstanding = subscriptionsWithOutstanding.reduce(
    (acc: number, s: Subscription) => acc + (s.outstanding_balance || 0),
    0
  );

  // Quick WhatsApp reminder
  const handleSendReminder = async (sub: Subscription) => {
    if (!sub.client?.phone) {
      alert(`Client ${sub.client?.business_name} does not have a phone number on record.`);
      return;
    }
    const cleanPhone = sub.client.phone.replace(/\D/g, '');
    const message = `Hello ${sub.client.business_name}, this is a reminder from WebRajya Solutions that your subscription for ${sub.product?.name} (${sub.plan?.name || 'Annual'}) expires on ${formatDateDisplay(sub.end_date)}. Please renew to ensure uninterrupted service.`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
    await sendReminder(sub.id, 'WHATSAPP');
  };

  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-8 pb-8">
      {/* Greeting Header & Primary Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#5B5CE2] tracking-wider uppercase">
            WEBRAJYA
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#171A21] mt-0.5 tracking-tight">
            Good evening
          </h1>
          <p className="text-xs text-[#687080] mt-0.5">{currentDateFormatted}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsProposalOpen(true)}
            className="btn-secondary px-3.5 py-2 text-xs inline-flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>+ Create Quotation</span>
          </button>
          <button
            id="dash-add-client-btn"
            onClick={() => setIsNewClientOpen(true)}
            className="btn-secondary px-3.5 py-2 text-xs"
          >
            + New Client
          </button>
          <button
            id="dash-record-payment-btn"
            onClick={() => setIsPaymentOpen(true)}
            className="btn-secondary px-3.5 py-2 text-xs"
          >
            Record Payment
          </button>
          <button
            id="dash-new-subscription-btn"
            onClick={() => setIsNewSubOpen(true)}
            className="btn-primary px-4 py-2 text-xs"
          >
            + New Subscription
          </button>
        </div>
      </div>

      {/* Featured Revenue Hero Block */}
      <div className="surface-card p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#687080] uppercase tracking-wider">
            Current Month Revenue
          </span>
          <span className="text-xs font-semibold text-[#5B5CE2] bg-[#EEF0FF] px-2.5 py-1 rounded-full border border-[#5B5CE2]/15">
            Realized Collections
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-3">
          <span className="text-4xl sm:text-5xl font-extrabold text-[#171A21] tracking-tight">
            {formatCurrency(monthlyRevenue)}
          </span>
        </div>
      </div>

      {/* Financial Summary Strip */}
      <div className="surface-card p-6">
        <h2 className="text-xs font-bold text-[#171A21] uppercase tracking-wider mb-4">
          Financial Summary
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-[#E7E9EE]">
          <div className="pt-2 sm:pt-0">
            <span className="text-xs text-[#687080] block">Active Clients</span>
            <span className="text-2xl font-bold text-[#171A21] mt-1 block">
              {activeClients}
            </span>
          </div>
          <div className="pt-4 sm:pt-0 sm:pl-6">
            <span className="text-xs text-[#687080] block">Active Licenses</span>
            <span className="text-2xl font-bold text-[#171A21] mt-1 block">
              {activeSubscriptions}
            </span>
          </div>
          <div className="pt-4 sm:pt-0 sm:pl-6">
            <span className="text-xs text-[#687080] block">Outstanding Dues</span>
            <span className="text-2xl font-bold text-[#D94B63] mt-1 block">
              {formatCurrency(totalOutstanding)}
            </span>
          </div>
        </div>
      </div>

      {/* Upcoming Renewals Section */}
      <div className="surface-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold text-[#171A21] uppercase tracking-wider">
            Upcoming Renewals
          </h2>
          <button
            onClick={() => navigate('/subscriptions')}
            className="btn-tertiary text-xs"
          >
            View All ({expiringSoonSubscriptions.length})
          </button>
        </div>

        <div className="divide-y divide-[#E7E9EE]">
          {expiringSoonSubscriptions.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#9AA2B1]">
              No subscriptions expiring in the next 30 days.
            </div>
          ) : (
            expiringSoonSubscriptions.map((sub: Subscription) => {
              const days = getDaysRemaining(sub.end_date);
              return (
                <div
                  key={sub.id}
                  className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#171A21] truncate">
                      {sub.client?.business_name}
                    </p>
                    <p className="text-xs text-[#687080] mt-0.5">
                      {sub.product?.name} • {days === 0 ? 'Expires today' : `${days} days remaining`}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-sm font-semibold text-[#171A21] font-mono">
                      {formatCurrency(sub.amount)}
                    </span>
                    <button
                      onClick={() => handleSendReminder(sub)}
                      className="p-2 text-[#18A86B] hover:bg-[#EAF8F2] rounded-lg transition-colors"
                      title="Send WhatsApp Reminder"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setRenewSub(sub)}
                      className="btn-secondary px-3 py-1.5 text-xs"
                    >
                      Renew
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Recent Payment Receipts */}
      <div className="surface-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold text-[#171A21] uppercase tracking-wider">
            Recent Payment Receipts
          </h2>
          <button
            onClick={() => navigate('/payments')}
            className="btn-tertiary text-xs"
          >
            View All ({payments.length})
          </button>
        </div>

        <div className="divide-y divide-[#E7E9EE]">
          {payments.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#9AA2B1]">
              No payment receipts recorded yet.
            </div>
          ) : (
            payments.slice(0, 4).map((pay: Payment) => (
            <div
              key={pay.id}
              className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#171A21]">
                    {pay.receipt_number}
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#F7F8FA] text-[#687080] border border-[#E7E9EE]">
                    {pay.payment_method}
                  </span>
                </div>
                <p className="text-xs text-[#687080] truncate mt-0.5">
                  {pay.client?.business_name} • {formatDateDisplay(pay.payment_date)}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-semibold text-[#18A86B] font-mono">
                  {formatCurrency(pay.amount)}
                </span>
                <button
                  onClick={() => setViewPayment(pay)}
                  className="p-1.5 text-[#687080] hover:text-[#5B5CE2] hover:bg-[#EEF0FF] rounded-lg transition-colors"
                  title="View Receipt"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
          )}
        </div>
      </div>

      {/* Modals */}
      <ClientFormModal isOpen={isNewClientOpen} onClose={() => setIsNewClientOpen(false)} />
      <SubscriptionFormModal isOpen={isNewSubOpen} onClose={() => setIsNewSubOpen(false)} />
      <PaymentFormModal isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} />
      <RenewSubscriptionModal
        isOpen={Boolean(renewSub)}
        onClose={() => setRenewSub(null)}
        subscription={renewSub}
      />
      <ReceiptModal
        isOpen={Boolean(viewPayment)}
        onClose={() => setViewPayment(null)}
        payment={viewPayment}
      />
      <ProposalModal
        isOpen={isProposalOpen}
        onClose={() => setIsProposalOpen(false)}
      />
    </div>
  );
};
