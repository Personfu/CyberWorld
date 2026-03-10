import * as React from 'react';
import styles from './cyber.module.css';

export default function Page() {
  const [GameComponent, setGameComponent] = React.useState<any>(null);

  React.useEffect(() => {
    import('./GameComponent').then((mod) => {
      setGameComponent(() => mod.default);
    });
  }, []);

  return (
    <main className={styles.container}>
      <h1 className={styles.terminalHeader}>CYBERWORLD TERMINAL</h1>
      <div className={styles.gameContainer}>
        {GameComponent ? <GameComponent /> : <p>INITIALIZING LINK...</p>}
      </div>
    </main>
  );
}
