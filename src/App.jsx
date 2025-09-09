import { useState } from "react";
import "./App.css";
import GameSearch from './GameSearch';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <div className="App">
      <GameSearch />
    </div>
  );
}

export default App;
