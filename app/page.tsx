export default function HomePage() {
  return (
    <main>
      <h1>YouTube Auto Poster</h1>
      <p>Automated daily uploader and scheduler for YouTube.</p>
      <ul>
        <li>Uses Google Sheets as the queue</li>
        <li>Daily scheduled function and retry worker</li>
        <li>Alerts on failures</li>
      </ul>
    </main>
  );
}
