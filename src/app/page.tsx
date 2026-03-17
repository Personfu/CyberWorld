'use client';
import * as React from 'react';

export default function Page() {
  const [GameComponent, setGameComponent] = React.useState<any>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [time, setTime] = React.useState('12:00 PM');
  
  const [chatLog, setChatLog] = React.useState([
    { sender: 'Agent_Zero', color: 'var(--cyber-blue)', text: 'Anyone know how to decrypt the firewall in Sector 4?' },
    { sender: 'FLLC_Admin', color: 'var(--cyber-blue)', text: 'You need a Premium Elite $50 key to bypass it.' }
  ]);
  const [chatInput, setChatInput] = React.useState('');
  const chatBottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    import('./GameComponent').then((mod) => {
      setGameComponent(() => mod.default);
    });
    
    const interval = setInterval(() => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    if (chatBottomRef.current) {
        chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatLog]);

  const handlePlayClick = () => {
    setIsPlaying(true);
  };
  
  const sendChat = () => {
    if (chatInput.trim() !== '') {
        setChatLog(prev => [...prev, { sender: 'You', color: 'var(--cyber-green)', text: chatInput }]);
        setChatInput('');
    }
  };

  return (
    <>
      <div id="crt-filter"></div>

      <div id="desktop">
          <div className="icon">
              {/* Using a static placeholder icon. Next.js best practice dictates optimizing images, but a direct link is fine for our retro OS look */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://win98icons.alexmeub.com/icons/png/world-0.png" alt="World" />
              <br/>CyberWorld
          </div>
          <div className="icon" onClick={() => window.location.href='https://fllc.net'}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://win98icons.alexmeub.com/icons/png/network_internet_pcs_pc-0.png" alt="Network" />
              <br/>FLLC.net
          </div>
          <div className="icon" onClick={() => window.location.href='https://fllc.net/shop'}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://win98icons.alexmeub.com/icons/png/key_padlock.png" alt="Security" />
              <br/>Auth Keys
          </div>
      </div>

      <div className="window">
          <div className="title-bar">
              <span>CyberWorld - Common Web Browser</span>
              <div className="title-controls">
                  <button>_</button><button>□</button><button>X</button>
              </div>
          </div>
          
          <div className="toolbar">
              <span><u>F</u>ile</span><span><u>E</u>dit</span><span><u>V</u>iew</span><span><u>H</u>elp</span>
          </div>
          
          <div className="toolbar address-bar">
              <span>Address:</span>
              <input type="text" value="http://fllc.net/cyberworld/hub" readOnly />
              <button>Go</button>
          </div>

          <div className="browser-content">
              {!isPlaying && <div className="cw-title">CyberWorld</div>}
              
              <div className="game-frame" style={isPlaying ? { width: '100%', height: '100%', border: 'none' } : {}}>
                  {!isPlaying && <div className="game-title">WELCOME TO CYBERWORLD: ENTERPRISE HUB</div>}
                  
                  <div className="isometric-canvas" style={{ margin: isPlaying ? 0 : 4, border: isPlaying ? 'none' : '' }}>
                      {!isPlaying ? (
                          <button className="btn-play" onClick={handlePlayClick}>PLAY NOW</button>
                      ) : (
                          GameComponent ? <GameComponent /> : <p style={{fontFamily: 'var(--font-vt323)', fontSize: '24px', color: 'var(--cyber-cyan)'}}>INITIALIZING LINK...</p>
                      )}
                  </div>

                  {!isPlaying && (
                    <div className="chat-widget">
                        <div className="game-title" style={{fontSize: '14px', background: 'var(--win-blue)'}}>SECURE CHAT</div>
                        <div className="chat-log" id="chat-log">
                            {chatLog.map((chat, idx) => (
                                <div key={idx}>
                                    <span style={{color: chat.color}}>{chat.sender}:</span> {chat.text}
                                </div>
                            ))}
                            <div ref={chatBottomRef} />
                        </div>
                        <div className="chat-input">
                            <input 
                                type="text" 
                                value={chatInput} 
                                onChange={e => setChatInput(e.target.value)} 
                                onKeyDown={e => e.key === 'Enter' && sendChat()} 
                                placeholder="Type message..." 
                            />
                            <button onClick={sendChat}>✓</button>
                        </div>
                    </div>
                  )}
              </div>

              {!isPlaying && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '25px', marginBottom: '20px' }}>
                    <button onClick={() => window.location.href='https://fllc.net/shop'} style={{fontFamily: 'var(--font-vt323)', fontSize: '18px', padding: '5px 15px', color: 'black'}}>UPGRADE TIER</button>
                    <button onClick={() => window.location.href='https://fllc.net/solutions'} style={{fontFamily: 'var(--font-vt323)', fontSize: '18px', padding: '5px 15px', color: 'black'}}>IT SOLUTIONS</button>
                </div>
              )}
          </div>
      </div>

      <div id="taskbar">
          <div className="start-btn">⊞ Start</div>
          <div style={{ marginLeft: '10px', border: '2px inset var(--win-light)', padding: '3px 10px', fontSize: '12px', background: '#e0e0e0', color: 'black' }}>CyberWorld Browser</div>
          <div style={{ flex: 1 }}></div>
          <div id="clock" style={{ border: '2px inset var(--win-light)', padding: '3px 10px', fontSize: '12px', color: 'black' }}>{time}</div>
      </div>
    </>
  );
}
