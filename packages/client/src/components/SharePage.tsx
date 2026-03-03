import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ShareService, type ShareInfo } from '../services/shareService';
import ExcalidrawEditor from './ExcalidrawEditor';
import Loader from './Loader';
import '../styles/SharePage.scss';
import logger from '../utils/logger';

const SharePage = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const [shareInfo, setShareInfo] = useState<ShareInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shareId) return;

    const fetchShareInfo = async () => {
      try {
        setIsLoading(true);
        const info = await ShareService.getShareInfo(shareId);
        setShareInfo(info);
      } catch (err) {
        setError('Share link not found or has been removed.');
        logger.error('Error fetching share info:', err, true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShareInfo();
  }, [shareId]);

  if (isLoading) {
    return (
      <div className="share-page loading">
        <Loader message="Loading shared board..." />
      </div>
    );
  }

  if (error || !shareInfo || !shareId) {
    return (
      <div className="share-page error">
        <div className="error-container">
          <h2>Unable to load shared board</h2>
          <p>{error || 'Invalid share link.'}</p>
        </div>
      </div>
    );
  }

  const isReadOnly = shareInfo.permission === 'readonly';

  return (
    <div className="share-page">
      <div className="share-header">
        <span className="share-board-name">{shareInfo.name}</span>
        {isReadOnly && <span className="share-badge">Read-only</span>}
      </div>
      <div className="editor-container">
        <ExcalidrawEditor
          key={shareId}
          shareId={shareId}
          readOnly={isReadOnly}
        />
      </div>
    </div>
  );
};

export default SharePage;
