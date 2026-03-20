document.addEventListener('DOMContentLoaded', function () {
    const steps = document.querySelectorAll('.step');
    const navItems = document.querySelectorAll('.nav-item');
    let currentStep = 1;

    function showStep(n, moveFocus = false) {
        currentStep = n;
        steps.forEach((step, idx) => {
            step.style.display = idx === n - 1 ? 'block' : 'none';
        });
        navItems.forEach((item, idx) => {
            const isActive = idx === n - 1;
            item.classList.toggle('active', isActive);
            item.setAttribute('tabindex', isActive ? '0' : '-1');
        });
        if (moveFocus) {
            navItems[n - 1].focus();
        }
    }

    document.getElementById('to-step-2').addEventListener('click', () => showStep(2));
    document.getElementById('back-to-step-1').addEventListener('click', () => showStep(1));
    document.getElementById('diagnose-button').addEventListener('click', () => showStep(3));
    document.getElementById('back-to-step-2').addEventListener('click', () => showStep(2));

    navItems.forEach((item, idx) => {
        const targetStep = idx + 1;
        item.setAttribute('role', 'button');
        item.addEventListener('click', () => showStep(targetStep));
        item.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                showStep(targetStep);
            }
            if (event.key === 'ArrowRight' && currentStep < steps.length) {
                event.preventDefault();
                event.stopPropagation();
                showStep(currentStep + 1, true);
            }
            if (event.key === 'ArrowLeft' && currentStep > 1) {
                event.preventDefault();
                event.stopPropagation();
                showStep(currentStep - 1, true);
            }
        });
    });

    showStep(1);
});
