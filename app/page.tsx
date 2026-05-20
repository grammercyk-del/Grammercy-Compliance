export default function Home() {
  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h1>✅ KIPL Dashboard Working</h1>

      <p>Kesari Infrabuild Pvt. Ltd.</p>
      <p>Compliance dashboard by KIPL for Grammercy</p>

      <div style={{ marginTop: "20px" }}>
        <a href="/login" style={{ marginRight: "20px" }}>
          Go to Login
        </a>

        <a href="/dashboard">
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}