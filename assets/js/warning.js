function showWarning(msg) {
  const modal = document.getElementById('warning-modal');
  if (!modal) {
    console.error('Warning modal element not found');
    return;
  }
  document.getElementById('warning-message').textContent = msg;
  modal.style.display = 'flex';
}

document.addEventListener('DOMContentLoaded', function () {
  const modal = document.getElementById('warning-modal');
  if (!modal) return;
  const closeBtn = document.getElementById('warning-close');
  closeBtn.addEventListener('click', function () {
    modal.style.display = 'none';
  });
  modal.addEventListener('click', function (e) {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
});
