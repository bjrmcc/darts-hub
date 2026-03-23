import type { GameInfoContent } from '../../config/gameInfoContent';

interface Props {
  content: GameInfoContent;
  onClose: () => void;
}

export default function InfoModal({ content, onClose }: Props) {
  return (
    <div className="info-overlay" onClick={onClose}>
      <div
        className={`info-modal info-modal--${content.accent}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="info-modal-header">
          <span className={`info-modal-title info-modal-title--${content.accent}`}>
            {content.title}
          </span>
          <button className="info-modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="info-modal-body">
          {content.sections.map(section => (
            <div key={section.heading} className="info-modal-section">
              <p className="info-modal-section-heading">{section.heading}</p>
              <ul className="info-modal-list">
                {section.bullets.map((bullet, i) => (
                  <li key={i} className="info-modal-item">{bullet}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="info-modal-dismiss">Tap anywhere outside to close</p>
      </div>
    </div>
  );
}
