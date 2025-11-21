// Back to main page
document.getElementById('backBtn').addEventListener('click', () => {
  window.location.href = "index.html";
});

// Example starter slide
document.getElementById('presentation-area').innerHTML = `
  <h2>Slide 1 – Weather & Migraine</h2>
  <p>This page will become our custom presentation tool.</p>
  <p>You can add slides dynamically using JavaScript.</p>
`;
