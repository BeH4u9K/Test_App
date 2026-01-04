import { Routes, Route } from 'react-router-dom'; // ← Добавить импорт
import Home from './FIcon';



function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  )
}

export default App