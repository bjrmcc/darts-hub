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
} from '@dnd-kit/sortable';
import { useProfilesStore } from '../../../store/profilesStore';
import SortablePlayer from '../../../components/shared/SortablePlayer';
import StepToggle from '../../../components/shared/StepToggle';
import PlayerPicker from '../../../components/shared/PlayerPicker';
import { ROUTES } from '../../../constants';
import type { Profile, X01Variant } from '../../../types';

type Mode = 'players' | 'cpu';
type Legs = 1 | 3 | 5;

export default function X01SetupScreen() {
  const goto = useGoto();
  const saveSetup = useLastSetupStore((s) => s.save);
  const { state } = useLocation();
  const { profiles, activeProfileId } = useProfilesStore();

  const activeProfile = profiles.find((p) => p.id === activeProfileId);

  const [variant, setVariant] = useState<X01Variant>(state?.variant ?? 501);
  const [mode, setMode] = useState<Mode>(state?.mode ?? 'players');
  const [players, setPlayers] = useState<Profile[]>(
    state?.players ?? (activeProfile ? [activeProfile] : [])
  );
  const [difficulty, setDifficulty] = useState(state?.difficulty ?? 15);
  const [legs, setLegs] = useState<Legs>(state?.legs ?? 1);
  const [doubleIn, setDoubleIn] = useState(state?.doubleIn ?? false);
  const [doubleOut, setDoubleOut] = useState(state?.doubleOut ?? true);
  const [practice, setPractice] = useState(state?.practice ?? false);

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
            <PlayerPicker profiles={availableToAdd} onSelect={addPlayer} requireAuth={!practice} />
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

      {/* Double In / Double Out */}
      <div className="setup-section">
        <p className="section-label">Rules</p>
        <div className="practice-toggle">
          <div>
            <p className="section-label">Double In</p>
            <p className="hint">Must hit a double to start scoring</p>
          </div>
          <button
            className={`toggle-btn ${doubleIn ? 'toggle-on' : ''}`}
            onClick={() => setDoubleIn((v: boolean) => !v)}
          >
            {doubleIn ? 'On' : 'Off'}
          </button>
        </div>
        <div className="practice-toggle">
          <div>
            <p className="section-label">Double Out</p>
            <p className="hint">Must finish on a double</p>
          </div>
          <button
            className={`toggle-btn ${doubleOut ? 'toggle-on' : ''}`}
            onClick={() => setDoubleOut((v: boolean) => !v)}
          >
            {doubleOut ? 'On' : 'Off'}
          </button>
        </div>
      </div>

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
            onClick={() => setPractice((v: boolean) => !v)}
          >
            {practice ? 'On' : 'Off'}
          </button>
        </div>
      </div>

      <button disabled={!canStart} onClick={() => {
        const gs = { variant, mode, players, difficulty, legs, doubleIn, doubleOut, practice };
        saveSetup({ route: ROUTES.X01_SETUP, gameState: gs });
        goto(ROUTES.X01_GAME, { state: gs }, 'long');
      }}>
        Start Game
      </button>
      <button className="secondary" onClick={() => goto(state?._from === 'hub' ? ROUTES.HOME : ROUTES.PLAY)}>
        Back
      </button>
    </div>
  );
}
