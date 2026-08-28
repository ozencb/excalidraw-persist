import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BoardService } from '../services/boardService';
import Loader from './Loader';
import logger from '../utils/logger';

/**
 * Deep-link entry point: `/board/name/:name` resolves the name to a board id
 * (find-or-create-by-name) and then hands off to the existing `/board/:boardId`
 * machinery via navigate. It does not re-implement board opening — it only
 * resolves name -> id and redirects into the normal board route.
 */
const BoardByNamePage = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const didResolve = useRef(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (didResolve.current) {
      return;
    }
    if (!name) {
      setError(true);
      return;
    }
    didResolve.current = true;
    BoardService.findOrCreateByName(name)
      .then(board => navigate(`/board/${board.id}`, { replace: true }))
      .catch(err => {
        logger.error(`Failed to open board "${name}":`, err, true);
        setError(true);
      });
  }, [name, navigate]);

  if (error) {
    return (
      <div className="board-page error">
        <div className="error-container">
          <h2>Error: Could not open board</h2>
          <p>Please try again.</p>
        </div>
      </div>
    );
  }

  return <Loader message="Opening board..." />;
};

export default BoardByNamePage;
