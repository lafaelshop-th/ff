const API = '/api';
let hwid = localStorage.getItem('ff_hwid') || null;
let sessionToken = localStorage.getItem('ff_token') || null;

const $ = id => document.getElementById(id);
const led = $('led');
const dot = led.querySelector('.dot');
const txt = led.querySelector('.txt');

function setLed(state, msg) {
  dot.className = 'dot ' + (state === 'on' ? 'on' : state === 'err' ? 'err' : '');
  txt.textContent = msg;
}

async function checkBind() {
  if (!hwid) return;
  try {
    const r = await fetch(`${API}/check-hwid?hwid=${encodeURIComponent(hwid)}`);
    const d = await r.json();
    if (d.bound) {
      setLed('on', 'MACHINE BOUND • READY');
      $('keyCard').classList.remove('hidden');
      if (sessionToken) {
        $('uidCard').classList.remove('hidden');
      }
    } else {
      setLed('err', 'HWID NOT REGISTERED');
    }
  } catch (e) {
    setLed('err', 'SERVER OFFLINE');
  }
}

$('btnDownload').addEventListener('click', e => {
  e.preventDefault();
  // Simulate binder download + HWID collect for demo
  // Real binder would POST /api/bind with real HWID
  const fakeHwid = 'FF-' + Array.from({length:16}, () => Math.floor(Math.random()*16).toString(16)).join('').toUpperCase();
  hwid = fakeHwid;
  localStorage.setItem('ff_hwid', hwid);
  fetch(`${API}/bind`, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({hwid})
  }).then(r => r.json()).then(d => {
    if (d.ok) {
      setLed('on', 'MACHINE BOUND • READY');
      $('keyCard').classList.remove('hidden');
    }
  });
});

$('btnKey').addEventListener('click', async () => {
  const key = $('keyInput').value.trim().toUpperCase();
  if (!key) return;
  const r = await fetch(`${API}/activate-key`, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({key, hwid})
  });
  const d = await r.json();
  if (d.ok) {
    sessionToken = d.token;
    localStorage.setItem('ff_token', sessionToken);
    setLed('on', 'KEY VALID • ENTER UID');
    $('uidCard').classList.remove('hidden');
  } else {
    setLed('err', d.msg || 'INVALID KEY');
  }
});

$('btnUid').addEventListener('click', async () => {
  const uid = $('uidInput').value.trim();
  const pkg = $('pkgSelect').value;
  if (!uid) return;
  const r = await fetch(`${API}/activate-package`, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({uid, pkg, hwid, token: sessionToken})
  });
  const d = await r.json();
  if (d.ok) {
    setLed('on', 'PACKAGE ACTIVE • MENU READY');
    $('menuOverlay').classList.remove('hidden');
  } else {
    setLed('err', d.msg || 'ACTIVATION FAILED');
  }
});

// Menu tabs
document.querySelectorAll('.tab').forEach(t => {
  t.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    $('tab-' + t.dataset.tab).classList.remove('hidden');
  });
});

$('fovRange').addEventListener('input', e => {
  $('fovVal').textContent = e.target.value;
});

$('btnCloseMenu').addEventListener('click', () => {
  $('menuOverlay').classList.add('hidden');
});

$('btnStart').addEventListener('click', () => {
  const cfg = {
    headlock: $('chkHeadlock').checked,
    bullets: $('chkBullets').checked,
    fov: +$('fovRange').value,
    esp: $('chkEsp').checked,
    login: $('chkLogin').checked,
    dist: $('chkDist').checked,
    box: $('chkBox').checked
  };
  localStorage.setItem('ff_cfg', JSON.stringify(cfg));
  alert('INJECT STARTED\nHeadlock: ' + cfg.headlock + '\nESP: ' + cfg.esp + '\nFOV: ' + cfg.fov);
  // In real build this would trigger the native injector / overlay process
});

// init
checkBind();
if (sessionToken) {
  $('keyCard').classList.remove('hidden');
  $('uidCard').classList.remove('hidden');
}