import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import BoardPage from './components/BoardPage';
import SharePage from './components/SharePage';
import Loader from './components/Loader';
import { BoardProvider, useBoardContext } from './contexts/BoardProvider';
import { ThemeProvider } from './contexts/ThemeProvider';
import './styles/App.scss';
import '@excalidraw/excalidraw/index.css';

const HomePage = () => {
  const { isLoading, boards } = useBoardContext();

  if (isLoading) {
    return <Loader />;
  }

  if (boards.length === 0) {
    return <div>No boards found</div>;
  }

  return <Navigate to={`/board/${boards[0].id}`} />;
};

const App = () => {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route
            path="/board/:boardId"
            element={
              <BoardProvider>
                <BoardPage />
              </BoardProvider>
            }
          />
          <Route
            path="/"
            element={
              <BoardProvider>
                <HomePage />
              </BoardProvider>
            }
          />
          <Route
            path="/share/:shareId"
            element={<SharePage />}
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
