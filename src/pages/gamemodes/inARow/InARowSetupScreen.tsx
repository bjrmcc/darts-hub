import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useGoto } from '../../../hooks/useGoto';
import { useInfoModal } from '../../../hooks/useInfoModal';
import { useLastSetupStore } from '../../../store/lastSetupStore';
import InfoModal from '../../../components/shared/InfoModal';
import { GAME_INFO } from '../../../config/gameInfoContent';
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

export default function InARowSetupScreen() {
  const goto = useGoto();
  const saveSetup = useLastSetupStore((s) => s.save);
  const { state } = useLocation();
  const { profiles, activeProfileId } = useProfilesStore();
  const activeProfile = profiles.find((p) => p.id === activeProfileId);

  const { open: infoOpen, manual: infoManual, close: closeInfo, dismiss: dismissInfo, reopen: openInfo } = useInfoModal('inARow', state?._from === 'hub');

  const [mode, setMode] = useState<Mode>(state?.mode ?? 'players');
  const [players, setPlayers] = useState<Profile[]>(state?.players ?? (activeProfile ? [activeProfile] : []));
  const [difficulty, setDifficulty] = useState(state?.difficulty ?? 15);
  const [targetNumber, setTargetNumber] = useState<number | null>(state?.targetNumber ?? null);
  const [visits, setVisits] = useState(state?.visits ?? 10);
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

  const canStart =
    targetNumber !== null &&
    (mode === 'cpu' ? !!activeProfile : players.length >= 2);

  return (
    <div className="page">
      {infoOpen && <InfoModal content={GAME_INFO.inARow} onClose={closeInfo} onDismiss={dismissInfo} showDismiss={!infoManual} />}
      <div className="page-title-row">
        <h2>In a Row</h2>
        <button className="info-btn" onClick={openInfo} aria-label="How to play">ⓘ</button>
      </div>

      {/* Mode */}
      <div className="option-group">
        <button className={mode === 'players' ? 'selected' : ''} onClick={() => setMode('players')}>
          Select Players
        </button>
        <button className={mode === 'cpu' ? 'selected' : ''} onClick={() => setMode('cpu')}>
          vs CPU
        </button>
      </div>

      {/* Players */}
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
                  onRemove={p.id !== activeProfileId ? () => setPlayers((prev) => prev.filter((x) => x.id !== p.id)) : undefined}
                />
              ))}
            </SortableContext>
          </DndContext>
          <PlayerPicker profiles={availableToAdd} onSelect={(p) => setPlayers((prev) => [...prev, p])} requireAuth={!practice} />
          {players.length < 2 && <p className="hint">Add at least one more player to start.</p>}
        </div>
      )}

      {/* CPU difficulty */}
      {mode === 'cpu' && (
        <div className="setup-section">
          <p className="section-label">CPU Difficulty</p>
          <StepToggle min={1} max={30} value={difficulty} onChange={setDifficulty} label="Level" />
        </div>
      )}

      {/* Target number */}
      <div className="setup-section">
        <p className="section-label">
          Target Number{targetNumber !== null ? ` — ${targetNumber === 25 ? 'Bull' : targetNumber}` : ' — tap to select'}
        </p>
        <MiniDartboard selected={targetNumber} onSelect={setTargetNumber} />
      </div>

      {/* Visits */}
      <div className="setup-section">
        <p className="section-label">Visits</p>
        <StepToggle min={5} max={25} step={5} value={visits} onChange={setVisits} label="Visits" />
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
          const gs = { mode, players, difficulty, targetNumber, visits, practice };
          saveSetup({ route: ROUTES.IN_A_ROW_SETUP, gameState: gs });
          goto(ROUTES.IN_A_ROW_GAME, { state: gs }, 'long');
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
