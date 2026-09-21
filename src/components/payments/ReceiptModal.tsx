import React, { useRef, useState } from 'react';
import { Modal } from '../common/Modal';
import { Payment } from '../../types';
import { useData } from '../../contexts/DataContext';
import { formatCurrency, formatDateDisplay } from '../../lib/dateUtils';
import { Printer, Download, CheckCircle } from 'lucide-react';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, payment }) => {
  const { settings } = useData();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!payment) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (!receiptRef.current) return;
    try {
      setIsDownloading(true);
      const element = receiptRef.current;
      const options = {
        margin: 10,
        filename: `Receipt_${payment.receipt_number}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
      };
      await html2pdf().set(options).from(element).save();
    } catch (err) {
      console.warn('PDF Receipt Export fallback:', err);
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Payment Receipt"
      subtitle={`Receipt #${payment.receipt_number}`}
      maxWidth="xl"
    >
      <div className="space-y-6">
        {/* Printable Receipt Container */}
        <div
          ref={receiptRef}
          id="printable-receipt"
          className="p-6 sm:p-8 bg-white border border-slate-200 rounded-xl shadow-xs space-y-6 font-sans print:border-none print:shadow-none print:p-0"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                  W
                </div>
                <h2 className="text-xl font-bold tracking-wider text-slate-900 font-mono">
                  {settings.business_name.toUpperCase()}
                </h2>
              </div>
              <p className="text-xs text-slate-500">{settings.address}</p>
              <p className="text-xs text-slate-500">
                GSTIN: <span className="font-mono font-medium">{settings.gstin}</span> • Phone:{' '}
                {settings.phone}
              </p>
            </div>
            <div className="text-right">
              {payment.status === 'VOIDED' ? (
                <span className="inline-block px-2.5 py-1 bg-red-100 border border-red-300 text-red-700 text-xs font-bold rounded-md uppercase tracking-wider mb-1">
                  VOIDED RECEIPT
                </span>
              ) : (
                <span className="inline-block px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-md uppercase tracking-wider mb-1">
                  Official Receipt
                </span>
              )}
              <p className="text-sm font-bold font-mono text-slate-900">{payment.receipt_number}</p>
              <p className="text-xs text-slate-500">{formatDateDisplay(payment.payment_date)}</p>
            </div>
          </div>

          {payment.status === 'VOIDED' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800">
              <p className="font-bold uppercase tracking-wide">Financial Notice: This payment was voided</p>
              {payment.voided_at && (
                <p className="text-[11px] text-red-600 mt-0.5">Void Date: {formatDateDisplay(payment.voided_at)}</p>
              )}
              {payment.void_reason && (
                <p className="text-[11px] text-red-700 mt-0.5">Reason: {payment.void_reason}</p>
              )}
            </div>
          )}

          {/* Client Details */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block uppercase font-semibold text-[10px] tracking-wider mb-0.5">
                Billed To
              </span>
              <p className="text-sm font-bold text-slate-900">
                {payment.client?.business_name || 'Client'}
              </p>
              {payment.client?.owner_name && (
                <p className="text-slate-600">Attn: {payment.client.owner_name}</p>
              )}
              {payment.client?.address && (
                <p className="text-slate-500">
                  {payment.client.address}, {payment.client.city}
                </p>
              )}
              {payment.client?.gstin && (
                <p className="text-slate-500 font-mono">GSTIN: {payment.client.gstin}</p>
              )}
            </div>

            <div className="text-right">
              <span className="text-slate-400 block uppercase font-semibold text-[10px] tracking-wider mb-0.5">
                Payment Info
              </span>
              <p className="text-slate-700">
                Method: <strong className="font-semibold text-slate-900">{payment.payment_method}</strong>
              </p>
              {payment.transaction_reference && (
                <p className="text-slate-500 font-mono truncate">
                  Ref: {payment.transaction_reference}
                </p>
              )}
              <div className="inline-flex items-center gap-1 text-emerald-600 font-semibold mt-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Payment Confirmed</span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="p-3">Description</th>
                  <th className="p-3">Plan Term</th>
                  <th className="p-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-3">
                    <p className="font-semibold text-slate-900">
                      {payment.subscription?.product?.name || 'SaaS Subscription'}
                    </p>
                    {payment.subscription?.start_date && (
                      <p className="text-[11px] text-slate-500">
                        Active Period: {formatDateDisplay(payment.subscription.start_date)} to{' '}
                        {formatDateDisplay(payment.subscription.end_date)}
                      </p>
                    )}
                  </td>
                  <td className="p-3 text-slate-600 font-medium">
                    {payment.subscription?.plan?.name || 'Standard License'}
                  </td>
                  <td className="p-3 text-right font-bold text-slate-900">
                    {formatCurrency(payment.amount)}
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200 font-semibold">
                <tr>
                  <td colSpan={2} className="p-3 text-slate-700 text-right">
                    Total Amount Received:
                  </td>
                  <td className="p-3 text-right text-base text-indigo-700 font-bold">
                    {formatCurrency(payment.amount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Notes & Footer */}
          <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <p>This is an electronically generated receipt issued by WebRajya Solutions.</p>
              {payment.notes && <p className="text-slate-600 mt-0.5">Note: {payment.notes}</p>}
            </div>
            <p className="font-mono text-[10px] text-slate-400">Authorized Signatory • WebRajya</p>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            disabled={isDownloading}
            onClick={handleDownload}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isDownloading ? 'Generating PDF...' : 'Download PDF'}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
        </div>
      </div>
    </Modal>
  );
};
