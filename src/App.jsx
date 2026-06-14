import { Routes, Route } from 'react-router-dom';
import Nav      from './components/Nav';
import Home     from './pages/Home';
import Demo     from './pages/Demo';
import Training from './pages/Training';
import Pipeline from './pages/Pipeline';

export default function App() {
  return (
    <>
      <Nav />
      <Routes>
        <Route path="/"         element={<Home />} />
        <Route path="/demo"     element={<Demo />} />
        <Route path="/training" element={<Training />} />
        <Route path="/pipeline" element={<Pipeline />} />
        <Route path="*"         element={<Home />} />
      </Routes>
    </>
  );
}
