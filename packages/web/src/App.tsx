import { useEffect, useState } from 'react';
import { Link, NAVIGATE_EVENT } from './Link';
import { matchRoute } from './router';

const MODES = [
  { name: 'GM', blurb: 'Build and run a franchise.' },
  { name: 'Career', blurb: 'Play one player from draft to legend.' },
  { name: 'Dynasty', blurb: 'Collect cards and build a super team.' },
];

function Home() {
  return (
    <main className="page">
      <h1>True Shot</h1>
      <ul className="tiles">
        {MODES.map((mode) => (
          <li key={mode.name}>
            <button type="button" className="tile" disabled>
              <span className="tile-name">{mode.name}</span>
              <span className="tile-blurb">{mode.blurb}</span>
              <span className="tile-soon">Coming soon</span>
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}

const GALLERY_SECTIONS = ['Cards', 'Portraits', 'Animations', 'Save system'];

function DevGallery() {
  return (
    <main className="page">
      <h1>Dev gallery</h1>
      <Link to="/">Back to home</Link>
      {GALLERY_SECTIONS.map((title) => (
        <section key={title} className="gallery-section">
          <h2>{title}</h2>
          <p>Nothing here yet.</p>
        </section>
      ))}
    </main>
  );
}

function NotFound() {
  return (
    <main className="page">
      <h1>Page not found</h1>
      <Link to="/">Go to home</Link>
    </main>
  );
}

export function App() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const update = () => setPath(window.location.pathname);
    window.addEventListener(NAVIGATE_EVENT, update);
    window.addEventListener('popstate', update);
    return () => {
      window.removeEventListener(NAVIGATE_EVENT, update);
      window.removeEventListener('popstate', update);
    };
  }, []);

  const route = matchRoute(path);
  if (route === 'home') return <Home />;
  if (route === 'dev') return <DevGallery />;
  return <NotFound />;
}
