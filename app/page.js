'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { hubs, sprayers, getHubSprayers } from '../data/sampleData';

const MapView = dynamic(() => import('../components/MapView'), {
  ssr: false,
  loading: () => <div className="empty" style={{ paddingTop: 200 }}>Loading map…</div>,
});

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'sprayers', label: 'Certified Sprayers' },
  { id: 'hubs', label: 'Spray Hubs' },
];

// Convert index to letter: 0=A, 1=B, ...25=Z, 26=AA etc.
function toLetter(index) {
  let s = '';
  let n = index;
  do {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState(null);
  // For Spray Hubs tab: only one hub open at a time (accordion). null = all closed.
  const [openHubId, setOpenHubId] = useState(null);

  const q = search.toLowerCase().trim();
  const matches = (text) => !q || text.includes(q);

  const hubSearchText = (h) => [h.company, h.region, h.suburb, h.city, h.state].join(' ').toLowerCase();
  const sprayerSearchText = (s) =>
    [s.firstName, s.lastName, s.company, s.suburb, s.city, s.state, s.certNumber].join(' ').toLowerCase();

  // ===== Map markers =====
  const mapItems = useMemo(() => {
    const items = [];
    let counter = 0;

    // ALL TAB: everything flat with numbers
    if (activeTab === 'all') {
      hubs.filter((h) => matches(hubSearchText(h))).forEach((h) => {
        counter++;
        items.push({
          id: h.id, markerType: 'hub', label: String(counter),
          lat: h.lat, lng: h.lng,
          popupTitle: h.company,
          popupCompany: h.isGMG ? 'GMG Spray Hub' : 'Spray Hub',
          popupAddress: [h.suburb, h.city, h.state, h.postCode].filter(Boolean).join(', '),
          popupPhone: h.phone,
        });
      });
      // Independent sprayers (those not tied to any hub)
      sprayers
        .filter((s) => !hubs.some((h) => h.company.toLowerCase() === s.company.toLowerCase() && h.state === s.state))
        .filter((s) => matches(sprayerSearchText(s)))
        .forEach((s) => {
          counter++;
          items.push({
            id: s.id, markerType: 'sprayer', label: String(counter),
            lat: s.lat, lng: s.lng,
            popupTitle: `${s.firstName} ${s.lastName}`,
            popupCompany: s.company,
            popupAddress: [s.suburb, s.city, s.state, s.postCode].filter(Boolean).join(', '),
            popupPhone: s.phone,
          });
        });
    }

    // SPRAYERS TAB: flat, all sprayers with numbers
    if (activeTab === 'sprayers') {
      sprayers.filter((s) => matches(sprayerSearchText(s))).forEach((s) => {
        counter++;
        items.push({
          id: s.id, markerType: 'sprayer', label: String(counter),
          lat: s.lat, lng: s.lng,
          popupTitle: `${s.firstName} ${s.lastName}`,
          popupCompany: s.company,
          popupAddress: [s.suburb, s.city, s.state, s.postCode].filter(Boolean).join(', '),
          popupPhone: s.phone,
        });
      });
    }

    // HUBS TAB: hub pins with numbers + expanded sprayers with letters
    if (activeTab === 'hubs') {
      hubs.filter((h) => matches(hubSearchText(h))).forEach((h) => {
        counter++;
        items.push({
          id: h.id, markerType: 'hub', label: String(counter),
          lat: h.lat, lng: h.lng,
          popupTitle: h.company,
          popupCompany: h.isGMG ? 'GMG Spray Hub' : 'Spray Hub',
          popupAddress: [h.suburb, h.city, h.state, h.postCode].filter(Boolean).join(', '),
          popupPhone: h.phone,
        });

        // If this hub is expanded, add sprayer pins with A, B, C...
        if (openHubId === h.id) {
          const hubSprayers = getHubSprayers(h);
          hubSprayers.forEach((s, letterIdx) => {
            items.push({
              id: s.id, markerType: 'sprayer', label: toLetter(letterIdx),
              lat: s.lat, lng: s.lng,
              popupTitle: `${s.firstName} ${s.lastName}`,
              popupCompany: `${s.company} (${h.region})`,
              popupAddress: [s.suburb, s.city, s.state, s.postCode].filter(Boolean).join(', '),
              popupPhone: s.phone,
            });
          });
        }
      });
    }

    return items;
  }, [activeTab, openHubId, q]);

  // Count for independent sprayers on All tab
  const independentCount = sprayers.filter(
    (s) => !hubs.some((h) => h.company.toLowerCase() === s.company.toLowerCase() && h.state === s.state)
  ).length;

  const counts = {
    all: hubs.length + independentCount,
    sprayers: sprayers.length,
    hubs: hubs.length,
  };

  // Accordion: clicking a hub opens it, closes any other
  function selectHub(hubId) {
    setOpenHubId((prev) => (prev === hubId ? prev : hubId));
    setActiveId(hubId);
  }

  // ===== List rendering =====
  function renderList() {
    // --- ALL TAB: everything flat ---
    if (activeTab === 'all') {
      const filteredHubs = hubs.filter((h) => matches(hubSearchText(h)));
      const independentSprayers = sprayers
        .filter((s) => !hubs.some((h) => h.company.toLowerCase() === s.company.toLowerCase() && h.state === s.state))
        .filter((s) => matches(sprayerSearchText(s)));

      if (filteredHubs.length === 0 && independentSprayers.length === 0) {
        return <div className="empty">Nothing matches your search.</div>;
      }

      let n = 0;
      return (
        <>
          {filteredHubs.map((h) => {
            n++;
            const address = [h.suburb, h.city, h.state, h.postCode].filter(Boolean).join(', ');
            return (
              <div key={h.id} className={`card ${activeId === h.id ? 'active' : ''}`} onClick={() => setActiveId(h.id)}>
                <div className="card-number hub">{n}</div>
                <div className="card-body">
                  <div className="card-header">
                    <span className="card-title">{h.company}</span>
                    {h.isGMG ? <span className="badge gmg">GMG Hub</span> : <span className="badge hub">Spray Hub</span>}
                  </div>
                  <div className="card-row"><span className="ico">📍</span><span>{address}</span></div>
                  <div className="card-row"><span className="ico">📞</span><a href={`tel:${h.phone}`}>{h.phone}</a></div>
                  <div className="card-row"><span className="ico">✉️</span><a href={`mailto:${h.email}`}>{h.email}</a></div>
                </div>
              </div>
            );
          })}
          {independentSprayers.map((s) => {
            n++;
            return <SprayerCard key={s.id} sprayer={s} index={n} active={activeId === s.id} onClick={() => setActiveId(s.id)} />;
          })}
        </>
      );
    }

    // --- CERTIFIED SPRAYERS TAB: flat list ---
    if (activeTab === 'sprayers') {
      const filtered = sprayers.filter((s) => matches(sprayerSearchText(s)));
      if (filtered.length === 0) return <div className="empty">No certified sprayers match your search.</div>;
      return filtered.map((s, i) => (
        <SprayerCard key={s.id} sprayer={s} index={i + 1} active={activeId === s.id} onClick={() => setActiveId(s.id)} />
      ));
    }

    // --- SPRAY HUBS TAB: accordion hubs with expandable sprayers ---
    const filtered = hubs.filter((h) => matches(hubSearchText(h)));
    if (filtered.length === 0) return <div className="empty">No spray hubs match your search.</div>;

    return filtered.map((h, i) => {
      const hubSprayers = getHubSprayers(h);
      const isOpen = openHubId === h.id;
      const address = [h.suburb, h.city, h.state, h.postCode].filter(Boolean).join(', ');

      return (
        <div className="hub-group" key={h.id}>
          <div
            className={`hub-group-header ${activeId === h.id ? 'active' : ''}`}
            onClick={() => selectHub(h.id)}
          >
            {hubSprayers.length > 0 ? (
              <span className={`expand-arrow ${isOpen ? 'open' : ''}`}>▶</span>
            ) : (
              <span className="expand-arrow" style={{ visibility: 'hidden' }}>▶</span>
            )}
            <div className="card-number hub">{i + 1}</div>
            <div className="card-body">
              <div className="card-header">
                <span className="card-title">{h.company}</span>
                {h.isGMG ? <span className="badge gmg">GMG Hub</span> : <span className="badge hub">Spray Hub</span>}
                {hubSprayers.length > 0 && (
                  <span className="badge count">{hubSprayers.length} sprayer{hubSprayers.length !== 1 ? 's' : ''}</span>
                )}
              </div>
              <div className="card-row"><span className="ico">📍</span><span>{address}</span></div>
              <div className="card-row"><span className="ico">📞</span><a href={`tel:${h.phone}`}>{h.phone}</a></div>
              <div className="card-row"><span className="ico">✉️</span><a href={`mailto:${h.email}`}>{h.email}</a></div>
            </div>
          </div>

          {isOpen && hubSprayers.length > 0 && (
            <div className="hub-sprayers">
              {hubSprayers.map((s, letterIdx) => {
                const letter = toLetter(letterIdx);
                return (
                  <div
                    key={s.id}
                    className={`hub-sprayer-item ${activeId === s.id ? 'active' : ''}`}
                    onClick={() => setActiveId(s.id)}
                  >
                    <span className="hub-sprayer-letter">{letter}</span>
                    <span className="hub-sprayer-name">{s.firstName} {s.lastName}</span>
                    <span className="hub-sprayer-cert">{s.certNumber}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    });
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
              onClick={() => { setActiveTab(tab.id); setActiveId(null); setOpenHubId(null); }}
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
            {activeTab === 'all' && `${counts.all} listings`}
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

// ===== Sprayer card (used on All + Sprayers tabs) =====
function SprayerCard({ sprayer, index, active, onClick }) {
  const address = [sprayer.suburb, sprayer.city, sprayer.state, sprayer.postCode].filter(Boolean).join(', ');
  return (
    <div className={`card ${active ? 'active' : ''}`} onClick={onClick}>
      <div className="card-number sprayer">{index}</div>
      <div className="card-body">
        <div className="card-header">
          <span className="card-title">{sprayer.firstName} {sprayer.lastName}</span>
          <span className="badge sprayer">Certified</span>
        </div>
        <div className="card-row"><span className="ico">🏢</span><span>{sprayer.company}</span></div>
        <div className="card-row"><span className="ico">📍</span><span>{address}</span></div>
        <div className="card-row"><span className="ico">📞</span><a href={`tel:${sprayer.phone}`}>{sprayer.phone}</a></div>
        <span className="card-cert">📜 {sprayer.certNumber}</span>
      </div>
    </div>
  );
}
