'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { hubs, buildSprayerGroups } from '../data/sampleData';

const MapView = dynamic(() => import('../components/MapView'), {
  ssr: false,
  loading: () => <div className="empty" style={{ paddingTop: 200 }}>Loading map…</div>,
});

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'sprayers', label: 'Certified Sprayers' },
  { id: 'hubs', label: 'Spray Hubs' },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState(null);
  const [expandedHubs, setExpandedHubs] = useState({});

  // Build the grouped sprayer structure
  const { groups, independents } = useMemo(() => buildSprayerGroups(), []);

  // Hub list as display items
  const hubItems = useMemo(
    () =>
      hubs.map((h) => ({
        id: h.id,
        kind: 'hub',
        name: h.company,
        isGMG: h.isGMG || false,
        region: h.region,
        address: [h.suburb, h.city, h.state, h.postCode].filter(Boolean).join(', '),
        phone: h.phone,
        email: h.email,
        lat: h.lat,
        lng: h.lng,
        searchText: [h.company, h.region, h.suburb, h.city, h.state].join(' ').toLowerCase(),
      })),
    []
  );

  // Independent sprayers as display items
  const independentItems = useMemo(
    () =>
      independents.map((s) => ({
        id: s.id,
        kind: 'sprayer',
        name: `${s.firstName} ${s.lastName}`,
        company: s.company,
        certNumber: s.certNumber,
        address: [s.suburb, s.city, s.state, s.postCode].filter(Boolean).join(', '),
        phone: s.phone,
        email: s.email,
        lat: s.lat,
        lng: s.lng,
        searchText: [s.firstName, s.lastName, s.company, s.city, s.state, s.certNumber].join(' ').toLowerCase(),
      })),
    [independents]
  );

  // Search filter helper
  const q = search.toLowerCase().trim();
  const matchesSearch = (text) => !q || text.includes(q);

  // Build map markers depending on tab
  const mapItems = useMemo(() => {
    const items = [];

    if (activeTab === 'all' || activeTab === 'hubs') {
      hubItems.forEach((h) => {
        if (matchesSearch(h.searchText)) {
          items.push({
            id: h.id,
            markerType: 'hub',
            lat: h.lat,
            lng: h.lng,
            popupTitle: h.name,
            popupCompany: h.isGMG ? 'GMG Spray Hub' : 'Spray Hub',
            popupAddress: h.address,
            popupPhone: h.phone,
          });
        }
      });
    }

    if (activeTab === 'all' || activeTab === 'sprayers') {
      independentItems.forEach((s) => {
        if (matchesSearch(s.searchText)) {
          items.push({
            id: s.id,
            markerType: 'sprayer',
            lat: s.lat,
            lng: s.lng,
            popupTitle: s.name,
            popupCompany: s.company,
            popupAddress: s.address,
            popupPhone: s.phone,
          });
        }
      });
    }

    return items;
  }, [activeTab, hubItems, independentItems, q]);

  const counts = {
    all:
      hubItems.length +
      independentItems.length +
      groups.reduce((sum, g) => sum + g.sprayers.length, 0),
    sprayers:
      groups.reduce((sum, g) => sum + g.sprayers.length, 0) + independentItems.length,
    hubs: hubItems.length,
  };

  function toggleHub(hubId) {
    setExpandedHubs((prev) => ({ ...prev, [hubId]: !prev[hubId] }));
  }

  // ===== Render the list panel based on tab =====
  function renderList() {
    // SPRAY HUBS TAB
    if (activeTab === 'hubs') {
      const filtered = hubItems.filter((h) => matchesSearch(h.searchText));
      if (filtered.length === 0) return <div className="empty">No spray hubs match your search.</div>;
      return filtered.map((h, i) => (
        <HubCard key={h.id} hub={h} index={i + 1} active={activeId === h.id} onClick={() => setActiveId(h.id)} />
      ));
    }

    // CERTIFIED SPRAYERS TAB - grouped hubs + independents
    if (activeTab === 'sprayers') {
      const visibleGroups = groups
        .map((g) => {
          const groupHubItem = hubItems.find((h) => h.id === g.hub.id);
          const groupMatches = groupHubItem && matchesSearch(groupHubItem.searchText);
          const matchingSprayers = g.sprayers.filter((s) =>
            matchesSearch(
              [s.firstName, s.lastName, s.company, s.city, s.state, s.certNumber].join(' ').toLowerCase()
            )
          );
          // Show group if the hub matches OR any sprayer matches
          if (groupMatches || matchingSprayers.length > 0) {
            return {
              hub: groupHubItem,
              sprayers: groupMatches ? g.sprayers : matchingSprayers,
            };
          }
          return null;
        })
        .filter(Boolean);

      const visibleIndependents = independentItems.filter((s) => matchesSearch(s.searchText));

      if (visibleGroups.length === 0 && visibleIndependents.length === 0) {
        return <div className="empty">No certified sprayers match your search.</div>;
      }

      let counter = 0;
      return (
        <>
          {visibleGroups.map((g) => {
            counter++;
            const isOpen = expandedHubs[g.hub.id] || q.length > 0;
            return (
              <div className="hub-group" key={g.hub.id}>
                <div
                  className={`hub-group-header ${activeId === g.hub.id ? 'active' : ''}`}
                  onClick={() => { toggleHub(g.hub.id); setActiveId(g.hub.id); }}
                >
                  <span className={`expand-arrow ${isOpen ? 'open' : ''}`}>▶</span>
                  <div className="card-number hub">{counter}</div>
                  <div className="card-body">
                    <div className="card-header">
                      <span className="card-title">{g.hub.name}</span>
                      <span className="badge hub">Spray Hub</span>
                      <span className="badge count">{g.sprayers.length} sprayer{g.sprayers.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="card-row"><span className="ico">📍</span><span>{g.hub.address}</span></div>
                    <div className="card-row"><span className="ico">📞</span><span>{g.hub.phone}</span></div>
                  </div>
                </div>
                {isOpen && (
                  <div className="hub-sprayers">
                    {g.sprayers.map((s) => (
                      <div className="hub-sprayer-item" key={s.id}>
                        <span className="hub-sprayer-dot" />
                        <span className="hub-sprayer-name">{s.firstName} {s.lastName}</span>
                        <span className="hub-sprayer-cert">{s.certNumber}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {visibleIndependents.map((s) => {
            counter++;
            return <SprayerCard key={s.id} sprayer={s} index={counter} active={activeId === s.id} onClick={() => setActiveId(s.id)} />;
          })}
        </>
      );
    }

    // ALL TAB - hubs + independent sprayers as flat cards
    const filteredHubs = hubItems.filter((h) => matchesSearch(h.searchText));
    const filteredIndependents = independentItems.filter((s) => matchesSearch(s.searchText));

    if (filteredHubs.length === 0 && filteredIndependents.length === 0) {
      return <div className="empty">Nothing matches your search.</div>;
    }

    let n = 0;
    return (
      <>
        {filteredHubs.map((h) => { n++; return <HubCard key={h.id} hub={h} index={n} active={activeId === h.id} onClick={() => setActiveId(h.id)} />; })}
        {filteredIndependents.map((s) => { n++; return <SprayerCard key={s.id} sprayer={s} index={n} active={activeId === s.id} onClick={() => setActiveId(s.id)} />; })}
      </>
    );
  }

  return (
    <>
      <div className="demo-banner">
        <strong>DEMO</strong> — Sample data. Sprayers come from Arlo; hubs are managed in WordPress.
      </div>

      <header className="site-header">
        <div className="site-header-inner">
          <h1>GMG Certified Applicator Directory</h1>
          <p>Find a certified THERMAL-XR® applicator or spray hub near you</p>
        </div>
      </header>

      <div className="page">
        <div className="tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => { setActiveTab(tab.id); setActiveId(null); }}
            >
              {tab.label}
              <span className="tab-count">{counts[tab.id]}</span>
            </button>
          ))}
        </div>

        <div className="toolbar">
          <div className="search-wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="search-input"
              type="text"
              placeholder="Search by name, company, city, or certification number…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="results-count">
            {activeTab === 'all' && `${counts.all} total`}
            {activeTab === 'sprayers' && `${counts.sprayers} certified sprayers`}
            {activeTab === 'hubs' && `${counts.hubs} spray hubs`}
          </div>
        </div>

        <div className="layout">
          <div className="list-panel">
            <div className="list-scroll">{renderList()}</div>
          </div>
          <div className="map-panel">
            <MapView items={mapItems} activeId={activeId} onMarkerClick={setActiveId} />
          </div>
        </div>
      </div>
    </>
  );
}

// ===== Card components =====

function HubCard({ hub, index, active, onClick }) {
  return (
    <div className={`card ${active ? 'active' : ''}`} onClick={onClick}>
      <div className="card-number hub">{index}</div>
      <div className="card-body">
        <div className="card-header">
          <span className="card-title">{hub.name}</span>
          {hub.isGMG ? <span className="badge gmg">GMG Hub</span> : <span className="badge hub">Spray Hub</span>}
        </div>
        <div className="card-row"><span className="ico">📍</span><span>{hub.address}</span></div>
        <div className="card-row"><span className="ico">📞</span><a href={`tel:${hub.phone}`}>{hub.phone}</a></div>
        <div className="card-row"><span className="ico">✉️</span><a href={`mailto:${hub.email}`}>{hub.email}</a></div>
      </div>
    </div>
  );
}

function SprayerCard({ sprayer, index, active, onClick }) {
  return (
    <div className={`card ${active ? 'active' : ''}`} onClick={onClick}>
      <div className="card-number sprayer">{index}</div>
      <div className="card-body">
        <div className="card-header">
          <span className="card-title">{sprayer.name}</span>
          <span className="badge sprayer">Certified</span>
        </div>
        <div className="card-row"><span className="ico">🏢</span><span>{sprayer.company}</span></div>
        <div className="card-row"><span className="ico">📍</span><span>{sprayer.address}</span></div>
        <div className="card-row"><span className="ico">📞</span><a href={`tel:${sprayer.phone}`}>{sprayer.phone}</a></div>
        <span className="card-cert">📜 {sprayer.certNumber}</span>
      </div>
    </div>
  );
}
