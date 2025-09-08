import React, { useState, useEffect } from "react";
import "./GameSearch.css";

const GameSearch = () => {
  const API_KEY = "9bbfbdab4cc0456295480b0abb8d4b79";

  const [searchQuery, setSearchQuery] = useState("");
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [gameMedia, setGameMedia] = useState({});
  const [selectedGame, setSelectedGame] = useState(null);
  const [gameDetails, setGameDetails] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  const fetchGameData = async (gameId, includeDetails = false) => {
    try {
      const [gameRes, screenshotsRes] = await Promise.all([
        fetch(`https://api.rawg.io/api/games/${gameId}?key=${API_KEY}`),
        fetch(
          `https://api.rawg.io/api/games/${gameId}/screenshots?key=${API_KEY}`
        ),
      ]);

      const [gameData, screenshotsData] = await Promise.all([
        gameRes.json(),
        screenshotsRes.json(),
      ]);

      return {
        backgroundImage: gameData.background_image,
        screenshots: (screenshotsData.results || []).map((s) => s.image),
        ...(includeDetails && {
          description: gameData.description_raw || "Описание отсутствует",
          genres: (gameData.genres || []).map((g) => g.name),
          platforms: (gameData.platforms || []).map((p) => p.platform.name),
        }),
      };
    } catch (err) {
      return {
        backgroundImage: null,
        screenshots: [],
        ...(includeDetails && {
          description: "Не удалось загрузить описание",
          genres: [],
          platforms: [],
        }),
      };
    }
  };

  const loadGames = async (pageNum = 1, isSearch = false) => {
    try {
      setIsLoading(true);
      setError(null);

      const url = isSearch
        ? `https://api.rawg.io/api/games?key=${API_KEY}&search=${encodeURIComponent(
            searchQuery
          )}`
        : `https://api.rawg.io/api/games?key=${API_KEY}&ordering=-rating&page=${pageNum}&page_size=20`;

      const response = await fetch(url);
      const data = await response.json();
      const results = data.results || [];

      const uniqueResults = results.reduce((acc, game) => {
        if (!acc.some((g) => g.id === game.id)) {
          acc.push(game);
        }
        return acc;
      }, []);

      const mediaUpdates = {};
      for (const game of uniqueResults) {
        mediaUpdates[game.id] = await fetchGameData(game.id);
      }

      setGames((prev) => {
        if (isSearch) return uniqueResults;

        const existingIds = new Set(prev.map((g) => g.id));
        const newGames = uniqueResults.filter(
          (game) => !existingIds.has(game.id)
        );
        return [...prev, ...newGames];
      });

      setGameMedia((prev) => ({ ...prev, ...mediaUpdates }));
      setPage(pageNum);
    } catch (err) {
      setError(err.message || "Произошла ошибка");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGames();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setError("Введите название игры");
      return;
    }
    loadGames(1, true);
  };

  const openGameDetails = async (game) => {
    setSelectedGame(game);
    setIsModalOpen(true);
    setIsLoadingDetails(true);
    setModalImageIndex(0);

    const details = await fetchGameData(game.id, true);
    setGameDetails({ ...details, id: game.id });
    setIsLoadingDetails(false);
  };

  const nextModalImage = () => {
    if (!selectedGame || !gameMedia[selectedGame.id]) return;
    const totalImages = gameMedia[selectedGame.id].screenshots.length + 1;
    setModalImageIndex((prev) => (prev + 1) % totalImages);
  };

  const prevModalImage = () => {
    if (!selectedGame || !gameMedia[selectedGame.id]) return;
    const totalImages = gameMedia[selectedGame.id].screenshots.length + 1;
    setModalImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
  };

  const getModalImage = () => {
    if (!selectedGame) return "/placeholder.jpg";
    const media = gameMedia[selectedGame.id];

    if (!media) return selectedGame.background_image || "/placeholder.jpg";
    if (modalImageIndex === 0)
      return media.backgroundImage || "/placeholder.jpg";

    return media.screenshots[modalImageIndex - 1] || "/placeholder.jpg";
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedGame(null);
  };

  const loadMore = () => loadGames(page + 1);
  const handleHomeClick = () => (window.location.href = "/");

  return (
    <>
      <header className="header">
        <button onClick={handleHomeClick} className="home-button">
          <h1>
            Поиск игр <span>Best game</span>
          </h1>
        </button>

        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Например: The Witcher 3"
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading || !searchQuery.trim()}>
            {isLoading ? "Поиск..." : "Найти"}
          </button>
        </form>
      </header>

      <main className="results">
        {error && <div className="error">⚠️ {error}</div>}

        {isLoading && page === 1 ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
          </div>
        ) : (
          <>
            <div className="game-grid">
              {games.map((game) => (
                <article key={game.id} className="game-card">
                  <div className="game-poster">
                    <img
                      src={
                        gameMedia[game.id]?.backgroundImage ||
                        "/placeholder.jpg"
                      }
                      alt={game.name}
                      onError={(e) => (e.target.src = "/placeholder.jpg")}
                    />
                  </div>
                  <div className="game-info">
                    <h3 onClick={() => openGameDetails(game)}>{game.name}</h3>
                    <div className="meta">
                      <span>⭐ {game.rating || "N/A"}</span>
                      <span>🗓 {game.released?.split("-")[0] || "TBA"}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {games.length > 0 && !isLoading && (
              <div className="load-more-container">
                <button onClick={loadMore} className="load-more-button">
                  Загрузить еще
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              &times;
            </button>

            {isLoadingDetails ? (
              <div className="modal-loading">Загрузка деталей...</div>
            ) : (
              <>
                <h2 className="modal-title">{selectedGame?.name}</h2>

                <div className="modal-image-container">
                  <button
                    className="modal-nav-button prev"
                    onClick={prevModalImage}
                  >
                    &lt;
                  </button>
                  <div className="modal-image">
                    <img src={getModalImage()} alt={selectedGame?.name} />
                  </div>
                  <button
                    className="modal-nav-button next"
                    onClick={nextModalImage}
                  >
                    &gt;
                  </button>
                </div>

                <div className="modal-details">
                  <div className="modal-section">
                    <h3>Описание</h3>
                    <p className="modal-description">
                      {gameDetails?.description}
                    </p>
                  </div>

                  <div className="modal-section">
                    <h3>Жанры</h3>
                    <div className="modal-genres">
                      {gameDetails?.genres?.map((genre, i) => (
                        <span key={i} className="genre-tag">
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="modal-section">
                    <h3>Платформы</h3>
                    <div className="modal-platforms">
                      {gameDetails?.platforms?.map((platform, i) => (
                        <span key={i} className="platform-tag">
                          {platform}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default GameSearch;
