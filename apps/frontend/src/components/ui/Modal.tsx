
import { X, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import type { ModalConfig } from '../../hooks/useModal';

interface ModalProps {
  modal: ModalConfig;
}

export function Modal({ modal }: ModalProps) {
  if (!modal.isOpen) return null;

  const iconBgClass =
    modal.type === 'success'
      ? 'bg-emerald-100 text-emerald-600'
      : modal.type === 'warning'
        ? 'bg-amber-100 text-amber-600'
        : modal.type === 'error'
          ? 'bg-rose-100 text-rose-600'
          : 'bg-blue-100 text-blue-600';

  const confirmBtnClass =
    modal.type === 'warning' || modal.type === 'error'
      ? 'bg-rose-500 hover:bg-rose-600'
      : 'bg-emerald-500 hover:bg-emerald-600';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 p-6 relative">
        <button
          onClick={modal.onCancel || modal.onConfirm}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full p-1.5 transition"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center mt-2">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${iconBgClass}`}>
            {modal.type === 'success' ? (
              <CheckCircle2 size={28} />
            ) : modal.type === 'warning' || modal.type === 'error' ? (
              <AlertTriangle size={28} />
            ) : (
              <Info size={28} />
            )}
          </div>

          <h3 className="text-xl font-black text-slate-800 mb-2">{modal.title}</h3>
          <p className="text-sm text-slate-500 font-medium mb-6 leading-relaxed">{modal.message}</p>

          <div className="flex gap-3 w-full">
            {modal.cancelText && (
              <button
                onClick={modal.onCancel}
                className="flex-1 py-3 rounded-xl text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
              >
                {modal.cancelText}
              </button>
            )}
            <button
              onClick={modal.onConfirm}
              className={`flex-1 py-3 rounded-xl text-sm font-bold text-white transition shadow-sm ${confirmBtnClass}`}
            >
              {modal.confirmText || 'Aceptar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
