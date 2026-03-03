import { useState } from 'react';
import '../styles/Header.scss';
import ArchivePopup from './ArchivePopup';
import SharePopup from './SharePopup';
import Tab from './Tab';
import { useBoardContext } from '../contexts/BoardProvider';
import Icon from './Icon';

const Header = () => {
  const [isArchivePopupOpen, setIsArchivePopupOpen] = useState(false);
  const [isSharePopupOpen, setIsSharePopupOpen] = useState(false);

  const { boards, isLoading, activeBoardId, handleCreateBoard } = useBoardContext();

  if (isLoading) {
    return <div className="tab-bar-loading">Loading boards...</div>;
  }

  return (
    <div className="header">
      <button className="archive-button" onClick={() => setIsArchivePopupOpen(true)}>
        <Icon name="archive" />
      </button>

      <div className="tab-bar">
        {boards.map(board => (
          <Tab key={board.id} board={board} activeBoardId={activeBoardId} />
        ))}
        <button
          onClick={handleCreateBoard}
          className="create-board-button"
          aria-label="Create new board"
        >
          +
        </button>
      </div>

      {activeBoardId && (
        <button className="share-button" onClick={() => setIsSharePopupOpen(true)}>
          <Icon name="share" />
        </button>
      )}

      <ArchivePopup isOpen={isArchivePopupOpen} onClose={() => setIsArchivePopupOpen(false)} />
      {activeBoardId && (
        <SharePopup
          isOpen={isSharePopupOpen}
          onClose={() => setIsSharePopupOpen(false)}
          boardId={activeBoardId}
        />
      )}
    </div>
  );
};

export default Header;
