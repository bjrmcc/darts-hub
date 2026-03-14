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
import { ROUTES } from '../../../constants';
import type { Profile } from '../../../types';

export default function PracticeScreen() {
  const navigate = useNavigate();
  const { profiles, activeProfileId } = useProfilesStore();
  const activeProfile = profiles.find((p) => p.id === activeProfileId);

  const [players, setPlayers] = useState<Profile[]>(activeProfile ? [activeProfile] : []);
  const [practice, setPractice] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);

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
    setShowAddPlayer(false);
  }

  function removePlayer(id: string) {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="page">
      <h2>Free Throw</h2>

      <div className="stats-notice">
        <span className="stats-notice-icon">📊</span>
        <p>Results from Free Throw count towards your stats and leaderboard.</p>
      </div>

      {/* Player selection */}
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
          <button className="secondary" onClick={() => setShowAddPlayer((v) => !v)}>
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
      </div>

      {/* Practice toggle */}
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

      <button onClick={() => navigate(ROUTES.HOME)}>
        Start
      </button>
      <button className="secondary" onClick={() => navigate(ROUTES.GAMEMODES)}>
        Back
      </button>
    </div>
  );
}
