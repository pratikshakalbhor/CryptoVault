import { useState, useRef } from "react";

interface VerifyProps {
  onNotify: (msg: string, type: string) => void;
}

export default function Verify({ onNotify }: VerifyProps) {
  const [verifyFile, setVerifyFile] = useState<File | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<null | "valid" | "tampered">(null);
  const [verifyStep, setVerifyStep] = useState(0);
  const verifyInputRef = useRef<HTMLInputElement>(null);

  const BLOCKCHAIN_HASH = "a7f3c2d9e4b1f8a2c5d6e3f0a1b4c7d8e9f2a5b8c1d4e7f0a3b6c9d2e5f8a1b4";
  const TAMPERED_HASH  = "DEADBEEF00000000111111112222222233333333444444445555555566666666abcd";

  const simulateVerify = async () => {
    if (!verifyFile) return;
    setVerifying(true);
    setVerifyResult(null);

    setVerifyStep(1);
    await new Promise(r => setTimeout(r, 700));
    setVerifyStep(2);
    await new Promise(r => setTimeout(r, 800));
    setVerifyStep(3);
    await new Promise(r => setTimeout(r, 900));
    setVerifyStep(4);
    await new Promise(r => setTimeout(r, 600));

    const result = Math.random() > 0.4 ? "valid" : "tampered";
    setVerifyResult(result);
    setVerifying(false);
    setVerifyStep(0);

    if (result === "tampered") onNotify("⚠️ TAMPER DETECTED! File integrity compromised!", "error");
    else onNotify("✅ File integrity verified — VALID!", "success");
  };

  const reset = () => {
    setVerifyFile(null);
    setVerifyResult(null);
    setVerifyStep(0);
  };

  const verifySteps = [
    "Reading file bytes...",
    "Generating SHA-256 hash...",
    "Fetching hash from blockchain...",
    "Comparing hashes...",
  ];

  return (
    <div className="page-container">

      {/* Result */}
      {verifyResult && (
        <div
          className="verify-result-card"
          style={{
            borderColor: verifyResult === "valid" ? "rgba(0,255,157,0.3)" : "rgba(255,59,92,0.3)",
            background: verifyResult === "valid" ? "rgba(0,255,157,0.04)" : "rgba(255,59,92,0.04)",
          }}
        >
          <span style={{ fontSize: 64, display: "block", marginBottom: 16 }}>
            {verifyResult === "valid" ? "✅" : "⚠️"}
          </span>
          <div style={{
            fontSize: 24, fontWeight: 800, letterSpacing: -0.5,
            color: verifyResult === "valid" ? "var(--green)" : "var(--red)",
            marginBottom: 8
          }}>
            {verifyResult === "valid" ? "FILE INTEGRITY VERIFIED" : "TAMPER DETECTED!"}
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)", fontFamily: "var(--font-mono)", marginBottom: 28 }}>
            {verifyResult === "valid"
              ? "Hash matches blockchain record — file is unmodified and authentic"
              : "Hash mismatch detected — file has been modified or corrupted!"}
          </div>

          {/* Hash Comparison */}
          <div className="hash-compare">
            <div className="hash-box">
              <div className="hash-box-label">🔗 Blockchain Hash (Original)</div>
              <div className="hash-box-value" style={{ color: "var(--green)" }}>
                {BLOCKCHAIN_HASH}
              </div>
            </div>
            <div className="hash-box">
              <div className="hash-box-label">📄 Current File Hash</div>
              <div
                className="hash-box-value"
                style={{ color: verifyResult === "valid" ? "var(--green)" : "var(--red)" }}
              >
                {verifyResult === "valid" ? BLOCKCHAIN_HASH : TAMPERED_HASH}
              </div>
            </div>
          </div>

          {/* Match / Mismatch indicator */}
          <div style={{
            marginTop: 16,
            padding: "10px 20px",
            borderRadius: 8,
            display: "inline-block",
            background: verifyResult === "valid" ? "rgba(0,255,157,0.1)" : "rgba(255,59,92,0.1)",
            border: `1px solid ${verifyResult === "valid" ? "rgba(0,255,157,0.3)" : "rgba(255,59,92,0.3)"}`,
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            color: verifyResult === "valid" ? "var(--green)" : "var(--red)",
          }}>
            {verifyResult === "valid" ? "✓ HASH MATCH — File is authentic" : "✗ HASH MISMATCH — File has been altered"}
          </div>

          <div style={{ marginTop: 24 }}>
            <button className="btn btn-outline" onClick={reset}>Verify Another File</button>
          </div>
        </div>
      )}

      {/* Verify Form */}
      {!verifyResult && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

          {/* Left - Upload */}
          <div className="section-card">
            <div className="section-header">
              <span className="section-title">Upload File to Verify</span>
            </div>

            <div
              className="drop-zone"
              style={{ padding: 36 }}
              onClick={() => verifyInputRef.current?.click()}
            >
              <input
                ref={verifyInputRef}
                type="file"
                style={{ display: "none" }}
                onChange={(e) => e.target.files && setVerifyFile(e.target.files[0])}
              />
              <span className="drop-icon">🔍</span>
              <div className="drop-title">Select file to verify</div>
              <div className="drop-sub">Compare hash with blockchain record</div>
            </div>

            {verifyFile && (
              <div className="file-selected" style={{ marginTop: 16 }}>
                <div className="file-icon-box">📄</div>
                <div className="file-info">
                  <div className="file-name">{verifyFile.name}</div>
                  <div className="file-size">
                    {(verifyFile.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              </div>
            )}

            {/* Verifying animation */}
            {verifying && (
              <div style={{ marginTop: 20 }}>
                {verifySteps.map((step, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "8px 0",
                      opacity: verifyStep > i ? 1 : 0.3,
                      transition: "opacity 0.3s",
                    }}
                  >
                    <span style={{ fontSize: 14 }}>
                      {verifyStep > i + 1 ? "✅" : verifyStep === i + 1 ? "⏳" : "○"}
                    </span>
                    <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button
              className="btn btn-primary"
              style={{ marginTop: 16, width: "100%", justifyContent: "center" }}
              disabled={!verifyFile || verifying}
              onClick={simulateVerify}
            >
              {verifying ? "⏳ Verifying on Blockchain..." : "◎ Verify Integrity"}
            </button>
          </div>

          {/* Right - How it works */}
          <div className="section-card">
            <div className="section-title" style={{ marginBottom: 20 }}>How Verification Works</div>
            {[
              { n: "01", icon: "📂", title: "Upload Same File", desc: "Upload the file whose integrity you want to check." },
              { n: "02", icon: "📝", title: "Hash Generated", desc: "New SHA-256 hash computed from current file content." },
              { n: "03", icon: "🔗", title: "Blockchain Lookup", desc: "Original hash fetched from Ethereum smart contract." },
              { n: "04", icon: "⚖️", title: "Compare", desc: "Hashes match → Valid ✅. Different → Tampered ⚠️" },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 14, marginBottom: 20 }}>
                <div style={{
                  width: 36, height: 36,
                  borderRadius: 8,
                  background: "rgba(0,212,255,0.08)",
                  border: "1px solid rgba(0,212,255,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent)",
                  flexShrink: 0
                }}>{s.n}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>
                    {s.icon} {s.title}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>{s.desc}</div>
                </div>
              </div>
            ))}

            <div style={{
              marginTop: 8,
              padding: 14,
              background: "rgba(0,212,255,0.05)",
              border: "1px solid rgba(0,212,255,0.15)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--muted)",
              fontFamily: "var(--font-mono)",
              lineHeight: 1.7,
            }}>
              💡 SHA-256 is a one-way mathematical function. The same file always produces the same hash. Any modification — even 1 character — produces a completely different hash.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}