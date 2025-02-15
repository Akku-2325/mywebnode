// public/script.js
document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form[action="/products"]');
    form.addEventListener('submit', function(event) {
        event.preventDefault();

        const url = new URL(form.action, window.location.origin);
        const formData = new FormData(form);

        for (let pair of formData.entries()) {
            if (pair[1]) {  // only append if value is not empty
                url.searchParams.append(pair[0], pair[1]);
            }
        }

        window.location.href = url.toString();
    });
});