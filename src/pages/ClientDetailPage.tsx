import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Building,
  Phone,
  Mail,
  MapPin,
  FileText,
  CreditCard,
  Receipt,
  Plus,
  ArrowLeft,
  Edit2,
  Clock,
  Printer,
  MessageCircle,
  PieChart,
  Upload,
  Trash2,
  Download,
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatCurrency, formatDateDisplay, getDaysRemaining } from '../lib/dateUtils';
import { SubscriptionFormModal } from '../components/subscriptions/SubscriptionFormModal';
import { PaymentFormModal } from '../components/payments/PaymentFormModal';
import { RenewSubscriptionModal } from '../components/subscriptions/RenewSubscriptionModal';
import { ReceiptModal } from '../components/payments/ReceiptModal';
import { ClientFormModal } from '../components/clients/ClientFormModal';
import { ClientTimeline } from '../components/clients/ClientTimeline';
import { DocumentUploadModal } from '../components/documents/DocumentUploadModal';
import { Subscription, Payment } from '../types';

export const ClientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    getClientById,
    events,
    sendReminder,
    clientDocuments,
    deleteClientDocument,
  } = useData();
  const { addToast } = useToast();

  const client = getClientById(id || '');

  // Modals state
  const [isEditClientOpen, setIsEditClientOpen] = useState(false);
  const [isNewSubOpen, setIsNewSubOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [paymentSubId, setPaymentSubId] = useState<string | undefined>(undefined);
  const [renewSub, setRenewSub] = useState<Subscription | null>(null);
  const [viewReceipt, setViewReceipt] = useState<Payment | null>(null);

  if (!client) {
    return (
      <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
        <h2 className="text-base font-bold text-slate-900 mb-2">Client Not Found</h2>
        <p className="text-xs text-slate-500 mb-4">
          The client account you requested does not exist or has been removed.
        </p>
        <button
          onClick={() => navigate('/clients')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
        >
          Return to Clients Directory
        </button>
      </div>
    );
  }

  // Filter events for this client
  const clientEvents = events.filter((e) => e.client_id === client.id);

  const clientSubscriptions: Subscription[] = client.subscriptions || [];
  const clientPayments: Payment[] = client.payments || [];

  const handleSendReminder = async (sub: Subscription) => {
    if (!client.phone) {
      alert(`Client ${client.business_name} does not have a phone number on record.`);
      return;
    }
    const cleanPhone = client.phone.replace(/\D/g, '');
    const message = `Hello ${client.business_name}, this is a reminder from WebRajya Solutions that your subscription for ${sub.product?.name} (${sub.plan?.name || 'Annual'}) expires on ${formatDateDisplay(sub.end_date)}. Please renew to ensure uninterrupted service.`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
    await sendReminder(sub.id, 'WHATSAPP', 'OPENED');
  };

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/clients')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Clients Directory</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditClientOpen(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
          <button
            onClick={() => {
              setPaymentSubId(undefined);
              setIsPaymentOpen(true);
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Record Payment</span>
          </button>
          <button
            onClick={() => setIsNewSubOpen(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Subscription</span>
          </button>
        </div>
      </div>

      {/* Client Profile Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg shrink-0">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  {client.business_name}
                </h1>
                <StatusBadge status={client.status} size="sm" />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Primary Contact: <strong className="text-slate-800">{client.owner_name}</strong>
              </p>

              {/* Badges strip */}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {client.phone}
                </span>
                {client.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {client.email}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {client.city}, {client.state}
                </span>
                {client.gstin && (
                  <span className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                    GSTIN: {client.gstin}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Outstanding Balance Banner */}
          <div className="flex md:flex-col items-baseline md:items-end justify-between md:justify-center p-3 rounded-lg bg-slate-50 border border-slate-200 shrink-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Outstanding Dues
            </span>
            <span
              className={`text-xl font-bold font-mono ${
                (client.total_outstanding || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {formatCurrency(client.total_outstanding || 0)}
            </span>
          </div>
        </div>

        {client.notes && (
          <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
            <strong className="text-slate-700">Account Notes:</strong> {client.notes}
          </div>
        )}
      </div>

      {/* Subscriptions Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Active & Historic Subscriptions ({clientSubscriptions.length})
            </h2>
          </div>
          <button
            onClick={() => setIsNewSubOpen(true)}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
          >
            + New License
          </button>
        </div>

        {clientSubscriptions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No subscriptions assigned to this client yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="p-3">Product / Plan</th>
                  <th className="p-3">Start Date</th>
                  <th className="p-3">End Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Contract Value</th>
                  <th className="p-3">Outstanding</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clientSubscriptions.map((sub: Subscription) => {
                  const days = getDaysRemaining(sub.end_date);
                  return (
                    <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        <p className="font-semibold text-slate-900">{sub.product?.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {sub.plan?.name || `${sub.plan?.duration_months || 12} mo term`}
                        </p>
                      </td>
                      <td className="p-3 text-slate-600 font-medium">
                        {formatDateDisplay(sub.start_date)}
                      </td>
                      <td className="p-3 font-semibold text-slate-900">
                        {formatDateDisplay(sub.end_date)}
                        {sub.status === 'EXPIRING_SOON' && (
                          <span className="block text-[11px] text-amber-600 font-semibold">
                            Expires in {days}d
                          </span>
                        )}
                        {sub.status === 'EXPIRED' && (
                          <span className="block text-[11px] text-rose-600 font-semibold">
                            Expired {Math.abs(days)}d ago
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <StatusBadge status={sub.status} size="sm" />
                      </td>
                      <td className="p-3 font-mono font-semibold text-slate-900">
                        {formatCurrency(sub.amount)}
                      </td>
                      <td className="p-3 font-mono">
                        {(sub.outstanding_balance || 0) > 0 ? (
                          <span className="font-bold text-rose-600">
                            {formatCurrency(sub.outstanding_balance!)}
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-medium">Settled</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSendReminder(sub)}
                            title="Send WhatsApp Reminder"
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                          {(sub.outstanding_balance || 0) > 0 && (
                            <button
                              onClick={() => {
                                setPaymentSubId(sub.id);
                                setIsPaymentOpen(true);
                              }}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold"
                            >
                              Collect
                            </button>
                          )}
                          <button
                            onClick={() => setRenewSub(sub)}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold"
                          >
                            Renew
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Partial Payment & Installment Ledger Summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Contract Installments & Settlement Ledger
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            Total Settled Rate:{' '}
            <strong className="text-slate-900 font-mono">
              {(() => {
                const totalContract = clientSubscriptions.reduce((sum, s) => sum + (s.amount || 0), 0);
                const totalPaid = clientPayments
                  .filter((p) => p.status !== 'VOIDED')
                  .reduce((sum, p) => sum + (p.amount || 0), 0);
                if (totalContract === 0) return '100%';
                return `${Math.min(100, Math.round((totalPaid / totalContract) * 100))}%`;
              })()}
            </strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Active Contracts</p>
            <p className="text-lg font-bold font-mono text-slate-900 mt-1">
              {formatCurrency(clientSubscriptions.reduce((sum, s) => sum + (s.amount || 0), 0))}
            </p>
          </div>
          <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
            <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Total Payments Collected</p>
            <p className="text-lg font-bold font-mono text-emerald-600 mt-1">
              {formatCurrency(
                clientPayments
                  .filter((p) => p.status !== 'VOIDED')
                  .reduce((sum, p) => sum + (p.amount || 0), 0)
              )}
            </p>
          </div>
          <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-100">
            <p className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">Remaining Balance Due</p>
            <p className="text-lg font-bold font-mono text-rose-600 mt-1">
              {formatCurrency(client.total_outstanding || 0)}
            </p>
          </div>
        </div>

        {/* Per Subscription Progress Bars */}
        {clientSubscriptions.length > 0 && (
          <div className="space-y-3 pt-2">
            <p className="text-xs font-semibold text-slate-700">Installment Breakdown per Product:</p>
            {clientSubscriptions.map((sub) => {
              const totalAmount = sub.amount || 0;
              const due = sub.outstanding_balance || 0;
              const paid = Math.max(0, totalAmount - due);
              const percent = totalAmount > 0 ? Math.min(100, Math.round((paid / totalAmount) * 100)) : 100;
              return (
                <div key={sub.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800">{sub.product?.name}</span>
                    <span className="font-mono text-[11px] text-slate-500">
                      Paid: <strong className="text-emerald-600">{formatCurrency(paid)}</strong> / {formatCurrency(totalAmount)} ({percent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        percent === 100 ? 'bg-emerald-500' : percent > 50 ? 'bg-indigo-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payments History & Audit Timeline Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment History */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                Payment History ({clientPayments.length})
              </h2>
            </div>
            <button
              onClick={() => {
                setPaymentSubId(undefined);
                setIsPaymentOpen(true);
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              + Record Payment
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {clientPayments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No payment settlements recorded for this client.
              </div>
            ) : (
              clientPayments.map((p: Payment) => {
                const isVoided = p.status === 'VOIDED';
                return (
                  <div
                    key={p.id}
                    className={`p-4 hover:bg-slate-50 flex items-center justify-between gap-4 transition-colors ${
                      isVoided ? 'bg-red-50/30' : ''
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {p.receipt_number}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 font-semibold text-slate-600">
                          {p.payment_method}
                        </span>
                        {isVoided && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 font-bold text-red-700">
                            VOIDED
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {formatDateDisplay(p.payment_date)}
                        {p.transaction_reference && ` • Ref: ${p.transaction_reference}`}
                        {p.void_reason && ` • Void Reason: ${p.void_reason}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {isVoided ? (
                        <span className="text-sm font-mono font-semibold line-through text-slate-400">
                          {formatCurrency(p.amount)}
                        </span>
                      ) : (
                        <span className="text-sm font-mono font-bold text-emerald-600">
                          {formatCurrency(p.amount)}
                        </span>
                      )}
                      <button
                        onClick={() => setViewReceipt(p)}
                        title="Print Official Receipt"
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Audit Log / Timeline */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Client Activity Timeline
            </h2>
          </div>

          <div className="p-4 max-h-80 overflow-y-auto">
            <ClientTimeline events={clientEvents} />
          </div>
        </div>
      </div>

      {/* Digital Contracts & SLA Documents Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Signed Contracts, Agreements & SLA Files
            </h2>
          </div>
          <button
            onClick={() => setIsDocModalOpen(true)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-2xs inline-flex items-center gap-1 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Document</span>
          </button>
        </div>

        {(() => {
          const docs = clientDocuments.filter((d) => d.client_id === client.id);
          if (docs.length === 0) {
            return (
              <div className="p-6 text-center text-xs text-slate-400">
                No signed contracts or SLA documents attached to this client file yet.
              </div>
            );
          }
          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {docs.map((doc) => (
                <div key={doc.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                  <div className="truncate">
                    <p className="font-bold text-xs text-slate-800 truncate">{doc.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{doc.file_type} • {formatDateDisplay(doc.uploaded_at)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={doc.file_data}
                      download={doc.name}
                      className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded"
                      title="Download Document"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => deleteClientDocument(doc.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded"
                      title="Delete Document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Modals */}
      <ClientFormModal
        isOpen={isEditClientOpen}
        onClose={() => setIsEditClientOpen(false)}
        clientToEdit={client}
      />
      <SubscriptionFormModal
        isOpen={isNewSubOpen}
        onClose={() => setIsNewSubOpen(false)}
        preselectedClientId={client.id}
      />
      <PaymentFormModal
        isOpen={isPaymentOpen}
        onClose={() => {
          setIsPaymentOpen(false);
          setPaymentSubId(undefined);
        }}
        preselectedClientId={client.id}
        preselectedSubscriptionId={paymentSubId}
      />
      <RenewSubscriptionModal
        isOpen={Boolean(renewSub)}
        onClose={() => setRenewSub(null)}
        subscription={renewSub}
      />
      <ReceiptModal
        isOpen={Boolean(viewReceipt)}
        onClose={() => setViewReceipt(null)}
        payment={viewReceipt}
      />
      <DocumentUploadModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        clientId={client.id}
      />
    </div>
  );
};
