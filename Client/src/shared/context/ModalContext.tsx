import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { GlobalModal } from "../components/UI/GlobalModal";

export type ModalType = "info" | "warning" | "error" | "confirm";

export interface ModalContent {
  type: ModalType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

interface ModalContextValue {
  open: (content: ModalContent) => Promise<boolean>;
  close: (result: boolean) => void;
  confirm: (title: string, message: string) => Promise<boolean>;
  isOpen: boolean;
  modalContent: ModalContent | null;
}

const ModalContext = createContext<ModalContextValue | undefined>(undefined);

interface ModalProviderProps {
  children: ReactNode;
}

export function ModalProvider({ children }: ModalProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [modalContent, setModalContent] = useState<ModalContent | null>(null);

  // Store the resolve function in a ref to prevent stale closures
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const open = useCallback((content: ModalContent): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setModalContent(content);
      setIsOpen(true);
      resolverRef.current = resolve;
    });
  }, []);

  const close = useCallback((result: boolean) => {
    setIsOpen(false);
    if (resolverRef.current) {
      resolverRef.current(result);
      resolverRef.current = null;
    }
    
    setTimeout(() => {
      setModalContent(null);
    }, 200);
  }, []);

  const confirm = useCallback(
    (title: string, message: string): Promise<boolean> => {
      return open({
        type: "confirm",
        title,
        message,
        confirmText: "Confirm",
        cancelText: "Cancel",
      });
    },
    [open]
  );

  const handleConfirm = useCallback(() => {
    close(true);
  }, [close]);

  const handleClose = useCallback(() => {
    close(false);
  }, [close]);

  const value: ModalContextValue = {
    open,
    close,
    confirm,
    isOpen,
    modalContent,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
      <GlobalModal
        isOpen={isOpen}
        type={modalContent?.type ?? "info"}
        title={modalContent?.title ?? ""}
        message={modalContent?.message ?? ""}
        confirmText={modalContent?.confirmText}
        cancelText={modalContent?.cancelText}
        onConfirm={handleConfirm}
        onClose={handleClose}
      />
    </ModalContext.Provider>
  );
}

export function useModal(): ModalContextValue {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
}
