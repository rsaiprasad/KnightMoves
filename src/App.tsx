import { useState } from 'react';
import './App.css'
import { ChessGround } from './components/ChessGround';

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <h1>Knight Moves</h1>
      <ChessGround />
    </div>
  )
}

export default App
