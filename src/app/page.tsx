import * as React from 'react';
export default function Page() {
  const [GameComponent, setGameComponent] = React.useState<any>(null);

  React.useEffect(() => {
    import('./GameComponent').then((mod) => {
      setGameComponent(() => mod.default);
    });
  }, []);

  return (
    <main style={{ backgroundColor: '#000', color: '#0f0', width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      {GameComponent ? <GameComponent /> : <p>Loading CyberWorld Terminal...</p>}
    </main>
  );
}
