-- CYBERWORLD MMORPG SUPABASE ARCHITECTURE
-- Phase 3: Auth, State, and Threat Intelligence Seeding

-- 1. Profiles (Auth Extension)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." 
  ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." 
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Character State (Persistent Entity Locations)
CREATE TABLE public.character_state (
  id UUID REFERENCES public.profiles(id) PRIMARY KEY,
  x_coord FLOAT DEFAULT 200.0,
  y_coord FLOAT DEFAULT 200.0,
  level INT DEFAULT 1,
  health INT DEFAULT 100,
  credits BIGINT DEFAULT 0,
  inventory JSONB DEFAULT '[]'::jsonb,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.character_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own character state." 
  ON public.character_state FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own character state." 
  ON public.character_state FOR UPDATE USING (auth.uid() = id);

-- 3. Threat Intelligence (2026 Adversary DB)
CREATE TABLE public.threat_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faction VARCHAR(100) NOT NULL,
  tier VARCHAR(50) NOT NULL,
  origin VARCHAR(255),
  primary_name VARCHAR(255) NOT NULL UNIQUE,
  aliases TEXT,
  deadliness VARCHAR(50),
  description TEXT,
  base_level INT DEFAULT 1,
  base_hp INT DEFAULT 100
);
ALTER TABLE public.threat_intelligence ENABLE ROW LEVEL SECURITY;
-- MMs and Clients can ONLY read Threat Data. Server updates it via Service Key.
CREATE POLICY "Authenticated users can read threat intell." 
  ON public.threat_intelligence FOR SELECT TO authenticated USING (true);


-- ==========================================
-- MASSIVE 2026 ADVERSARY SEEDING (COMPRESSED / OPTIMIZED)
INSERT INTO public.threat_intelligence(faction,tier,origin,primary_name,aliases,deadliness,description,base_level,base_hp) VALUES
('Spider','High','Russia/Eastern Europe','BITWISE SPIDER','LockBitSupp, Fox William Mulder, Syrphid','Extreme','Apex predator of RaaS, targeting 44 industries.',90,50000),
('Spider','High','Unknown','REVENANT SPIDER','Stinkbug, Agenda, Qilin','Extreme','Highly sophisticated rust-based payloads.',88,45000),
('Spider','High','Russia/Eastern Europe','GRACEFUL SPIDER','Snakefly, FIN11, Clop','High','Masters of zero-day mass exploitation.',85,40000),
('Spider','High','Russia/Eastern Europe','BRAIN SPIDER','8BASE, Phobos, REDTEAMDR','High','Relentless and noisy, hits 34 industries.',82,35000),
('Spider','High','Russia/Eastern Europe','TRAVELING SPIDER','GOLD MANSARD, Nokoyawa','High','Broad global reach known for aggressive negotiation.',80,32000),
('Spider','Mid','Unknown','HOOK SPIDER','pirat, Pirat-Networks, Big-Bro','High Volume','Wide net spanning 66 countries.',65,15000),
('Spider','Mid','Unknown','PUNK SPIDER','Akira, Storm-1567','Highly Lethal','Lethal against Cisco VPNs and VMware.',68,18000),
('Spider','Mid','Unknown','RECESS SPIDER','PlayCrypt, PLAY','Double Extortion','Focuses on custom exfiltration tools.',64,14000),
('Spider','Mid','Unknown','VICE SPIDER','Vanilla Tempest, Rhysida','Notorious','Targets healthcare and education sectors.',70,20000),
('Spider','Mid','Unknown','FROZEN SPIDER','Medusa','Aggressive','Public shaming and data leaks.',67,17500),
('Spider','Mid','Unknown','MASKED SPIDER','BianLian, PEAR','Pure Extortion','Shifted from encryption to pure data extortion.',60,13000),
('Spider','Mid','Russia/Eastern Europe','ROYAL SPIDER','Royal, BlackSuit','Organized','Utilizing custom intermittent encryption.',72,21000),
('Spider','Mid','Russia/Eastern Europe','INDRIK SPIDER','Dridex, EvilCorp','Legacy Heavyweight','Embedded in banking trojans.',75,25000),
('Spider','Mid','Unknown','TUNNEL SPIDER','Storm-0216','Significant','Threat vector for initial access via exploit chains.',63,13500),
('Spider','Mid','Unknown','LIGHTNING SPIDER','Apolog, Satacom','Wide Dist','Wide distribution via malicious extensions.',61,12000),
('Spider','Mid','Unknown','SPRITE SPIDER','Target777, PyXie','Targeted','Customized attacks against high-value networks.',69,19000),
('Spider','Mid','Unknown','WARLOCK SPIDER','Storm-2603','Consistent','Mid-tier RaaS affiliate with consistent tempo.',66,16000),
('Spider','Mid','Unknown','SCION SPIDER','','Broad','Broad targeting (22 industries).',55,10000),
('Spider','Mid','Russia/Eastern Europe','CURLY SPIDER','Storm-1811','Specialized','Specialized extortion operations.',56,10500),
('Spider','Mid','Unknown','SLY SPIDER','','Widespread','Widespread impact (40 countries).',58,11000),
('Spider','Low','Russia/Eastern Europe','RENAISSANCE SPIDER','UAC-0050','State Disruption','Blends eCrime with state-aligned disruption.',45,8000),
('Spider','Low','Russia/Eastern Europe','CHATTY SPIDER','Luna Moth','Pure Extortion','Callback phishing and pure extortion.',38,6000),
('Spider','Low','Russia/Eastern Europe','SCULLY SPIDER','DanaBot','MaaS','Malware-as-a-Service provider.',42,7500),
('Spider','Low','Brazil/South America','PLUMP SPIDER','','Localized','Localized banking trojans.',35,5000),
('Spider','Low','Colombia/South America','BLIND SPIDER','Blind Eagle','Regional','Regional focus utilizing commodity RATs.',36,5200),
('Spider','Low','Brazil/South America','ODYSSEY SPIDER','TA558','Targeted','Hospitality sector targeting.',34,4800),
('Spider','Low','Brazil/South America','SAMBA SPIDER','','Regional','Regional financial targeting.',33,4500),
('Spider','Low','Nigeria/West Africa','AVIATOR SPIDER','TA2541','Targeted','Aviation and transport sector phishing.',37,5500),
('Spider','Low','Unknown','IMPOSTER SPIDER','SocGholish','High Volume','Initial access via compromised sites.',40,7000),
('Spider','Low','Unknown','COOKIE SPIDER','AMOS','Stealer','macOS specific credential and crypto harvesting.',44,7800),
('Spider','Low','Unknown','HAZARD SPIDER','Amadey','Distributor','Botnet and infostealer distribution.',41,7200),
('Spider','Low','Unknown','DEMON SPIDER','Matanbuchus','Loader','Malware loader used by other affiliates.',43,7600),
('Bear','High','Russia/Eastern Europe','COZY BEAR','APT29, NOBELIUM','Extreme','Ultimate stealth operators, masters of supply chain.',95,60000),
('Bear','High','Russia/Eastern Europe','FANCY BEAR','APT28, Sofacy','Extreme','Aggressive intelligence gatherers.',94,58000),
('Bear','High','Russia/Eastern Europe','VENOMOUS BEAR','Turla, Uroboros','Extreme','Utilizes incredibly complex multi-stage malware.',93,57000),
('Bear','High','Russia/Eastern Europe','VOODOO BEAR','Sandworm, BlackEnergy','Destructive','Premier sabotage unit deploying destructive wipers.',99,80000),
('Bear','Mid','Russia/Eastern Europe','GOSSAMER BEAR','SEABORGIUM','High','Relentless tailored spear-phishing.',75,22000),
('Bear','Low','Russia/Eastern Europe','PRIMITIVE BEAR','Gamaredon','Moderate','Rapid tactical intelligence in regional conflicts.',55,12000),
('Chollima','High','North Korea/East Asia','LABYRINTH CHOLLIMA','Lazarus Group','Extreme','Massive financial heists & wiper deployment.',96,65000),
('Chollima','High','North Korea/East Asia','STARDUST CHOLLIMA','APT38','Extreme','Dedicated SWIFT and Crypto heist unit.',92,55000),
('Chollima','Mid','North Korea/East Asia','FAMOUS CHOLLIMA','UNC5342','High','Complex social engineering via fake recruiter profiles.',78,26000),
('Chollima','Mid','North Korea/East Asia','VELVET CHOLLIMA','Kimsuky','High','Strategic intelligence gathering.',76,23000),
('Chollima','Low','North Korea/East Asia','GOLDEN CHOLLIMA','AppleJeus','Moderate','Distributes trojanized crypto trading apps.',50,10000),
('Panda','High','China/East Asia','MUSTANG PANDA','BRONZE PRESIDENT','Extreme','Lightning-fast exploitation of public vulnerabilities.',93,56000),
('Panda','High','China/East Asia','HOLLOW PANDA','','Extreme','Deep-cover intelligence gathering.',91,52000),
('Panda','Mid','China/East Asia','OVERCAST PANDA','','High','Telecommunications sector espionage.',76,24000),
('Panda','Mid','China/East Asia','HORDE PANDA','Sandman APT','High','Targeted focus utilizing Lua-based malware.',74,22000),
('Panda','Low','China/East Asia','VERTIGO PANDA','RedDelta','Moderate','Targets regional NGOs for political monitoring.',54,11000),
('Panda','Low','China/East Asia','VEILED PANDA','','Moderate','Deep cover niche operations.',52,10500),
('Kitten','High','Iran/Middle East','BANISHED KITTEN','Homeland Justice','Extreme','High volume destructor, wiper malware, psy-ops.',89,48000),
('Kitten','High','Iran/Middle East','IMPERIAL KITTEN','APT35, Tortoiseshell','High','Focused on defense industrial base.',85,42000),
('Kitten','Mid','Iran/Middle East','CHARMING KITTEN','APT35, Mint Sandstorm','High','Masters of elaborate long-term social engineering.',74,21000),
('Kitten','Mid','Iran/Middle East','STATIC KITTEN','MuddyWater','High','Huge initial access and espionage hub.',72,20000),
('Kitten','Mid','Iran/Middle East','HAYWIRE KITTEN','Cotton Sandstorm','High','Visible hack-and-leak, election interference.',70,19000),
('Kitten','Low','Iran/Middle East','HYDRO KITTEN','Cyber Av3ngers','Moderate','Critical infrastructure via false-flag hacktivism.',49,9000),
('Jackal','High','Belarus/Eastern Europe','PARTISAN JACKAL','Cyber Partisans','Destructive','Hacktivist collective paralyzing railways.',70,19000),
('Jackal','High','Russia/Eastern Europe','BOUNTY JACKAL','NoName057(16)','DDoS Heavy','Crowdsourced DDoSia collective.',65,16000),
('Jackal','Mid','Palestine/Middle East','RENEGADE JACKAL','Desert Falcons','Hybrid','Blends hacktivism & state espionage.',55,12000),
('Jackal','Low','Unknown','GHOST JACKAL','AnonGhost','Hacktivist','Widespread defacements and leaks.',40,7000),
('Emerging','Mid','India/South Asia','HAZY TIGER','Bitter APT','Regional Focus','Aggressive regional espionage.',60,14000),
('Emerging','Mid','India/South Asia','FABLE TIGER','','Regional Focus','State-aligned intelligence gathering.',58,13500),
('Emerging','Mid','Pakistan/South Asia','MYTHIC LEOPARD','Transparent Tribe','Military Focus','Weaponized documents tailored to defense.',62,15000),
('Emerging','Mid','Belarus/Eastern Europe','UMBRAL BISON','UNC1151','Information Ops','Information ops and credential harvesting.',60,14500),
('Emerging','Low','Egypt/North Africa','WATCHFUL SPHINX','NilePhish','Localized','Precise surveillance targeting domestic rivals.',45,8000);
