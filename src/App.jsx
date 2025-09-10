import { useState } from "react";
import "./App.css";
import GameSearch from './GameSearch';
import { HashRouter as Router } from 'react-router-dom';

function App() {
  return (
    <div className="App">
      <GameSearch />
    </div>
  );
}

export default App;
