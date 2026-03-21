import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useGoto } from '../../../hooks/useGoto';
import { useLastSetupStore } from '../../../store/lastSetupStore';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useProfilesStore } from '../../../store/profilesStore';
import StepToggle from '../../../components/shared/StepToggle';
import PlayerPicker from '../../../components/shared/PlayerPicker';
import { ROUTES } from '../../../constants';
import type { Profile } from '../../../types';

type Mode = 'players' | 'cpu';
type Legs = 1 | 3 | 5;

const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

function TeamPlayer({
  profile,
  isActive,
  order,
  onRemove,
}: {
  profile: Profile;
  isActive: boolean;
  order: number;
  onRemove?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: profile.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="team-player">
      <span className="drag-handle" {...attributes} {...listeners}>☰</span>
      <span className="player-order">{ordinal(order)}</span>
      <span className="team-player-name">
        {profile.name}
        {isActive && <span className="you-badge">You</span>}
      </span>
      {!isActive && onRemove && (
        <button className="remove-btn" onClick={onRemove}>✕</button>
      )}
    </div>
  );
}

export default function CricketSetupScreen() {
  const goto = useGoto();
  const saveSetup = useLastSetupStore((s) => s.save);
  const { state } = useLocation();
  const { profiles, activeProfileId } = useProfilesStore();
  const activeProfile = profiles.find((p) => p.id === activeProfileId);

  const [mode, setMode] = useState<Mode>(state?.mode ?? 'players');
  const [difficulty, setDifficulty] = useState(state?.difficulty ?? 15);
  const [legs, setLegs] = useState<Legs>(state?.legs ?? 1);
  const [practice, setPractice] = useState(state?.practice ?? false);
  const [team1, setTeam1] = useState<Profile[]>(state?.team1 ?? (activeProfile ? [activeProfile] : []));
  const [team2, setTeam2] = useState<Profile[]>(state?.team2 ?? []);

  const sensors = useSensors(useSensor(PointerSensor));

  const pendingTeam = team1.length > team2.length ? 2 : team2.length > team1.length ? 1 : null;
  const usedIds = new Set([...team1, ...team2].map((p) => p.id));
  const available = profiles.filter((p) => !usedIds.has(p.id));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const inTeam1 = (id: string) => team1.some((p) => p.id === id);
    const inTeam2 = (id: string) => team2.some((p) => p.id === id);

    const fromTeam1 = inTeam1(activeId);
    const fromTeam2 = inTeam2(activeId);
    const toTeam1 = inTeam1(overId);
    const toTeam2 = inTeam2(overId);

    if (fromTeam1 && toTeam1) {
      // Reorder within team 1
      const oldIndex = team1.findIndex((p) => p.id === activeId);
      const newIndex = team1.findIndex((p) => p.id === overId);
      setTeam1(arrayMove(team1, oldIndex, newIndex));
    } else if (fromTeam2 && toTeam2) {
      // Reorder within team 2
      const oldIndex = team2.findIndex((p) => p.id === activeId);
      const newIndex = team2.findIndex((p) => p.id === overId);
      setTeam2(arrayMove(team2, oldIndex, newIndex));
    } else if (fromTeam1 && toTeam2) {
      // Switch: move from team 1 to team 2
      const player = team1.find((p) => p.id === activeId)!;
      const overPlayer = team2.find((p) => p.id === overId)!;
      setTeam1((prev) => prev.map((p) => (p.id === activeId ? overPlayer : p)));
      setTeam2((prev) => prev.map((p) => (p.id === overId ? player : p)));
    } else if (fromTeam2 && toTeam1) {
      // Switch: move from team 2 to team 1
      const player = team2.find((p) => p.id === activeId)!;
      const overPlayer = team1.find((p) => p.id === overId)!;
      setTeam2((prev) => prev.map((p) => (p.id === activeId ? overPlayer : p)));
      setTeam1((prev) => prev.map((p) => (p.id === overId ? player : p)));
    }
  }

  function addToTeam(team: 1 | 2, profile: Profile) {
    if (team === 1) setTeam1((prev) => [...prev, profile]);
    else setTeam2((prev) => [...prev, profile]);
  }

  function removeFromTeam(team: 1 | 2, id: string) {
    if (team === 1) setTeam1((prev) => prev.filter((p) => p.id !== id));
    else setTeam2((prev) => prev.filter((p) => p.id !== id));
  }

  function canAddToTeam(team: 1 | 2) {
    if (available.length === 0) return false;
    if (pendingTeam === null) return true;
    return pendingTeam === team;
  }

  const canStart =
    mode === 'cpu'
      ? !!activeProfile
      : team1.length >= 1 && team2.length >= 1 && team1.length === team2.length;

  return (
    <div className="page">
      <h2>Cricket</h2>

      {/* Mode */}
      <div className="option-group">
        <button
          className={mode === 'players' ? 'selected' : ''}
          onClick={() => setMode('players')}
        >
          Select Players
        </button>
        <button
          className={mode === 'cpu' ? 'selected' : ''}
          onClick={() => setMode('cpu')}
        >
          vs CPU
        </button>
      </div>

      {/* Players mode */}
      {mode === 'players' && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="teams-container">
            {([1, 2] as const).map((teamNum) => {
              const team = teamNum === 1 ? team1 : team2;
              return (
                <div key={teamNum} className="team-column">
                  <p className="section-label">
                    Team {teamNum}
                    {teamNum === 1 && <span className="throws-first-badge">Throws first</span>}
                  </p>

                  <SortableContext
                    items={team.map((p) => p.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {team.map((p, i) => (
                      <TeamPlayer
                        key={p.id}
                        profile={p}
                        isActive={p.id === activeProfileId}
                        order={i + 1}
                        onRemove={
                          p.id !== activeProfileId
                            ? () => removeFromTeam(teamNum, p.id)
                            : undefined
                        }
                      />
                    ))}
                  </SortableContext>

                  {canAddToTeam(teamNum) && (
                    <PlayerPicker
                      profiles={available}
                      onSelect={(p) => addToTeam(teamNum, p)}
                      label="Search to add…"
                      requireAuth={!practice}
                    />
                  )}

                  {!canAddToTeam(teamNum) && pendingTeam === teamNum && (
                    <p className="hint">Add to Team {teamNum} first</p>
                  )}
                </div>
              );
            })}
          </div>
        </DndContext>
      )}

      {/* CPU mode */}
      {mode === 'cpu' && (
        <div className="setup-section">
          <p className="section-label">CPU Difficulty</p>
          <StepToggle
            min={1}
            max={30}
            value={difficulty}
            onChange={setDifficulty}
            label="Level"
          />
        </div>
      )}

      {/* Legs */}
      <div className="setup-section">
        <p className="section-label">Legs</p>
        <div className="option-group">
          {([1, 3, 5] as Legs[]).map((l) => (
            <button
              key={l}
              className={legs === l ? 'selected' : ''}
              onClick={() => setLegs(l)}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {mode === 'players' && pendingTeam !== null && (
        <p className="hint">Balance the teams before starting.</p>
      )}

      {/* Practice */}
      <div className="setup-section">
        <div className="practice-toggle">
          <div>
            <p className="section-label">Practice Mode</p>
            <p className="hint">Won't count towards stats or leaderboard</p>
          </div>
          <button
            className={`toggle-btn ${practice ? 'toggle-on' : ''}`}
            onClick={() => setPractice((v: boolean) => !v)}
          >
            {practice ? 'On' : 'Off'}
          </button>
        </div>
      </div>

      <button disabled={!canStart} onClick={() => {
        const gs = { mode, team1, team2, difficulty, legs, practice };
        saveSetup({ route: ROUTES.CRICKET_SETUP, gameState: gs });
        goto(ROUTES.CRICKET_GAME, { state: gs }, 'long');
      }}>
        Start Game
      </button>
      <button className="secondary" onClick={() => goto(state?._from === 'hub' ? ROUTES.HOME : ROUTES.PLAY)}>
        Back
      </button>
    </div>
  );
}
