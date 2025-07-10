function showWarning(msg) {
  const modal = document.getElementById('warning-modal');
  if (!modal) {
    console.error('Warning modal element not found');
    return;
  }
  document.getElementById('warning-message').textContent = msg;
  modal.style.display = 'flex';
}

document.addEventListener('click', function (e) {
  const modal = document.getElementById('warning-modal');
  if (!modal) return;
  if (e.target.id === 'warning-close' || e.target === modal) {
    modal.style.display = 'none';
  }
});
