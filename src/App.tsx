import { useState } from 'react';
import './App.css'
import { ChessGround } from './components/ChessGround';

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <ChessGround />
    </div>
  )
}

export default App
