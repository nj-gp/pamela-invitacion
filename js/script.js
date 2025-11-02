// =========================
// CONFIGURACIÓN
// =========================
const PHONE_NUMBER = '51982363343'; // <-- pon tu número (sin + ni espacios)
const MIN_ISO = '2025-11-03';
const MAX_ISO = '2025-11-09';

let selectedDateISO = null;
let selectedTime = '19:30';

// =========================
// HELPERS
// =========================
const q  = (s) => document.querySelector(s);
const qa = (s) => [...document.querySelectorAll(s)];

function clampToRange(iso) {
  if (!iso) return MIN_ISO;
  if (iso < MIN_ISO) return MIN_ISO;
  if (iso > MAX_ISO) return MAX_ISO;
  return iso;
}

function formatDateSpanish(iso, withWeekday = true) {
  const d = new Date(iso + 'T00:00:00');
  const opts = withWeekday
    ? { weekday:'long', day:'numeric', month:'long' }
    : { day:'numeric', month:'long' };
  let txt = d.toLocaleDateString('es-PE', opts);
  return txt.charAt(0).toUpperCase() + txt.slice(1);
}

// =========================
// TOGGLES DE PLAN / FLORES
// =========================
function wireSelectable(selector) {
  qa(selector).forEach(btn => {
    btn.addEventListener('click', () => {
      const isSelected = btn.classList.contains('selected');
      qa(selector).forEach(el => el.classList.remove('selected'));
      if (!isSelected) btn.classList.add('selected'); // toggle
    });
  });
}

// =========================
// MODAL CALENDARIO + HORA
// =========================
function wireCalendarModal() {
  const modal        = q('#modalCal');
  const backdrop     = q('.modal-backdrop');
  const openBtn      = q('#btnCalendario');
  const cancelBtn    = q('#calCancelar');
  const acceptBtn    = q('#calAceptar');
  const inputFecha   = q('#inputFecha');
  const inputHora    = q('#inputHora');
  const fechaDisplay = q('#fechaDisplay');

  if (inputFecha) { inputFecha.min = MIN_ISO; inputFecha.max = MAX_ISO; }

  function openModal() {
    const todayISO = new Date().toISOString().slice(0, 10);
    inputFecha.value = clampToRange(selectedDateISO || clampToRange(todayISO));
    inputHora.value  = selectedTime || '19:30';
    qa('.chip.quick').forEach(b => b.classList.remove('selected'));
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
  }

  openBtn?.addEventListener('click', openModal);
  cancelBtn?.addEventListener('click', closeModal);
  backdrop?.addEventListener('click', closeModal);

  qa('.chip.quick').forEach(btn => {
    btn.addEventListener('click', () => {
      const iso = btn.dataset.quick;
      inputFecha.value = clampToRange(iso);
      qa('.chip.quick').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });

  acceptBtn?.addEventListener('click', () => {
    const iso  = clampToRange(inputFecha.value || MIN_ISO);
    const hora = inputHora.value || '';
    selectedDateISO = iso;
    selectedTime    = hora;

    const fechaTxt  = formatDateSpanish(iso, true);
    const horaTxt   = hora ? ` · ${hora}` : '';
    fechaDisplay.value = `${fechaTxt}${horaTxt}`;
    closeModal();
  });
}

// =========================
// MENSAJE COMPILADO (24h)
// =========================
function buildMessage() {
  if (!selectedDateISO) {
    return { ok: false, text: 'Elige una fecha primero 😊' };
  }

  const fechaTxt = formatDateSpanish(selectedDateISO, true);
  const horaTxt  = selectedTime ? ` a las ${selectedTime}` : '';

  const planSel   = q('.plan.selected');
  const flowerSel = q('.flower.selected');
  const nota      = q('#nota')?.value.trim() || '';

  const plan  = planSel ? planSel.dataset.plan : 'lo que te provoque ese día';
  const flowerTxt = flowerSel ? `${flowerSel.dataset.emoji} ${flowerSel.dataset.flower}` : null;

  let msg = `¡Hola! Me encantaría vernos el ${fechaTxt}${horaTxt}.\n` +
            `Podemos ir a: ${plan}.`;
  if (flowerTxt) msg += `\nPensé en llevarte ${flowerTxt} 🌷, solo si te gustan.`;
  if (nota)      msg += `\n\nNotas: ${nota}`;
  msg += `\n\n¿Te parece? 😊`;

  return { ok: true, text: msg };
}

// =========================
// ACCIONES: PREVIEW / COPIAR / WHATSAPP
// =========================
function wireActions() {
  const btnPreview = q('#btnPreview');
  const btnWA      = q('#btnWhatsapp');
  const btnCopy    = q('#btnCopiar');
  const previewBox = q('#previewBox');

  btnPreview?.addEventListener('click', () => {
    const { ok, text } = buildMessage();
    previewBox.classList.remove('hidden');
    previewBox.querySelector('.preview-box').textContent = text;
    btnWA.disabled   = !ok;
    btnCopy.disabled = !ok;
  });

  btnCopy?.addEventListener('click', async () => {
    const { ok, text } = buildMessage();
    if (!ok) return;
    try {
      await navigator.clipboard.writeText(text);
      btnCopy.textContent = '¡Copiado!';
      setTimeout(() => (btnCopy.textContent = 'Copiar mensaje'), 1400);
    } catch {
      alert('No se pudo copiar. Intenta manualmente.');
    }
  });

  btnWA?.addEventListener('click', () => {
    const { ok, text } = buildMessage();
    if (!ok) return;

    const base = 'https://api.whatsapp.com/send';
    const url  = PHONE_NUMBER && /^\d{8,15}$/.test(PHONE_NUMBER)
      ? `${base}?phone=${PHONE_NUMBER}&text=${encodeURIComponent(text)}`
      : `${base}?text=${encodeURIComponent(text)}`;

    window.open(url, '_blank');
  });
}

// =========================
// INIT
// =========================
document.addEventListener('DOMContentLoaded', () => {
  wireSelectable('.plan');
  wireSelectable('.flower');
  wireCalendarModal();
  wireActions();
});
