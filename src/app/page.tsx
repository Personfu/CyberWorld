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
          
          <div className="toolbar">
              <span><u>F</u>ile</span><span><u>E</u>dit</span><span><u>V</u>iew</span><span><u>S</u>ecurity</span><span><u>H</u>elp</span>
          </div>
          
          <div className="toolbar address-bar">
              <span>Address:</span>
              <input type="text" value="https://personfu.github.io/cyberworld/mmo" readOnly />
              <button>Go</button>
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

                      <div className="chat-widget">
                          <div className="game-title" style={{fontSize: '11px', background: '#800000', padding: '2px 8px'}}>INTEL_ALERTS</div>
                          <div className="chat-log font-mono text-[10px] space-y-2 !bg-black !text-green-500 overflow-y-auto" style={{height: '150px', padding: '8px'}}>
                              <div>[SYSTEM]: New target detected in Sector 4.</div>
                              <div className="text-yellow-500">[WARN]: Unauthorized access detected on node 12.3.4.1</div>
                              <div>[ALPHA]: Team update scheduled for 22:00.</div>
                              <div className="text-red-500">[ALERT]: Breach in LAN Valley firewall.</div>
                              <div>[PRESTON]: Stay sharp, operatives.</div>
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
