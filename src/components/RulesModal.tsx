import { BookOpen, X } from 'lucide-react';

interface RulesModalProps {
  open: boolean;
  rulesText: string;
  onClose: () => void;
}

export function RulesModal({ open, rulesText, onClose }: RulesModalProps) {
  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rules-modal-title"
      onClick={onClose}
    >
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="row-wrap">
            <BookOpen size={20} color="#4B1D8C" />
            <h2 id="rules-modal-title">Rules & Scoring</h2>
          </div>
          <button
            type="button"
            className="icon-btn"
            aria-label="Close rules"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div
          style={{
            whiteSpace: 'pre-wrap',
            fontSize: '14px',
            lineHeight: 1.65,
            color: 'var(--text-primary)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
          }}
        >
          {rulesText}
        </div>

        <button type="button" className="btn btn-primary" onClick={onClose}>
          Got It
        </button>
      </div>
    </div>
  );
}
