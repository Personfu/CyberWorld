'use client';
import * as React from 'react';
import dynamic from 'next/dynamic';

const CyberWorldEngine = dynamic(() => import('@/components/game/Engine'), {
    ssr: false,
    loading: () => <p style={{fontFamily: 'var(--font-vt323)', fontSize: '24px', color: 'var(--cyber-cyan)'}}>INITIALIZING LINK...</p>
});

export default function Page() {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [time, setTime] = React.useState('12:00 PM');
  
  const [chatLog, setChatLog] = React.useState([
    { sender: 'Agent_Zero', color: 'var(--cyber-blue)', text: 'Anyone know how to decrypt the firewall in Sector 4?' },
    { sender: 'FLLC_Admin', color: 'var(--cyber-blue)', text: 'Mission directive Alpha-9 is live. Report to Sector 4.' },
    { sender: 'Preston', color: 'var(--cyber-green)', text: 'Uplink secured. System operations authorized.' }
  ]);
  const [chatInput, setChatInput] = React.useState('');
  const chatBottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    if (chatBottomRef.current) chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog]);

  const handlePlayClick = () => setIsPlaying(true);
  
  const sendChat = () => {
    if (chatInput.trim() !== '') {
        setChatLog(prev => [...prev, { sender: 'You', color: '#ff00ff', text: chatInput }]);
        setChatInput('');
    }
  };

  return (
    <>
      <div id="crt-filter"></div>

      <div id="desktop">
          <div className="icon">
              <img src="https://win98icons.alexmeub.com/icons/png/world-0.png" alt="World" />
              <br/>CyberWorld MMO
          </div>
          <div className="icon" onClick={() => window.open('https://fllc.net', '_blank')}>
              <img src="https://win98icons.alexmeub.com/icons/png/network_internet_pcs_pc-0.png" alt="Network" />
              <br/>FLLC.net
          </div>
          <div className="icon" onClick={() => window.open('https://github.com/Personfu', '_blank')}>
              <img src="https://win98icons.alexmeub.com/icons/png/directory_open_file_mydocs.png" alt="Repos" />
              <br/>Mission_Source
          </div>
      </div>

      <div className="window">
          <div className="title-bar">
              <span>FURIOS-INT Browser v4.0 - CYBERWORLD ENTRY PORTAL</span>
              <div className="title-controls">
                  <button onClick={() => window.location.reload()}>↺</button>
                  <button>_</button><button>□</button><button>X</button>
              </div>
          </div>
          
            <div className="toolbar" style={{ fontSize: '10px', padding: '2px 0', minHeight: '18px', background: '#e0e0e0', borderBottom: '1px solid #b0b0b0' }}>
              <span style={{ marginRight: 8 }}><u>F</u>ile</span>
              <span style={{ marginRight: 8 }}><u>E</u>dit</span>
              <span style={{ marginRight: 8 }}><u>V</u>iew</span>
              <span style={{ marginRight: 8 }}><u>S</u>ecurity</span>
              <span style={{ marginRight: 8 }}><u>H</u>elp</span>
              <span style={{ marginLeft: 16, color: '#444' }}>Address:</span>
              <input style={{ fontSize: '10px', width: 260, marginLeft: 4, marginRight: 2, padding: '1px 4px', border: '1px solid #bbb', background: '#fff' }} type="text" value="https://personfu.github.io/cyberworld/mmo" readOnly />
              <button style={{ fontSize: '10px', padding: '0 8px', height: 18 }}>Go</button>
            </div>

          <div className="browser-content">
              {!isPlaying && (
                <div className="flex flex-col items-center py-8">
                  <h1 className="text-4xl font-black text-[#000080] mb-2 tracking-tighter">CYBERWORLD</h1>
                  <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.3em] font-black">Preston Furulie Presents</p>
                </div>
              )}
              
              <div className="game-frame" style={isPlaying ? { width: '100%', height: '100%', border: 'none' } : {}}>
                  {!isPlaying && (
                    <div className="flex justify-between items-center bg-[#c0c0c0] border-b-2 border-white px-4 py-2">
                       <div className="text-[11px] font-black uppercase text-[#000080] italic">Operation: STORMCORE</div>
                       <div className="text-[10px] font-mono text-green-700">STATUS: READY_FOR_UPLINK</div>
                    </div>
                  )}
                  
                  <div className="isometric-canvas" style={{ margin: isPlaying ? 0 : '10px', border: isPlaying ? 'none' : '' }}>
                      {!isPlaying ? (
                          <div className="flex flex-col items-center justify-center h-full space-y-4">
                             <div className="text-xs text-center max-w-sm font-sans font-bold text-gray-700 italic px-4">
                                "The definitive MMORPG for the modern operative. Explore sectors, battle rogue daemons, and claim your node in the mesh."
                             </div>
                             <button className="btn-play mt-4 !px-8 !py-4" onClick={handlePlayClick}>UPLINK_TO_GRID.EXE</button>
                             <div className="text-[9px] text-[#808080] font-black uppercase">Authoritative Node: Personfu-Primary</div>
                          </div>
                      ) : (
                          <CyberWorldEngine />
                      )}
                  </div>

                  {!isPlaying && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      <div className="chat-widget">
                          <div className="game-title" style={{fontSize: '11px', background: '#000080', padding: '2px 8px'}}>MISSION_COMMS [LIVE]</div>
                          <div className="chat-log" id="chat-log" style={{height: '150px'}}>
                              {chatLog.map((chat, idx) => (
                                  <div key={idx} className="mb-1">
                                      <span style={{color: chat.color, fontWeight: 'bold'}}>[{chat.sender}]:</span> {chat.text}
                                  </div>
                              ))}
                              <div ref={chatBottomRef} />
                          </div>
                          <div className="chat-input" style={{padding: '4px'}}>
                              <input 
                                  type="text" 
                                  value={chatInput} 
                                  onChange={e => setChatInput(e.target.value)} 
                                  onKeyDown={e => e.key === 'Enter' && sendChat()} 
                                  placeholder="Type secure message..." 
                                  className="!bg-white !text-black"
                              />
                              <button onClick={sendChat}>✓</button>
                          </div>
                      </div>

                      {/* GAMEPLAY STEPS, LORE, ACHIEVEMENTS, SECTOR PREVIEW */}
                      <div className="chat-widget" style={{ background: '#181818', color: '#00ffcc', fontFamily: 'monospace', fontSize: '12px', border: '2px solid #00ffcc', borderRadius: 6, minHeight: 340, padding: 12, display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 600, overflowY: 'auto' }}>
                                                <div style={{ fontWeight: 'bold', fontSize: 13, margin: '4px 0 2px', color: '#ffeb3b' }}>NEWS & EVENTS</div>
                                                <ul style={{ marginLeft: 16, marginBottom: 2, fontSize: 11, color: '#fffbe7' }}>
                                                  <li>🔥 <b>Patch 2.6:</b> LAN Valley expanded! New daemons and loot.</li>
                                                  <li>🕵️‍♂️ <b>Event:</b> "Operation Blackout" live this weekend!</li>
                                                  <li>⚡ <b>Notice:</b> Server maintenance 04/15 02:00 UTC.</li>
                                                </ul>

                                                <div style={{ fontWeight: 'bold', fontSize: 13, margin: '4px 0 2px', color: '#00e8ff' }}>FEATURED OPERATIVE</div>
                                                <div style={{ background: '#003344', borderRadius: 3, padding: '4px 8px', fontSize: 11, color: '#fff' }}>
                                                  <b>Agent_Zero</b> — "First to breach the Stormcore firewall!"
                                                </div>

                                                <div style={{ fontWeight: 'bold', fontSize: 13, margin: '4px 0 2px', color: '#00ff41' }}>QUICK START GUIDE</div>
                                                <ol style={{ marginLeft: 16, marginBottom: 2, fontSize: 11, color: '#eaffd0' }}>
                                                  <li>Click <b>Start Game</b> to uplink.</li>
                                                  <li>Use chat to ask for help or form a team.</li>
                                                  <li>Explore sectors and defeat daemons for loot.</li>
                                                  <li>Open your inventory and skill tree to upgrade.</li>
                                                  <li>Complete daily challenges for rewards!</li>
                                                </ol>

                                                <div style={{ fontWeight: 'bold', fontSize: 13, margin: '4px 0 2px', color: '#ff4081' }}>GLOBAL STATS</div>
                                                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11, color: '#fff' }}>
                                                  <div>🟢 <b>Players Online:</b> 1,204</div>
                                                  <div>👾 <b>Daemons Defeated:</b> 8,392</div>
                                                  <div>🌐 <b>Sectors Unlocked:</b> 17</div>
                                                  <div>🏆 <b>Top Operative:</b> Agent_Zero</div>
                                                </div>
                        <div style={{ fontWeight: 'bold', fontSize: 13, marginBottom: 2 }}>GAME OBJECTIVES</div>
                        <ol style={{ marginLeft: 16, marginBottom: 4 }}>
                          <li>Uplink to the grid</li>
                          <li>Explore sectors and nodes</li>
                          <li>Battle rogue daemons</li>
                          <li>Collect items and upgrades</li>
                          <li>Unlock new skills and sectors</li>
                          <li>Compete with other operatives</li>
                        </ol>
                        <div style={{ fontWeight: 'bold', fontSize: 13, margin: '4px 0 2px' }}>CYBERWORLD LORE</div>
                        <div style={{ fontSize: 11, color: '#aaffee', marginBottom: 2 }}>
                          In 2044, the world is a mesh of rogue AIs, encrypted sectors, and digital operatives. Only the best can claim a node in the grid. Will you rise to the top, or be lost in the datastream?
                        </div>
                        <div style={{ fontWeight: 'bold', fontSize: 13, margin: '4px 0 2px' }}>ACHIEVEMENTS</div>
                        <ul style={{ marginLeft: 16, marginBottom: 2, fontSize: 11 }}>
                          <li>🟢 First Uplink</li>
                          <li>🔵 Sector Explorer</li>
                          <li>🟣 Daemon Slayer</li>
                          <li>🟡 Node Tycoon</li>
                          <li>🔴 Top Operative</li>
                        </ul>
                        <div style={{ fontWeight: 'bold', fontSize: 13, margin: '4px 0 2px' }}>SECTOR PREVIEW</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', fontSize: 11 }}>
                          <div style={{ background: '#003344', padding: '4px 8px', borderRadius: 3 }}>🌐 Mainframe</div>
                          <div style={{ background: '#222244', padding: '4px 8px', borderRadius: 3 }}>🛡️ LAN Valley</div>
                          <div style={{ background: '#440044', padding: '4px 8px', borderRadius: 3 }}>🕳️ Darknet Depths</div>
                          <div style={{ background: '#444400', padding: '4px 8px', borderRadius: 3 }}>⚡ Stormcore</div>
                        </div>
                        <div style={{ fontWeight: 'bold', fontSize: 13, margin: '4px 0 2px' }}>QUICK ACTIONS</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button style={{ fontSize: 11, padding: '2px 8px', background: '#00ffcc', color: '#000', border: 'none', borderRadius: 3, cursor: 'pointer', transition: 'background 0.2s', boxShadow: '0 1px 4px #00ffcc44' }} onMouseOver={e => e.currentTarget.style.background='#00e8ff'} onMouseOut={e => e.currentTarget.style.background='#00ffcc'} onClick={handlePlayClick}>▶ Start Game</button>
                          <button style={{ fontSize: 11, padding: '2px 8px', background: '#222', color: '#00ffcc', border: '1px solid #00ffcc', borderRadius: 3, cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background='#003344'} onMouseOut={e => e.currentTarget.style.background='#222'} onClick={() => alert('Feature coming soon!')}>🏆 Leaderboard</button>
                          <button style={{ fontSize: 11, padding: '2px 8px', background: '#222', color: '#00ffcc', border: '1px solid #00ffcc', borderRadius: 3, cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background='#003344'} onMouseOut={e => e.currentTarget.style.background='#222'} onClick={() => alert('Feature coming soon!')}>🎒 Inventory</button>
                          <button style={{ fontSize: 11, padding: '2px 8px', background: '#222', color: '#00ffcc', border: '1px solid #00ffcc', borderRadius: 3, cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background='#003344'} onMouseOut={e => e.currentTarget.style.background='#222'} onClick={() => alert('Feature coming soon!')}>🌲 Skill Tree</button>
                        </div>
                        <div style={{ marginTop: 6, fontSize: 11, color: '#aaa' }}>
                          <span style={{ color: '#00ffcc' }}>Tip:</span> Use the chat to coordinate with other operatives!
                        </div>
                        <div style={{ marginTop: 6, fontSize: 11, color: '#ffeb3b', background: '#222', borderRadius: 3, padding: '4px 8px', fontWeight: 'bold' }}>
                          Daily Challenge: Defeat 3 rogue daemons in LAN Valley for a bonus reward!
                        </div>
                        <div style={{ marginTop: 6, fontSize: 11, color: '#00e8ff', background: '#111', borderRadius: 3, padding: '4px 8px' }}>
                          <span style={{ color: '#00ffcc', fontWeight: 'bold' }}>Sector Tip:</span> "Stormcore is most active at night. Bring extra RAM!"
                        </div>
                      </div>
                    </div>
                  )}
              </div>
          </div>
      </div>

      <div id="taskbar">
          <div className="start-btn">⊞ Start</div>
          <div style={{ marginLeft: '10px', border: '2px inset var(--win-light)', padding: '3px 10px', fontSize: '11px', background: '#e0e0e0', color: 'black', fontWeight: 'bold' }}>CyberWorld v4.0</div>
          <div style={{ flex: 1 }}></div>
          <div id="clock" style={{ border: '2px inset var(--win-light)', padding: '3px 15px', fontSize: '11px', color: 'black', background: '#c0c0c0', fontWeight: 'bold' }}>{time}</div>
      </div>
    </>
  );
}
