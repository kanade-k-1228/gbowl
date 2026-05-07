import type { FC, ReactNode } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
};

export const Modal: FC<Props> = ({ open, onClose, label, children }) => {
  if (!open) return null;

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: 背景クリックで閉じる装飾要素。
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="w-full max-w-md rounded-2xl bg-bg-elevated p-6 text-neutral-100 ring-1 ring-white/10"
      >
        {children}
      </div>
    </div>
  );
};
