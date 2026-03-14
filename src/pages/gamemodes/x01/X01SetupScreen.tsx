import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '@dnd-kit/sortable';
import { useProfilesStore } from '../../../store/profilesStore';
import SortablePlayer from '../../../components/shared/SortablePlayer';
import StepToggle from '../../../components/shared/StepToggle';
import { ROUTES } from '../../../constants';
import type { Profile, X01Variant } from '../../../types';

type Mode = 'players' | 'cpu';
type Legs = 1 | 3 | 5;

export default function X01SetupScreen() {
  const navigate = useNavigate();
  const { profiles, activeProfileId } = useProfilesStore();

  const activeProfile = profiles.find((p) => p.id === activeProfileId);

  const [variant, setVariant] = useState<X01Variant>(501);
  const [mode, setMode] = useState<Mode>('players');
  const [players, setPlayers] = useState<Profile[]>(
    activeProfile ? [activeProfile] : []
  );
  const [difficulty, setDifficulty] = useState(15);
  const [legs, setLegs] = useState<Legs>(1);
  const [practice, setPractice] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor));

  const availableToAdd = profiles.filter(
    (p) => !players.find((pl) => pl.id === p.id)
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = players.findIndex((p) => p.id === active.id);
    const newIndex = players.findIndex((p) => p.id === over.id);
    setPlayers(arrayMove(players, oldIndex, newIndex));
  }

  function addPlayer(profile: Profile) {
    setPlayers((prev) => [...prev, profile]);
    setShowAddPlayer(false);
  }

  function removePlayer(id: string) {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  }

  const canStart =
    mode === 'cpu' ? !!activeProfile : players.length >= 2;

  return (
    <div className="page">
      <h2>X01</h2>

      {/* Variant */}
      <div className="option-group">
        <button
          className={variant === 501 ? 'selected' : ''}
          onClick={() => setVariant(501)}
        >
          501
        </button>
        <button
          className={variant === 301 ? 'selected' : ''}
          onClick={() => setVariant(301)}
        >
          301
        </button>
      </div>

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
        <div className="setup-section">
          <p className="section-label">Throw order — drag to reorder</p>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={players.map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              {players.map((p, i) => (
                <SortablePlayer
                  key={p.id}
                  profile={p}
                  isActive={p.id === activeProfileId}
                  order={i + 1}
                  onRemove={
                    p.id !== activeProfileId
                      ? () => removePlayer(p.id)
                      : undefined
                  }
                />
              ))}
            </SortableContext>
          </DndContext>

          {availableToAdd.length > 0 && (
            <button
              className="secondary"
              onClick={() => setShowAddPlayer((v) => !v)}
            >
              + Add Player
            </button>
          )}

          {showAddPlayer && (
            <div className="add-player-list">
              {availableToAdd.map((p) => (
                <button key={p.id} className="secondary" onClick={() => addPlayer(p)}>
                  {p.name}
                </button>
              ))}
            </div>
          )}

          {players.length < 2 && (
            <p className="hint">Add at least one more player to start.</p>
          )}
        </div>
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

      {/* Practice */}
      <div className="setup-section">
        <div className="practice-toggle">
          <div>
            <p className="section-label">Practice Mode</p>
            <p className="hint">Won't count towards stats or leaderboard</p>
          </div>
          <button
            className={`toggle-btn ${practice ? 'toggle-on' : ''}`}
            onClick={() => setPractice((v) => !v)}
          >
            {practice ? 'On' : 'Off'}
          </button>
        </div>
      </div>

      <button disabled={!canStart} onClick={() => navigate(ROUTES.X01_GAME, { state: { variant, mode, players, difficulty, legs, practice } })}>
        Start Game
      </button>
      <button className="secondary" onClick={() => navigate(ROUTES.GAMEMODES)}>
        Back
      </button>
    </div>
  );
}
