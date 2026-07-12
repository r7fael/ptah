"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { InteractiveCityMap } from "./InteractiveCityMap";

type View = "operation" | "incidents" | "alerts" | "sources";
type Message = { id: number; side: "city" | "resident"; text: string; time: string; kind?: "location" | "status" | "photo" };
type Incident = { id: string; area: string; rpa: string; type: string; reports: number; priority: "Crítica" | "Alta" | "Média"; status: "Aberta" | "Em atendimento" | "Concluída"; time: string; lat: number; lon: number; source?: "live" };

const baseIncidents: Incident[] = [
  { id: "PT-2841", area: "Nova Descoberta", rpa: "RPA 3", type: "Movimento de barreira", reports: 12, priority: "Crítica", status: "Em atendimento", time: "há 4 min", lat: -8.007, lon: -34.926 },
  { id: "PT-2837", area: "Dois Unidos", rpa: "RPA 2", type: "Pedido de lona", reports: 8, priority: "Alta", status: "Aberta", time: "há 18 min", lat: -7.997, lon: -34.904 },
  { id: "PT-2829", area: "Vasco da Gama", rpa: "RPA 3", type: "Alagamento", reports: 6, priority: "Alta", status: "Aberta", time: "há 31 min", lat: -8.018, lon: -34.918 },
  { id: "PT-2818", area: "Ibura", rpa: "RPA 6", type: "Risco de deslizamento", reports: 5, priority: "Alta", status: "Em atendimento", time: "há 46 min", lat: -8.12, lon: -34.94 },
  { id: "PT-2804", area: "Afogados", rpa: "RPA 5", type: "Via alagada", reports: 4, priority: "Média", status: "Aberta", time: "há 1h", lat: -8.075, lon: -34.91 },
];

const scenarios = {
  barrier: {
    label: "Barreira cedendo",
    incident: { id: "PT-2901", area: "Alto José Bonifácio", rpa: "RPA 3", type: "Movimento de barreira", reports: 1, priority: "Crítica", status: "Aberta", time: "agora", lat: -8.013, lon: -34.913, source: "live" } as Incident,
    messages: [
      { side: "city", text: "Olá! Você está falando com a Prefeitura do Recife. Qual situação precisa informar?", time: "10:21" },
      { side: "resident", text: "A barreira atrás da minha casa começou a ceder com a chuva.", time: "10:22" },
      { side: "city", text: "Você e sua família estão em um local seguro neste momento?", time: "10:22" },
      { side: "resident", text: "Sim, saímos de casa. Vou mandar a localização.", time: "10:23" },
      { side: "resident", text: "Alto José Bonifácio\nRPA 3 · Recife", time: "10:23", kind: "location" },
      { side: "city", text: "Localização recebida. Identificamos risco de movimento de barreira e abrimos o protocolo PT-2901 com prioridade crítica. Uma equipe foi acionada.", time: "10:24", kind: "status" },
    ] as Omit<Message, "id">[],
  },
  flood: {
    label: "Rua alagada",
    incident: { id: "PT-2902", area: "Imbiribeira", rpa: "RPA 6", type: "Alagamento de via", reports: 1, priority: "Alta", status: "Aberta", time: "agora", lat: -8.108, lon: -34.907, source: "live" } as Incident,
    messages: [
      { side: "city", text: "Olá! Você está falando com a Prefeitura do Recife. Qual situação precisa informar?", time: "16:08" },
      { side: "resident", text: "A água está subindo rápido na rua e já está entrando nas casas.", time: "16:09" },
      { side: "city", text: "Evite atravessar a área alagada. Compartilhe sua localização para verificarmos os relatos próximos.", time: "16:09" },
      { side: "resident", text: "Rua Itajaí, Imbiribeira\nRPA 6 · Recife", time: "16:10", kind: "location" },
      { side: "city", text: "Recebemos sua localização e agrupamos o relato a outros registros da área. O protocolo PT-2902 foi aberto e a equipe regional foi avisada.", time: "16:11", kind: "status" },
    ] as Omit<Message, "id">[],
  },
};

const rpas: Record<string, string[]> = {
  "RPA 1 · Centro": ["Recife", "Santo Amaro", "Boa Vista", "São José"],
  "RPA 2 · Norte": ["Água Fria", "Beberibe", "Dois Unidos", "Linha do Tiro"],
  "RPA 3 · Noroeste": ["Casa Amarela", "Nova Descoberta", "Vasco da Gama", "Alto José Bonifácio"],
  "RPA 4 · Oeste": ["Cordeiro", "Iputinga", "Torrões", "Várzea"],
  "RPA 5 · Sudoeste": ["Afogados", "Areias", "San Martin", "Jardim São Paulo"],
  "RPA 6 · Sul": ["Boa Viagem", "Imbiribeira", "Ibura", "Jordão"],
};

export default function Home() {
  const [view, setView] = useState<View>("operation");
  const [messages, setMessages] = useState<Message[]>([]);
  const [scenarioKey, setScenarioKey] = useState<keyof typeof scenarios | null>(null);
  const [liveIncidents, setLiveIncidents] = useState<Incident[]>([]);
  const [selectedId, setSelectedId] = useState("PT-2841");
  const [isPlaying, setIsPlaying] = useState(false);
  const [resolved, setResolved] = useState<string[]>([]);
  const timers = useRef<number[]>([]);
  const incidents = useMemo(() => [...liveIncidents, ...baseIncidents], [liveIncidents]);
  const selected = incidents.find((item) => item.id === selectedId) ?? incidents[0];

  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  function playScenario(key: keyof typeof scenarios) {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
    const scenario = scenarios[key];
    setScenarioKey(key);
    setMessages([]);
    setIsPlaying(true);
    setLiveIncidents((items) => items.filter((item) => item.id !== scenario.incident.id));
    scenario.messages.forEach((message, index) => {
      const timer = window.setTimeout(() => {
        setMessages((current) => [...current, { ...message, id: Date.now() + index }]);
        if (index === scenario.messages.length - 1) {
          setLiveIncidents((items) => [scenario.incident, ...items.filter((item) => item.id !== scenario.incident.id)]);
          setSelectedId(scenario.incident.id);
          setIsPlaying(false);
        }
      }, 450 + index * 1050);
      timers.current.push(timer);
    });
  }

  function resolveIncident() {
    if (resolved.includes(selected.id)) return;
    setResolved((items) => [...items, selected.id]);
    setMessages((current) => [...current, { id: Date.now(), side: "city", kind: "status", text: `Atualização do protocolo ${selected.id}: a equipe concluiu o atendimento no local. Obrigado por avisar e ajudar a cuidar do Recife.`, time: "agora" }]);
  }

  function openIncident(id: string) { setSelectedId(id); setView("operation"); }

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand"><span className="brand-mark">P</span><div><strong>PTAH</strong><span>Inteligência urbana do Recife</span></div></div>
      <div className="city-status"><i /> Recife conectado · dados atualizados agora</div>
      <div className="operator"><span className="operator-avatar">AC</span><div><strong>Ana Costa</strong><span>Centro de Operações</span></div><button aria-label="Abrir menu">⌄</button></div>
    </header>

    <section className="workspace">
      <Sidebar view={view} setView={setView} total={26 + liveIncidents.length} />
      <div className="content">
        {view === "operation" && <OperationView incidents={incidents} selected={selected} selectedId={selectedId} setSelectedId={setSelectedId} liveCount={liveIncidents.length} reportCount={143 + liveIncidents.length} resolved={resolved} resolveIncident={resolveIncident} />}
        {view === "incidents" && <IncidentsView incidents={incidents} resolved={resolved} openIncident={openIncident} />}
        {view === "alerts" && <AlertComposer />}
        {view === "sources" && <SourcesView />}
      </div>
      <ChatPanel messages={messages} scenarioKey={scenarioKey} isPlaying={isPlaying} playScenario={playScenario} />
    </section>
  </main>;
}

function Sidebar({ view, setView, total }: { view: View; setView: (view: View) => void; total: number }) {
  const links: { id: View; icon: string; label: string }[] = [
    { id: "operation", icon: "⌂", label: "Visão operacional" }, { id: "incidents", icon: "◎", label: "Ocorrências" }, { id: "alerts", icon: "◉", label: "Criar alerta" }, { id: "sources", icon: "▥", label: "Fontes de dados" },
  ];
  return <aside className="sidebar"><nav aria-label="Navegação principal">{links.map((link) => <button key={link.id} className={view === link.id ? "active" : ""} onClick={() => setView(link.id)}><span>{link.icon}</span>{link.label}{link.id === "incidents" && <b>{total}</b>}</button>)}</nav><div className="source-card"><span>INTEGRAÇÃO ATIVA</span><strong><i /> Dados Abertos Recife</strong><p>Áreas de risco e solicitações da Defesa Civil</p><small>Sincronizado agora</small></div><p className="emergency">Defesa Civil · atendimento 24h<br /><strong>0800 081 3400</strong></p></aside>;
}

function OperationView({ incidents, selected, selectedId, setSelectedId, liveCount, reportCount, resolved, resolveIncident }: { incidents: Incident[]; selected: Incident; selectedId: string; setSelectedId: (id: string) => void; liveCount: number; reportCount: number; resolved: string[]; resolveIncident: () => void }) {
  const done = resolved.includes(selected.id);
  return <>
    <div className="page-heading"><div><span>CENTRO DE OPERAÇÕES · RECIFE</span><h1>Visão operacional</h1><p>Relatos da população transformados em prioridade de ação.</p></div><div className="live-sync"><i /> Atualização em tempo real</div></div>
    <div className="metrics"><article className={liveCount ? "metric-up" : ""}><span>OCORRÊNCIAS ABERTAS</span><div><strong>{26 + liveCount}</strong>{liveCount > 0 && <small>+{liveCount} agora</small>}</div><p>5 aguardam triagem</p></article><article className={liveCount ? "metric-up" : ""}><span>RELATOS AGRUPADOS</span><div><strong>{reportCount}</strong>{liveCount > 0 && <small>+{liveCount} recebido</small>}</div><p>Atualizados a partir da conversa</p></article><article className="critical"><span>PRIORIDADE CRÍTICA</span><div><strong>{3 + incidents.filter((i) => i.source === "live" && i.priority === "Crítica").length}</strong><small>ação imediata</small></div><p>Equipes regionais acionadas</p></article></div>
    <InteractiveCityMap incidents={incidents} selectedId={selectedId} setSelectedId={setSelectedId} />
    <div className="operation-grid">
      <section className="incident-list"><div className="section-title"><div><span>FILA INTELIGENTE</span><h2>Ocorrências prioritárias</h2></div><small>{incidents.length} visíveis</small></div>{incidents.slice(0, 5).map((incident) => <button key={incident.id} className={`incident ${selectedId === incident.id ? "selected" : ""} ${incident.source ? "new-incident" : ""}`} onClick={() => setSelectedId(incident.id)}><span className={`severity ${incident.priority.toLowerCase()}`}>{incident.priority}</span><div className="incident-main"><strong>{incident.type}</strong><span>{incident.area} · {incident.time}</span></div><div className="report-count"><strong>{incident.reports}</strong><span>relatos</span></div><span className="chevron">›</span></button>)}<div className="ai-note"><span>✦</span><p><strong>Agrupamento inteligente</strong>Localização, tipo e horário permitem unir relatos relacionados e reduzir triagem manual.</p></div></section>
      <section className="incident-detail"><div className="detail-top"><div><span>PROTOCOLO {selected.id} · {selected.rpa}</span><h2>{selected.type}</h2></div><span className={done ? "done-pill" : "risk-pill"}>{done ? "Concluída" : selected.priority}</span></div><div className="location-summary"><span>●</span><div><strong>{selected.area}, Recife</strong><small>{selected.reports} relato{selected.reports !== 1 ? "s" : ""} vinculado{selected.reports !== 1 ? "s" : ""}</small></div></div><div className="detail-summary"><span>✦ LEITURA OPERACIONAL</span><p>{selected.priority === "Crítica" ? "Ocorrência em área de atenção que exige vistoria prioritária e contato com a equipe regional." : "Relatos próximos foram estruturados para apoiar o encaminhamento da equipe responsável."}</p></div><dl><div><dt>Status</dt><dd>{done ? "Concluída" : selected.status}</dd></div><div><dt>Entrada</dt><dd>{selected.time}</dd></div><div><dt>Encaminhamento</dt><dd>Equipe regional · {selected.rpa}</dd></div></dl><button className="resolve-button" onClick={resolveIncident} disabled={done}>{done ? "✓ Atendimento concluído" : "Concluir atendimento"}</button><p className="button-help">A atualização aparece imediatamente na conversa.</p></section>
    </div>
  </>;
}

function CityMap({ incidents, selectedId, setSelectedId }: { incidents: Incident[]; selectedId: string; setSelectedId: (id: string) => void }) {
  const positions: Record<string, { left: string; top: string }> = { "PT-2841": { left: "42%", top: "29%" }, "PT-2837": { left: "56%", top: "25%" }, "PT-2829": { left: "44%", top: "38%" }, "PT-2818": { left: "38%", top: "72%" }, "PT-2804": { left: "49%", top: "55%" }, "PT-2901": { left: "49%", top: "33%" }, "PT-2902": { left: "57%", top: "67%" } };
  return <section className="city-map"><div className="map-heading"><div><span>MAPA DA CIDADE</span><h2>Recife em tempo real</h2></div><div className="map-legend"><span><i className="critical-dot" /> Crítica</span><span><i /> Alta/Média</span></div></div><div className="osm-wrap"><iframe title="Mapa do Recife no OpenStreetMap" src="https://www.openstreetmap.org/export/embed.html?bbox=-35.030%2C-8.180%2C-34.840%2C-7.930&amp;layer=mapnik" loading="lazy" />{incidents.slice(0, 7).map((incident) => { const position = positions[incident.id] ?? { left: "50%", top: "50%" }; return <button key={incident.id} style={position} className={`osm-pin ${incident.priority === "Crítica" ? "pin-critical" : ""} ${incident.source ? "pin-live" : ""} ${selectedId === incident.id ? "pin-selected" : ""}`} onClick={() => setSelectedId(incident.id)} aria-label={`${incident.type} em ${incident.area}`}><span>{incident.reports}</span><b>{incident.area}</b></button>; })}<div className="osm-credit">© OpenStreetMap contributors</div></div></section>;
}

function IncidentsView({ incidents, resolved, openIncident }: { incidents: Incident[]; resolved: string[]; openIncident: (id: string) => void }) {
  const [filter, setFilter] = useState("Todas");
  const filtered = filter === "Todas" ? incidents : incidents.filter((item) => item.priority === filter);
  return <><div className="page-heading"><div><span>GESTÃO DE OCORRÊNCIAS</span><h1>Ocorrências</h1><p>Consulte, filtre e abra os registros recebidos.</p></div></div><div className="filter-row">{["Todas", "Crítica", "Alta", "Média"].map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div><section className="incidents-table"><div className="table-head"><span>Prioridade</span><span>Ocorrência</span><span>Localidade</span><span>Relatos</span><span>Status</span><span /></div>{filtered.map((incident) => <button className={incident.source ? "table-row live-row" : "table-row"} key={incident.id} onClick={() => openIncident(incident.id)}><span><i className={`priority-dot ${incident.priority.toLowerCase()}`} />{incident.priority}</span><span><strong>{incident.type}</strong><small>{incident.id} · {incident.time}</small></span><span>{incident.area}<small>{incident.rpa}</small></span><span>{incident.reports}</span><span>{resolved.includes(incident.id) ? "Concluída" : incident.status}</span><span>Ver →</span></button>)}</section></>;
}

function AlertComposer() {
  const [rpa, setRpa] = useState(Object.keys(rpas)[2]);
  const [neighborhood, setNeighborhood] = useState(rpas[Object.keys(rpas)[2]][1]);
  const [prepared, setPrepared] = useState(false);
  function changeRpa(value: string) { setRpa(value); setNeighborhood(rpas[value][0]); setPrepared(false); }
  return <><div className="page-heading"><div><span>COMUNICAÇÃO DE RISCO</span><h1>Criar alerta localizado</h1><p>Combine o aviso oficial, o território e a orientação necessária.</p></div></div><section className="alert-layout"><div className="composer-card"><div className="field-grid"><label>Região Político-Administrativa<select value={rpa} onChange={(event) => changeRpa(event.target.value)}>{Object.keys(rpas).map((item) => <option key={item}>{item}</option>)}</select><small>Divisão territorial oficial do Recife</small></label><label>Bairro<select value={neighborhood} onChange={(event) => { setNeighborhood(event.target.value); setPrepared(false); }}>{rpas[rpa].map((item) => <option key={item}>{item}</option>)}</select><small>Escolha a área que receberá o aviso</small></label></div><label className="full-field">Situação observada<textarea defaultValue="Possibilidade de chuva moderada a forte nas próximas 24 horas, com atenção para áreas de morro e pontos de alagamento." onChange={() => setPrepared(false)} /></label><label className="full-field">Ação recomendada<select onChange={() => setPrepared(false)}><option>Ficar atento e evitar áreas de risco</option><option>Buscar um local seguro</option><option>Evitar deslocamentos</option></select></label><button className="resolve-button" onClick={() => setPrepared(true)}>Preparar orientação pública</button><p className="button-help">A equipe revisa e aprova a mensagem antes do envio.</p></div><div className={`alert-preview ${prepared ? "ready" : ""}`}><span>PRÉVIA DA MENSAGEM</span><img src="/prefeitura-recife.png" alt="Prefeitura do Recife" />{prepared ? <><strong>Alerta para {neighborhood}</strong><p>Pode chover forte nas próximas horas. Fique atento a rachaduras, movimento de terra e aumento rápido da água. Evite áreas de risco e vá para um local seguro se perceber algum sinal de perigo. Em emergência, ligue 0800 081 3400.</p><small>{rpa} · Prefeitura do Recife</small></> : <div className="empty-preview"><i>✦</i><p>Preencha a localidade e prepare a orientação para visualizar a mensagem.</p></div>}</div></section></>;
}

function SourcesView() {
  const sources = [{ name: "Dados Abertos Recife", detail: "Áreas de risco, bairros e RPAs", update: "Sincronizado agora" }, { name: "Defesa Civil do Recife", detail: "Solicitações, vistorias e colocação de lonas", update: "Atualização diária" }, { name: "APAC", detail: "Avisos meteorológicos e previsão de chuva", update: "Consulta contínua" }, { name: "Relatos da população", detail: "Localização, imagem e descrição pelo canal de conversa", update: "Tempo real" }];
  return <><div className="page-heading"><div><span>INTEGRAÇÕES</span><h1>Fontes de dados</h1><p>O que alimenta a leitura operacional do PTAH.</p></div></div><section className="sources-grid">{sources.map((source) => <article key={source.name}><div className="source-icon">↗</div><div><strong>{source.name}</strong><p>{source.detail}</p></div><span><i /> {source.update}</span></article>)}</section></>;
}

function ChatPanel({ messages, scenarioKey, isPlaying, playScenario }: { messages: Message[]; scenarioKey: keyof typeof scenarios | null; isPlaying: boolean; playScenario: (key: keyof typeof scenarios) => void }) {
  return <aside className="phone-panel"><div className="phone-label"><div><span>CONVERSA DO MORADOR</span><strong>Acompanhe a entrada no painel</strong></div><i className="live-dot" /></div><div className="scenario-picker"><span>Escolha um exemplo:</span><div>{(Object.keys(scenarios) as (keyof typeof scenarios)[]).map((key) => <button key={key} disabled={isPlaying} className={scenarioKey === key ? "active" : ""} onClick={() => playScenario(key)}>{isPlaying && scenarioKey === key ? "Recebendo…" : scenarios[key].label}</button>)}</div></div><div className="phone"><div className="chat-header"><button aria-label="Voltar">‹</button><span className="chat-avatar"><img src="/prefeitura-recife.png" alt="" /></span><div><strong>Prefeitura do Recife <em>✓</em></strong><small>online</small></div><span className="dots">•••</span></div><div className="messages" aria-live="polite"><span className="day-pill">HOJE</span>{messages.length === 0 && <div className="chat-empty"><span>Olá! 👋</span><p>Escolha um dos exemplos acima para acompanhar uma ocorrência chegando em tempo real.</p></div>}{messages.map((message) => <div key={message.id} className={`message ${message.side === "resident" ? "user" : "bot"} ${message.kind ?? ""}`}>{message.kind === "location" && <span className="pin">●</span>}<p>{message.text}</p><time>{message.time} {message.side === "resident" ? "✓✓" : ""}</time></div>)}{isPlaying && <span className="typing"><i /><i /><i /></span>}</div><div className="chat-input fake-input"><button aria-label="Anexar">＋</button><span>Digite uma mensagem</span><button className="send" aria-label="Enviar">➤</button></div></div></aside>;
}
