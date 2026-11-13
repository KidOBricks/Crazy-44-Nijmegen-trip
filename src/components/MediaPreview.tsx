import { Maximize2, X } from 'lucide-react';
import { useState } from 'react';
import type { MediaType } from '../types/game';

interface MediaPreviewProps {
  url: string;
  type: MediaType;
  alt: string;
  compact?: boolean;
}

export function MediaPreview({
  url,
  type,
  alt,
  compact = false,
}: MediaPreviewProps) {
  const [expanded, setExpanded] = useState(false);

  if (type === 'video') {
    return (
      <video
        src={url}
        controls
        playsInline
        preload="metadata"
        style={{
          width: '100%',
          maxHeight: compact ? '190px' : '320px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          background: '#110a1f',
        }}
      />
    );
  }

  return (
    <>
      <div style={{ position: 'relative' }}>
        <img
          src={url}
          alt={alt}
          className="media-thumb"
          style={{
            maxHeight: compact ? '190px' : '300px',
            cursor: 'zoom-in',
          }}
          onClick={() => setExpanded(true)}
        />
        <button
          type="button"
          className="icon-btn"
          aria-label="Expand image"
          onClick={() => setExpanded(true)}
          style={{
            position: 'absolute',
            right: '8px',
            bottom: '8px',
            width: '32px',
            height: '32px',
            background: 'rgba(255,255,255,0.9)',
          }}
        >
          <Maximize2 size={14} />
        </button>
      </div>

      {expanded && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setExpanded(false)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '92vw',
              maxHeight: '90dvh',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="icon-btn"
              aria-label="Close expanded image"
              onClick={() => setExpanded(false)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                zIndex: 2,
              }}
            >
              <X size={18} />
            </button>
            <img
              src={url}
              alt={alt}
              style={{
                maxWidth: '92vw',
                maxHeight: '88dvh',
                borderRadius: 'var(--radius-lg)',
                objectFit: 'contain',
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
