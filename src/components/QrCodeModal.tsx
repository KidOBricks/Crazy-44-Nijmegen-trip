import { Check, Copy, QrCode, X } from 'lucide-react';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';

interface QrCodeModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  url: string;
  onClose: () => void;
}

export function QrCodeModal({
  open,
  title,
  subtitle,
  url,
  onClose,
}: QrCodeModalProps) {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || !url) return;
    QRCode.toDataURL(url, {
      width: 280,
      margin: 2,
      color: { dark: '#23094D', light: '#FFFFFF' },
    })
      .then(setDataUrl)
      .catch(() => setDataUrl(''));
  }, [open, url]);

  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="modal-panel"
        style={{ maxWidth: '420px', textAlign: 'center' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="row-wrap">
            <QrCode size={20} color="#4B1D8C" />
            <h3>{title}</h3>
          </div>
          <button
            type="button"
            className="icon-btn"
            aria-label="Close QR modal"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {subtitle && (
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            {subtitle}
          </p>
        )}

        {dataUrl && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '12px',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <img
              src={dataUrl}
              alt={`QR code for ${title}`}
              style={{ width: '240px', height: '240px' }}
            />
          </div>
        )}

        <div
          style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            wordBreak: 'break-all',
            background: '#f8f7fc',
            padding: '10px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            textAlign: 'left',
          }}
        >
          {url}
        </div>

        <button type="button" className="btn btn-primary" onClick={handleCopy}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Link Copied!' : 'Copy Shareable URL'}
        </button>
      </div>
    </div>
  );
}
