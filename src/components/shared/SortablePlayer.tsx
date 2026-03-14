import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Profile } from '../../types';

interface Props {
  profile: Profile;
  isActive: boolean;
  order: number;
  onRemove?: () => void;
}

const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

export default function SortablePlayer({ profile, isActive, order, onRemove }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: profile.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="sortable-player">
      <span className="drag-handle" {...attributes} {...listeners}>☰</span>
      <span className="player-order">{ordinal(order)}</span>
      <span className="player-name">
        {profile.name}
        {isActive && <span className="you-badge">You</span>}
      </span>
      {!isActive && onRemove && (
        <button className="remove-btn" onClick={onRemove}>✕</button>
      )}
    </div>
  );
}
