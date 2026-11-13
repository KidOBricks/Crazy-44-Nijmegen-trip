import { AlertCircle, CheckCircle2, Clock, Upload, X } from 'lucide-react';
import { useState } from 'react';
import type { GameRepository } from '../../services/gameRepository';
import { uploadMediaFile } from '../../services/mediaUpload';
import { sendNtfyPush } from '../../services/notifications';
import type { GameState, Submission, Task, Team } from '../../types/game';
import { MediaPreview } from '../MediaPreview';

interface TaskDetailModalProps {
  task: Task | null;
  categoryName: string;
  team: Team;
  game: GameState;
  submission?: Submission;
  repo: GameRepository;
  useDemoMode: boolean;
  onClose: () => void;
  onUploaded: () => void;
}

export function TaskDetailModal({
  task,
  categoryName,
  team,
  game,
  submission,
  repo,
  useDemoMode,
  onClose,
  onUploaded,
}: TaskDetailModalProps) {
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!task) return null;

  const isLocked =
    game.status === 'ended' || submission?.status === 'approved';

  const handleFileSelected = async (file: File) => {
    if (isLocked) return;
    setError(null);
    setUploadPct(0);
    try {
      const uploaded = await uploadMediaFile(
        file,
        `submissions/${team.id}/${task.id}`,
        useDemoMode,
        setUploadPct,
        submission?.mediaPath,
        {
          cloudName: game.cloudinaryCloudName,
          uploadPreset: game.cloudinaryUploadPreset,
        },
      );

      const now = Date.now();
      const subId = `${team.id}_${task.id}`;

      await repo.submitProof({
        id: subId,
        teamId: team.id,
        taskId: task.id,
        taskNumber: task.number,
        taskTitle: task.title,
        categoryId: task.categoryId,
        teamName: team.name,
        teamNumber: team.number,
        teamColor: team.color,
        mediaUrl: uploaded.mediaUrl,
        mediaPath: uploaded.mediaPath,
        mediaType: uploaded.mediaType,
        status: 'unmarked',
        basePoints: task.points,
        bonusPoints: 0,
        awardedPoints: 0,
        adminNote: '',
        submittedAt: now,
        gradedAt: null,
      });

      if (game.ntfyTopic) {
        sendNtfyPush(
          game.ntfyTopic,
          `Crazy 44: Team ${team.number} (${team.name})`,
          `Uploaded #${task.number}: ${task.title}`,
        );
      }

      onUploaded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Try again.');
    } finally {
      setUploadPct(null);
    }
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="row-wrap">
            <span className="task-number-pill">#{task.number}</span>
            <span className="badge badge-purple">
              {task.points} {task.points === 1 ? 'pt' : 'pts'}
            </span>
          </div>
          <button
            type="button"
            className="icon-btn"
            aria-label="Close task details"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="stack-sm" style={{ gap: '4px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
            {categoryName}
          </span>
          <h3>{task.title}</h3>
        </div>

        <p style={{ fontSize: '15px', lineHeight: 1.6, color: 'var(--text-primary)' }}>
          {task.description}
        </p>

        {task.imageUrl && (
          <div className="stack-sm">
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
              Reference Image
            </span>
            <MediaPreview
              url={task.imageUrl}
              type="image"
              alt={task.title}
              compact
            />
          </div>
        )}

        {submission?.status === 'rejected' && (
          <div
            className="card-tinted stack-sm"
            style={{
              background: 'var(--rejected-bg)',
              borderColor: 'var(--rejected-border)',
              color: 'var(--rejected-text)',
            }}
          >
            <div className="row-wrap">
              <AlertCircle size={18} />
              <strong>Redo Requested by Admin</strong>
            </div>
            <p style={{ fontSize: '13px' }}>
              {submission.adminNote ||
                'Please re-shoot and upload a clearer photo or video.'}
            </p>
          </div>
        )}

        {submission?.status === 'unmarked' && (
          <div className="card-tinted stack-sm">
            <div className="row-between">
              <span className="badge badge-pending">
                <Clock size={12} />
                Submitted — Pending Admin Review
              </span>
            </div>
            <MediaPreview
              url={submission.mediaUrl}
              type={submission.mediaType}
              alt="Your uploaded proof"
              compact
            />
          </div>
        )}

        {submission?.status === 'approved' && (
          <div
            className="card-tinted stack-sm"
            style={{
              background: 'var(--approved-bg)',
              borderColor: 'var(--approved-border)',
            }}
          >
            <div className="row-between">
              <span className="badge badge-approved">
                <CheckCircle2 size={12} />
                Approved (+{submission.awardedPoints} pts
                {submission.bonusPoints > 0
                  ? ` incl. +${submission.bonusPoints} bonus`
                  : ''}
                )
              </span>
            </div>
            <MediaPreview
              url={submission.mediaUrl}
              type={submission.mediaType}
              alt="Approved proof"
              compact
            />
          </div>
        )}

        {error && (
          <div className="badge badge-rejected" style={{ padding: '10px' }}>
            {error}
          </div>
        )}

        {uploadPct !== null && (
          <div className="stack-sm">
            <div className="row-between" style={{ fontSize: '13px' }}>
              <strong>Uploading proof...</strong>
              <span>{uploadPct}%</span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${uploadPct}%` }}
              />
            </div>
          </div>
        )}

        {!isLocked && (
          <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
            <Upload size={17} />
            {uploadPct !== null
              ? 'Uploading...'
              : submission
                ? 'Re-upload Photo or Video'
                : 'Upload Photo or Video'}
            <input
              type="file"
              accept="image/*,video/*"
              style={{ display: 'none' }}
              disabled={uploadPct !== null}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelected(file);
              }}
            />
          </label>
        )}

        {submission?.status === 'approved' && (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
            This task is approved and locked!
          </p>
        )}
      </div>
    </div>
  );
}
