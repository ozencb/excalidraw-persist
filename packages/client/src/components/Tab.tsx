import { Link } from 'react-router-dom';
import { Board } from '../types/types';
import { useBoardContext } from '../contexts/BoardProvider';
import '../styles/Tab.scss';
import Icon from './Icon';

interface TabProps {
  board: Board;
  activeBoardId: string | undefined;
}

const Tab = ({ board, activeBoardId }: TabProps) => {
  const { handleRenameBoard, handleArchiveBoard } = useBoardContext();

  const isActive = board.id === activeBoardId;

  return (
    <Link
      key={board.id}
      to={`/board/${board.id}`}
      className={`tab ${isActive ? 'active' : ''}`}
      aria-current={isActive ? 'page' : undefined}
    >
      <label htmlFor={`board-name-input-${board.id}`} className="visually-hidden">
        Board Name
      </label>
      <input
        type="text"
        id={`board-name-input-${board.id}`}
        className="tab-name"
        value={board.name}
        onChange={e => handleRenameBoard(board.id, e.target.value)}
        aria-label={`Edit name for board ${board.name}`}
        readOnly={!isActive}
      />
      {isActive && (
        <button
          className="close-tab-button"
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            handleArchiveBoard(board.id);
          }}
          aria-label={`Archive board ${board.name}`}
        >
          <Icon name="close" />
        </button>
      )}
    </Link>
  );
};

export default Tab;
