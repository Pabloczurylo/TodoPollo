import { useState } from 'react';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export type ModalType = 'success' | 'warning' | 'error' | 'info';

export interface ModalConfig {
  isOpen: boolean;
  title: string;
  message: string;
  type?: ModalType;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export function useModal() {
  const [modal, setModal] = useState<ModalConfig>({ isOpen: false, title: '', message: '' });

  const closeModal = () => setModal((prev) => ({ ...prev, isOpen: false }));

  const showAlert = (title: string, message: string, type: ModalType = 'info') => {
    setModal({
      isOpen: true,
      title,
      message,
      type,
      confirmText: 'Aceptar',
      onConfirm: closeModal,
    });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setModal({
      isOpen: true,
      title,
      message,
      type: 'warning',
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      onConfirm,
      onCancel: closeModal,
    });
  };

  return { modal, showAlert, showConfirm, closeModal };
}

// Re-export icons used in Modal for convenience
export { CheckCircle2, AlertTriangle, Info };
