document.addEventListener('DOMContentLoaded', function () {
    const steps = document.querySelectorAll('.step');
    const navItems = document.querySelectorAll('.nav-item');

    function showStep(n) {
        steps.forEach((step, idx) => {
            step.style.display = idx === n - 1 ? 'block' : 'none';
        });
        navItems.forEach((item, idx) => {
            item.classList.toggle('active', idx === n - 1);
        });
    }

    document.getElementById('to-step-2').addEventListener('click', () => showStep(2));
    document.getElementById('back-to-step-1').addEventListener('click', () => showStep(1));
    document.getElementById('diagnose-button').addEventListener('click', () => showStep(3));
    document.getElementById('back-to-step-2').addEventListener('click', () => showStep(2));

    showStep(1);
});
