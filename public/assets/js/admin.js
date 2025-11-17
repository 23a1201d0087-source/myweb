const tbody = document.getElementById('tbody');
const form = document.getElementById('form');
const money = v => (v || 0).toLocaleString('vi-VN') + '₫';

async function load() {
  const res = await fetch('/api/items');
  return await res.json();
}

function rowTpl(x) {
  return `<tr>
    <td>${x.image ? `<img src="${x.image}" style="width:52px;height:36px;object-fit:cover;border-radius:8px">` : ''}</td>
    <td>${x.name}</td>
    <td>${x.category === 'food' ? 'Món ăn' : 'Nước'}</td>
    <td>${money(x.price)}</td>
    <td>
      <button class="btn" data-edit="${x.id}">✏️</button>
      <button class="btn warn" data-del="${x.id}">🗑️</button>
    </td>
  </tr>`;
}

async function render() {
  const items = await load();
  tbody.innerHTML = items.map(rowTpl).join('');
}

// Dấu vết nhóm
async function renderTeam() {
  const res = await fetch('/api/team');
  const team = await res.json();
  document.getElementById('team').innerHTML =
    `<strong>Thành viên nhóm:</strong> ` + team.map(m => `${m.name} (${m.role || ''})`).join(' • ');
  const meta = await (await fetch('/api/meta')).json();
  document.getElementById('meta').innerHTML =
    `DB: <code>${meta.dbPath}</code> · Bảng <code>items</code>: ${meta.tables.items.join(', ')} · Bảng <code>team</code>: ${meta.tables.team.join(', ')}`;
}

// Submit (Create/Update)
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('id').value;
  const body = {
    name: document.getElementById('name').value.trim(),
    price: +document.getElementById('price').value || 0,
    category: document.getElementById('category').value,
    image: document.getElementById('image').value.trim(),
    description: document.getElementById('description').value.trim()
  };
  if (!body.name) { alert('Nhập tên'); return; }

  if (id) {
    await fetch('/api/items/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } else {
    await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  }
  form.reset();
  document.getElementById('id').value = '';
  await render();
});

// Edit/Delete buttons
tbody.addEventListener('click', async (e) => {
  const btn = e.target.closest('button'); if (!btn) return;
  const id = btn.dataset.del || btn.dataset.edit;

  if (btn.dataset.del) {
    if (confirm('Xoá mục này?')) {
      await fetch('/api/items/' + id, { method: 'DELETE' });
      await render();
    }
  } else if (btn.dataset.edit) {
    const items = await load();
    const it = items.find(x => x.id == id);
    if (!it) return;
    document.getElementById('id').value = it.id;
    document.getElementById('name').value = it.name;
    document.getElementById('price').value = it.price;
    document.getElementById('category').value = it.category;
    document.getElementById('image').value = it.image || '';
    document.getElementById('description').value = it.description || '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

document.getElementById('reset').addEventListener('click', () => {
  document.getElementById('id').value = '';
});

// Init
renderTeam();
render();
