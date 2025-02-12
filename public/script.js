document.getElementById("noteForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const title = document.getElementById("noteTitle").value.trim();
    const content = document.getElementById("noteContent").value.trim();

    if (title && content) {
        const noteItem = document.createElement("li");
        noteItem.innerHTML = `<h3>${title}</h3><p>${content}</p>
            <button class="delete-btn">Удалить</button>`;

        document.getElementById("notesList").appendChild(noteItem);

        document.getElementById("noteTitle").value = "";
        document.getElementById("noteContent").value = "";

        noteItem.querySelector(".delete-btn").addEventListener("click", function() {
            noteItem.remove();
        });
    }
});
