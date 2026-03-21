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
import MiniDartboard from '../../../components/dartboard/MiniDartboard';
import { ROUTES } from '../../../constants';
import type { Profile } from '../../../types';

type Mode = 'players' | 'cpu';
type Legs = 1 | 3 | 5;

export default function FirstToSetupScreen() {
  const goto = useGoto();
  const saveSetup = useLastSetupStore((s) => s.save);
  const { state } = useLocation();
  const { profiles, activeProfileId } = useProfilesStore();
  const activeProfile = profiles.find((p) => p.id === activeProfileId);

  const [mode, setMode] = useState<Mode>(state?.mode ?? 'players');
  const [players, setPlayers] = useState<Profile[]>(state?.players ?? (activeProfile ? [activeProfile] : []));
  const [difficulty, setDifficulty] = useState(state?.difficulty ?? 15);
  const [legs, setLegs] = useState<Legs>(state?.legs ?? 1);
  const [targetNumber, setTargetNumber] = useState<number | null>(state?.targetNumber ?? null);
  const [targetHits, setTargetHits] = useState(state?.targetHits ?? 10);
  const [practice, setPractice] = useState(state?.practice ?? false);

  const sensors = useSensors(useSensor(PointerSensor));

  const availableToAdd = profiles.filter((p) => !players.find((pl) => pl.id === p.id));

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
    targetNumber !== null &&
    (mode === 'cpu' ? !!activeProfile : players.length >= 2);

  return (
    <div className="page">
      <h2>First To</h2>

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
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={players.map((p) => p.id)} strategy={verticalListSortingStrategy}>
              {players.map((p, i) => (
                <SortablePlayer
                  key={p.id}
                  profile={p}
                  isActive={p.id === activeProfileId}
                  order={i + 1}
                  onRemove={p.id !== activeProfileId ? () => removePlayer(p.id) : undefined}
                />
              ))}
            </SortableContext>
          </DndContext>

          {availableToAdd.length > 0 && (
            <PlayerPicker profiles={availableToAdd} onSelect={addPlayer} requireAuth={!practice} />
          )}
          {players.length < 2 && <p className="hint">Add at least one more player to start.</p>}
        </div>
      )}

      {/* CPU mode */}
      {mode === 'cpu' && (
        <div className="setup-section">
          <p className="section-label">CPU Difficulty</p>
          <StepToggle min={1} max={30} value={difficulty} onChange={setDifficulty} label="Level" />
        </div>
      )}

      {/* Target number — mini dartboard */}
      <div className="setup-section">
        <p className="section-label">
          Target Number{targetNumber !== null ? ` — ${targetNumber === 25 ? 'Bull' : targetNumber}` : ' — tap to select'}
        </p>
        <MiniDartboard selected={targetNumber} onSelect={setTargetNumber} />
      </div>

      {/* Number of hits */}
      <div className="setup-section">
        <p className="section-label">Hits to win</p>
        <StepToggle min={10} max={50} step={5} value={targetHits} onChange={setTargetHits} label="Hits" />
      </div>

      {/* Legs */}
      <div className="setup-section">
        <p className="section-label">Legs</p>
        <div className="option-group">
          {([1, 3, 5] as Legs[]).map((l) => (
            <button key={l} className={legs === l ? 'selected' : ''} onClick={() => setLegs(l)}>
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

      {!targetNumber && <p className="hint">Select a target number on the dartboard.</p>}

      <button
        disabled={!canStart}
        onClick={() => {
          const gs = { mode, players, difficulty, targetNumber, targetHits, legs, practice };
          saveSetup({ route: ROUTES.FIRST_TO_SETUP, gameState: gs });
          goto(ROUTES.FIRST_TO_GAME, { state: gs }, 'long');
        }}
      >
        Start Game
      </button>
      <button className="secondary" onClick={() => goto(state?._from === 'hub' ? ROUTES.HOME : ROUTES.PLAY)}>
        Back
      </button>
    </div>
  );
}
