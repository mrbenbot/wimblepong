import Navigation from "./Navigation";

export default function LandingPage() {
  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div style={{ maxWidth: 1000, textAlign: "center", fontSize: "1.5em" }}>
        <Navigation />
        <div style={{ display: "flex", justifyContent: "center", marginTop: "50px" }}>
          <img src="/wp2124.png" style={{ height: "400px" }}></img>
        </div>
        <h1>This is WimblePong.</h1>
        <p>Is now the time for freedom?</p>
      </div>
    </div>
  );
}
