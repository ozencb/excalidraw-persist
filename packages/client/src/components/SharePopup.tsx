import { useState, useEffect, useRef } from 'react';
import { ShareService, type ShareLink } from '../services/shareService';
import '../styles/SharePopup.scss';
import Icon from './Icon';
import logger from '../utils/logger';

interface SharePopupProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
}

const SharePopup = ({ isOpen, onClose, boardId }: SharePopupProps) => {
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
      fetchLinks();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  const fetchLinks = async () => {
    try {
      setIsLoading(true);
      const data = await ShareService.listShareLinks(boardId);
      setLinks(data);
    } catch (error) {
      logger.error('Error fetching share links:', error, true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLink = async (permission: 'edit' | 'readonly') => {
    try {
      const link = await ShareService.createShareLink(boardId, permission);
      setLinks(prev => {
        const exists = prev.find(l => l.id === link.id);
        if (exists) return prev;
        return [...prev, link];
      });
      copyToClipboard(link.id);
    } catch (error) {
      logger.error('Error creating share link:', error, true);
    }
  };

  const copyToClipboard = (shareId: string) => {
    const url = `${window.location.origin}/share/${shareId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopiedId(shareId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getShareUrl = (shareId: string) => `${window.location.origin}/share/${shareId}`;

  if (!isOpen) return null;

  const editLink = links.find(l => l.permission === 'edit');
  const readonlyLink = links.find(l => l.permission === 'readonly');

  return (
    <div className="share-popup" ref={popupRef}>
      <div className="share-popup-header">
        <h2>Share Board</h2>
        <button className="share-popup-close" onClick={onClose}>
          <Icon name="close" />
        </button>
      </div>
      <div className="share-popup-content">
        {isLoading ? (
          <p className="share-popup-loading">Loading...</p>
        ) : (
          <>
            <div className="share-popup-option">
              <div className="share-popup-option-info">
                <h3>Edit access</h3>
                <p>Anyone with this link can edit</p>
              </div>
              {editLink ? (
                <div className="share-popup-link-row">
                  <span className="share-popup-url">{getShareUrl(editLink.id)}</span>
                  <button
                    className="share-popup-copy-button"
                    onClick={() => copyToClipboard(editLink.id)}
                  >
                    {copiedId === editLink.id ? 'Copied!' : <Icon name="copy" />}
                  </button>
                </div>
              ) : (
                <button
                  className="share-popup-create-button"
                  onClick={() => handleCreateLink('edit')}
                >
                  Create link
                </button>
              )}
            </div>

            <div className="share-popup-option">
              <div className="share-popup-option-info">
                <h3>Read-only access</h3>
                <p>Anyone with this link can view</p>
              </div>
              {readonlyLink ? (
                <div className="share-popup-link-row">
                  <span className="share-popup-url">{getShareUrl(readonlyLink.id)}</span>
                  <button
                    className="share-popup-copy-button"
                    onClick={() => copyToClipboard(readonlyLink.id)}
                  >
                    {copiedId === readonlyLink.id ? 'Copied!' : <Icon name="copy" />}
                  </button>
                </div>
              ) : (
                <button
                  className="share-popup-create-button"
                  onClick={() => handleCreateLink('readonly')}
                >
                  Create link
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SharePopup;
