interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  serviceName: string;
}

export function ConnectModal({
  isOpen,
  onClose,
  onConfirm,
  serviceName,
}: ConnectModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#1C1C1E] p-6 shadow-2xl">
        <h3 className="mb-2 text-xl font-semibold text-white">
          Connect {serviceName}
        </h3>
        <p className="mb-6 text-gray-400">
          You need to connect your {serviceName} account to import events. You
          will be redirected to authorize the connection.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            Connect
          </button>
        </div>
      </div>
    </div>
  );
}
