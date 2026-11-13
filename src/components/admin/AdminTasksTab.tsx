import {
  Edit3,
  FolderPlus,
  ImagePlus,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useState } from 'react';
import type { GameRepository } from '../../services/gameRepository';
import { generateToken } from '../../services/gameRepository';
import { uploadMediaFile } from '../../services/mediaUpload';
import type { Category, Task } from '../../types/game';

interface AdminTasksTabProps {
  repo: GameRepository;
  categories: Category[];
  tasks: Task[];
  useDemoMode: boolean;
}

export function AdminTasksTab({
  repo,
  categories,
  tasks,
  useDemoMode,
}: AdminTasksTabProps) {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isNewTask, setIsNewTask] = useState(false);
  const [taskSaving, setTaskSaving] = useState(false);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [taskError, setTaskError] = useState<string | null>(null);

  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [isNewCat, setIsNewCat] = useState(false);
  const [catSaving, setCatSaving] = useState(false);

  const sortedCategories = [...categories].sort((a, b) => a.order - b.order);
  const sortedTasks = [...tasks].sort((a, b) => a.number - b.number);

  const nextTaskNumber =
    sortedTasks.length > 0
      ? Math.max(...sortedTasks.map((t) => t.number)) + 1
      : 1;

  const openNewTaskModal = (defaultCategoryId?: string) => {
    const now = Date.now();
    setIsNewTask(true);
    setTaskError(null);
    setUploadPct(null);
    setEditingTask({
      id: `task-${generateToken(8)}`,
      number: Math.min(44, nextTaskNumber),
      title: '',
      description: '',
      categoryId: defaultCategoryId || sortedCategories[0]?.id || '',
      points: 1,
      imageUrl: '',
      createdAt: now,
      updatedAt: now,
    });
  };

  const openEditTaskModal = (task: Task) => {
    setIsNewTask(false);
    setTaskError(null);
    setUploadPct(null);
    setEditingTask({ ...task });
  };

  const openNewCategoryModal = () => {
    setIsNewCat(true);
    setEditingCat({
      id: `cat-${generateToken(8)}`,
      name: '',
      order: sortedCategories.length + 1,
    });
  };

  const handleTaskImageUpload = async (file: File) => {
    if (!editingTask) return;
    setTaskError(null);
    setUploadPct(0);
    try {
      const res = await uploadMediaFile(
        file,
        `tasks/${editingTask.id}`,
        useDemoMode,
        setUploadPct,
        editingTask.imagePath,
      );
      if (res.mediaType !== 'image') {
        throw new Error('Task reference image must be a photo.');
      }
      setEditingTask({
        ...editingTask,
        imageUrl: res.mediaUrl,
        imagePath: res.mediaPath,
      });
    } catch (err) {
      setTaskError(err instanceof Error ? err.message : 'Image upload failed.');
    } finally {
      setUploadPct(null);
    }
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    if (!editingTask.title.trim()) {
      setTaskError('Please enter a task name.');
      return;
    }
    if (!editingTask.categoryId) {
      setTaskError('Please select or create a category first.');
      return;
    }

    setTaskSaving(true);
    setTaskError(null);
    try {
      await repo.saveTask({
        ...editingTask,
        title: editingTask.title.trim(),
        description: editingTask.description.trim(),
        number: Math.max(1, Number(editingTask.number) || 1),
        points: Math.max(1, Number(editingTask.points) || 1),
        updatedAt: Date.now(),
      });
      setEditingTask(null);
    } catch (err) {
      setTaskError(err instanceof Error ? err.message : 'Could not save task.');
    } finally {
      setTaskSaving(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!editingTask || isNewTask) return;
    setTaskSaving(true);
    try {
      await repo.deleteTask(editingTask.id);
      setEditingTask(null);
    } finally {
      setTaskSaving(false);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat || !editingCat.name.trim()) return;
    setCatSaving(true);
    try {
      await repo.saveCategory({
        ...editingCat,
        name: editingCat.name.trim(),
        order: Number(editingCat.order) || 1,
      });
      setEditingCat(null);
    } finally {
      setCatSaving(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!editingCat || isNewCat) return;
    setCatSaving(true);
    try {
      await repo.deleteCategory(editingCat.id);
      setEditingCat(null);
    } finally {
      setCatSaving(false);
    }
  };

  const uncategorizedTasks = sortedTasks.filter(
    (t) => !sortedCategories.some((c) => c.id === t.categoryId),
  );

  return (
    <div className="stack-lg">
      <div className="card-tinted row-between">
        <div>
          <h3>Tasks & Categories ({tasks.length} / 44)</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Click any task to edit its details, points, or image. Changes sync
            live to all phones.
          </p>
        </div>

        <div className="row-wrap">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={openNewCategoryModal}
          >
            <FolderPlus size={16} />
            Add Category
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => openNewTaskModal()}
          >
            <Plus size={16} />
            Add Task
          </button>
        </div>
      </div>

      {sortedCategories.length === 0 && tasks.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
          <h3>No tasks yet</h3>
          <p
            style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              margin: '8px 0 16px',
            }}
          >
            Load your 35 Nijmegen tasks across 4 categories, or create your own
            from scratch.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => repo.seedDefaultTasks()}
          >
            <Sparkles size={16} />
            Load Crazy 35 Starter Tasks
          </button>
        </div>
      )}

      {sortedCategories.map((cat) => {
        const catTasks = sortedTasks.filter((t) => t.categoryId === cat.id);
        return (
          <section key={cat.id} className="stack-sm">
            <div className="row-between">
              <div className="row-wrap">
                <h3 style={{ fontSize: '17px' }}>{cat.name}</h3>
                <span className="badge badge-purple">
                  {catTasks.length} {catTasks.length === 1 ? 'task' : 'tasks'}
                </span>
              </div>
              <div className="row-wrap">
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => {
                    setIsNewCat(false);
                    setEditingCat({ ...cat });
                  }}
                >
                  <Edit3 size={14} />
                  Edit Category
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => openNewTaskModal(cat.id)}
                >
                  <Plus size={14} />
                  Task
                </button>
              </div>
            </div>

            {catTasks.length === 0 ? (
              <div
                className="card-tinted"
                style={{
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                }}
              >
                No tasks in this category yet. Click &ldquo;+ Task&rdquo; above
                to add one.
              </div>
            ) : (
              <div className="grid-auto">
                {catTasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    className="card card-interactive"
                    onClick={() => openEditTaskModal(task)}
                    style={{
                      textAlign: 'left',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      width: '100%',
                    }}
                  >
                    <div className="row-between" style={{ width: '100%' }}>
                      <span className="task-number-pill">#{task.number}</span>
                      <span className="badge badge-purple">
                        {task.points} {task.points === 1 ? 'pt' : 'pts'}
                      </span>
                    </div>

                    {task.imageUrl && (
                      <img
                        src={task.imageUrl}
                        alt={task.title}
                        style={{
                          width: '100%',
                          height: '120px',
                          objectFit: 'cover',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      />
                    )}

                    <div className="stack-sm" style={{ gap: '4px' }}>
                      <strong
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '16px',
                          color: 'var(--purple-950)',
                        }}
                      >
                        {task.title}
                      </strong>
                      <span
                        style={{
                          fontSize: '13px',
                          color: 'var(--text-secondary)',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {task.description}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        );
      })}

      {uncategorizedTasks.length > 0 && (
        <section className="stack-sm">
          <h3>Uncategorized</h3>
          <div className="grid-auto">
            {uncategorizedTasks.map((task) => (
              <button
                key={task.id}
                type="button"
                className="card card-interactive"
                onClick={() => openEditTaskModal(task)}
                style={{ textAlign: 'left' }}
              >
                <div className="row-between">
                  <span className="task-number-pill">#{task.number}</span>
                  <span className="badge badge-purple">{task.points} pt</span>
                </div>
                <strong style={{ display: 'block', marginTop: '8px' }}>
                  {task.title}
                </strong>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Task Editor Modal */}
      {editingTask && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setEditingTask(null)}
        >
          <form
            className="modal-panel"
            onSubmit={handleSaveTask}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>{isNewTask ? 'Create Task' : `Edit Task #${editingTask.number}`}</h3>
              <button
                type="button"
                className="icon-btn"
                aria-label="Close task editor"
                onClick={() => setEditingTask(null)}
              >
                <X size={18} />
              </button>
            </div>

            {taskError && (
              <div className="badge badge-rejected" style={{ padding: '10px' }}>
                {taskError}
              </div>
            )}

            <div className="grid-2">
              <label className="field">
                <span className="field-label">Task Number (1–44)</span>
                <input
                  type="number"
                  min={1}
                  max={99}
                  className="input"
                  value={editingTask.number}
                  onChange={(e) =>
                    setEditingTask({
                      ...editingTask,
                      number: Number(e.target.value),
                    })
                  }
                />
              </label>

              <label className="field">
                <span className="field-label">Points (default 1)</span>
                <input
                  type="number"
                  min={1}
                  max={50}
                  className="input"
                  value={editingTask.points}
                  onChange={(e) =>
                    setEditingTask({
                      ...editingTask,
                      points: Number(e.target.value),
                    })
                  }
                />
              </label>
            </div>

            <label className="field">
              <span className="field-label">Task Name</span>
              <input
                type="text"
                className="input"
                placeholder="e.g., Bow to the devil"
                value={editingTask.title}
                onChange={(e) =>
                  setEditingTask({ ...editingTask, title: e.target.value })
                }
                required
              />
            </label>

            <label className="field">
              <span className="field-label">Category</span>
              <select
                className="select"
                value={editingTask.categoryId}
                onChange={(e) =>
                  setEditingTask({ ...editingTask, categoryId: e.target.value })
                }
                required
              >
                <option value="" disabled>
                  Select category...
                </option>
                {sortedCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span className="field-label">Description</span>
              <textarea
                className="textarea"
                placeholder="Describe what teams need to capture in their photo or video..."
                value={editingTask.description}
                onChange={(e) =>
                  setEditingTask({
                    ...editingTask,
                    description: e.target.value,
                  })
                }
              />
            </label>

            <div className="field">
              <span className="field-label">Reference Image (optional)</span>
              {editingTask.imageUrl && (
                <div style={{ position: 'relative' }}>
                  <img
                    src={editingTask.imageUrl}
                    alt="Reference"
                    className="media-thumb"
                    style={{ maxHeight: '180px' }}
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    style={{ position: 'absolute', top: '8px', right: '8px' }}
                    onClick={() =>
                      setEditingTask({
                        ...editingTask,
                        imageUrl: '',
                        imagePath: '',
                      })
                    }
                  >
                    Remove
                  </button>
                </div>
              )}

              <label className="btn btn-outline" style={{ cursor: 'pointer' }}>
                <ImagePlus size={16} />
                {uploadPct !== null
                  ? `Uploading ${uploadPct}%...`
                  : editingTask.imageUrl
                    ? 'Replace Image'
                    : 'Upload Reference Image'}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  disabled={uploadPct !== null}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleTaskImageUpload(file);
                  }}
                />
              </label>
            </div>

            <div className="row-between">
              {!isNewTask ? (
                <button
                  type="button"
                  className="btn btn-danger-outline"
                  onClick={handleDeleteTask}
                  disabled={taskSaving}
                >
                  <Trash2 size={16} />
                  Delete Task
                </button>
              ) : (
                <span />
              )}

              <div className="row-wrap">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setEditingTask(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={taskSaving || uploadPct !== null}
                >
                  {taskSaving ? 'Saving...' : 'Save & Push Live'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Category Editor Modal */}
      {editingCat && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setEditingCat(null)}
        >
          <form
            className="modal-panel"
            style={{ maxWidth: '460px' }}
            onSubmit={handleSaveCategory}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>{isNewCat ? 'Add Category' : 'Edit Category'}</h3>
              <button
                type="button"
                className="icon-btn"
                aria-label="Close category editor"
                onClick={() => setEditingCat(null)}
              >
                <X size={18} />
              </button>
            </div>

            <label className="field">
              <span className="field-label">Category Name</span>
              <input
                type="text"
                className="input"
                placeholder="e.g., Part 5: Bonus Challenges"
                value={editingCat.name}
                onChange={(e) =>
                  setEditingCat({ ...editingCat, name: e.target.value })
                }
                required
              />
            </label>

            <label className="field">
              <span className="field-label">Display Order</span>
              <input
                type="number"
                min={1}
                className="input"
                value={editingCat.order}
                onChange={(e) =>
                  setEditingCat({
                    ...editingCat,
                    order: Number(e.target.value),
                  })
                }
              />
            </label>

            <div className="row-between">
              {!isNewCat ? (
                <button
                  type="button"
                  className="btn btn-danger-outline"
                  onClick={handleDeleteCategory}
                  disabled={catSaving}
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              ) : (
                <span />
              )}

              <div className="row-wrap">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setEditingCat(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={catSaving}
                >
                  {catSaving ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
