document.getElementById('compress-button').addEventListener('click', async () => {
    const input = document.getElementById('file-input');
    const files = input.files;
    const progressContainer = document.getElementById('progress-container');
    progressContainer.innerHTML = ''; // Clear previous progress

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Simulated compression process
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.classList.add('preview');
            document.getElementById('preview-container').appendChild(img);
        };
        reader.readAsDataURL(file);

        // Simulated progress
        const progressDiv = document.createElement('div');
        progressDiv.innerText = `Compressing ${file.name}...`;
        progressContainer.appendChild(progressDiv);
        setTimeout(() => {
            progressDiv.innerText = `${file.name} compressed!`;
        }, 1000 * (i + 1)); // Simulate 1 second for each
    }
});