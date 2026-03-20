document.addEventListener('DOMContentLoaded', function () {
    const steps = document.querySelectorAll('.step');
    const navItems = document.querySelectorAll('.nav-item');
    const diagnoseButton = document.getElementById('diagnose-button');
    let currentStep = 1;

    function showStep(n) {
        currentStep = n;
        steps.forEach((step, idx) => {
            step.style.display = idx === n - 1 ? 'block' : 'none';
        });
        navItems.forEach((item, idx) => {
            item.classList.toggle('active', idx === n - 1);
        });
    }

    function shouldTriggerDiagnosis(targetStep) {
        return targetStep === 3 && currentStep !== 3;
    }

    function goToStep(targetStep) {
        if (shouldTriggerDiagnosis(targetStep) && diagnoseButton) {
            diagnoseButton.click();
            return;
        }
        showStep(targetStep);
    }

    document.getElementById('to-step-2').addEventListener('click', () => goToStep(2));
    document.getElementById('back-to-step-1').addEventListener('click', () => goToStep(1));
    document.getElementById('diagnose-button').addEventListener('click', () => showStep(3));
    document.getElementById('back-to-step-2').addEventListener('click', () => goToStep(2));

    navItems.forEach((item, idx) => {
        const targetStep = idx + 1;
        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        item.addEventListener('click', () => goToStep(targetStep));
        item.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                goToStep(targetStep);
            }
            if (event.key === 'ArrowRight' && currentStep < steps.length) {
                event.preventDefault();
                event.stopPropagation();
                goToStep(currentStep + 1);
            }
            if (event.key === 'ArrowLeft' && currentStep > 1) {
                event.preventDefault();
                event.stopPropagation();
                goToStep(currentStep - 1);
            }
        });
    });

    showStep(1);
});
