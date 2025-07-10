// Function to load an external file into an element
function loadComponent(id, file) {
    const el = document.getElementById(id);
    if (!el) return;
    fetch(file)
        .then(response => response.text())
        .then(data => el.innerHTML = data)
        .catch(error => console.error('Error loading component:', error));
}

// Load header and footer
document.addEventListener("DOMContentLoaded", function() {
    loadComponent("header", "../../includes/header.html");
    loadComponent("footer", "../../includes/footer.html");
    loadComponent("warning-container", "../../includes/warning-modal.html");
});