const money = v => (v || 0).toLocaleString('vi-VN') + '₫';
const grid = document.getElementById('grid');
const tabs = document.querySelector('.tabs');
const q = document.getElementById('q');
let activeCat = 'all';

function cardTpl(x) {
  return `<article class="card">
    <img src="${x.image || ''}" alt="${x.name}" loading="lazy" onerror="this.style.opacity=0.3" />
    <div class="p">
      <div class="row" style="justify-content:space-between">
        <h3>${x.name}</h3>
        <span class="badge">${x.category === 'food' ? 'Món ăn' : 'Nước'}</span>
      </div>
      <div class="muted small">${x.description || ''}</div>
      <div class="price">${money(x.price)}</div>
    </div>
  </article>`;
}

async function fetchItems() {
  const p = new URLSearchParams();
  if (activeCat !== 'all') p.set('category', activeCat);
  if (q.value) p.set('q', q.value);
  const res = await fetch('/api/items?' + p.toString());
  return await res.json();
}

async function render() {
  const items = await fetchItems();
  grid.innerHTML = items.map(cardTpl).join('');
}

// Tabs & search
if (tabs) {
  tabs.addEventListener('click', (e) => {
    const cat = e.target.dataset.cat; if (!cat) return;
    document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('active', b.dataset.cat === cat));
    activeCat = cat; render();
  });
}
q && q.addEventListener('input', () => { render(); });

// Team & Meta (dấu vết)
async function renderTeam() {
  const res = await fetch('/api/team');
  const team = await res.json();
  document.getElementById('team').innerHTML =
    `<strong>Thành viên nhóm:</strong> ` + team.map(m => `${m.name} (${m.role || ''})`).join(' • ');
  const meta = await (await fetch('/api/meta')).json();
  document.getElementById('meta').innerHTML =
    `DB: <code>${meta.dbPath}</code> · Bảng <code>items</code>: ${meta.tables.items.join(', ')} · Bảng <code>team</code>: ${meta.tables.team.join(', ')}`;
}

renderTeam();
render();
