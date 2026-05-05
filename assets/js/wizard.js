document.addEventListener('DOMContentLoaded', function () {
    const steps = document.querySelectorAll('.step');
    const navItems = document.querySelectorAll('.nav-item');
    const diagnoseButton = document.getElementById('diagnose-button');
    const roadLengthInput = document.getElementById('road-length-input');
    let currentStep = 1;
    let maxReachedStep = 1;

    function hasValidRoadLength() {
        if (!roadLengthInput) {
            return true;
        }
        const value = parseFloat(roadLengthInput.value);
        return !isNaN(value) && value > 0;
    }

    function canAccessStep(targetStep) {
        if (targetStep === 2) {
            return hasValidRoadLength();
        }
        if (targetStep <= maxReachedStep) {
            return true;
        }
        return false;
    }

    function updateNavAccessibility() {
        navItems.forEach((item, idx) => {
            const stepNumber = idx + 1;
            const enabled = canAccessStep(stepNumber);
            item.classList.toggle('disabled', !enabled);
            item.setAttribute('aria-disabled', String(!enabled));
            item.setAttribute('tabindex', enabled ? '0' : '-1');
        });
    }

    function showStep(n) {
        currentStep = n;
        maxReachedStep = Math.max(maxReachedStep, n);

        steps.forEach((step, idx) => {
            step.style.display = idx === n - 1 ? 'block' : 'none';
        });
        navItems.forEach((item, idx) => {
            item.classList.toggle('active', idx === n - 1);
        });

        updateNavAccessibility();
    }

    function shouldTriggerDiagnosis(targetStep) {
        return targetStep === 3 && currentStep !== 3;
    }

    function goToStep(targetStep) {
        if (!canAccessStep(targetStep)) {
            return;
        }

        if (shouldTriggerDiagnosis(targetStep) && diagnoseButton) {
            diagnoseButton.click();
            return;
        }

        showStep(targetStep);
    }

    document.getElementById('to-step-2').addEventListener('click', () => {
        if (!hasValidRoadLength()) {
            if (typeof showWarning === 'function') {
                showWarning('Please enter a valid road length before continuing.');
            }
            roadLengthInput?.focus();
            return;
        }
        goToStep(2);
    });

    document.getElementById('back-to-step-1').addEventListener('click', () => goToStep(1));
    if (diagnoseButton) {
        diagnoseButton.addEventListener('click', () => showStep(3));
    }
    document.getElementById('back-to-step-2').addEventListener('click', () => goToStep(2));

    navItems.forEach((item, idx) => {
        const targetStep = idx + 1;
        item.setAttribute('role', 'button');

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

    roadLengthInput?.addEventListener('input', updateNavAccessibility);

    showStep(1);
});
