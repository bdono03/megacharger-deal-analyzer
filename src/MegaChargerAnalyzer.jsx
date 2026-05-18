import { useState, useMemo, useCallback } from "react";

const FONT_URL = "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&family=DM+Mono:wght@400;500&display=swap";

const CREDIT_RATINGS = ["AAA", "AA+", "AA", "AA-", "A+", "A", "A-", "BBB+", "BBB", "BBB-"];
const SPREAD_MAP = { "AAA": 0.4, "AA+": 0.5, "AA": 0.6, "AA-": 0.7, "A+": 0.85, "A": 1.0, "A-": 1.2, "BBB+": 1.5, "BBB": 1.8, "BBB-": 2.2 };
const ADVANCE_RATES = [0.70, 0.75, 0.80, 0.85];

function calcIRR(cashflows, guess = 0.1) {
  let rate = guess;
  for (let i = 0; i < 200; i++) {
    let npv = 0, dnpv = 0;
    for (let t = 0; t < cashflows.length; t++) {
      const d = Math.pow(1 + rate, t);
      npv += cashflows[t] / d;
      dnpv -= t * cashflows[t] / (d * (1 + rate));
    }
    if (Math.abs(npv) < 0.01) break;
    rate -= npv / dnpv;
    if (rate < -0.99) rate = -0.5;
    if (rate > 10) rate = 2;
  }
  return rate;
}

function calcNPV(cashflows, rate) {
  return cashflows.reduce((sum, cf, t) => sum + cf / Math.pow(1 + rate / 12, t), 0);
}

function generateCashflows(params) {
  const { costPerCharger, numChargers, leaseTerm, utilization, monthlyRevenuePerCharger } = params;
  const totalCost = costPerCharger * numChargers;
  const monthlyRevenue = monthlyRevenuePerCharger * numChargers * (utilization / 100);
  const months = leaseTerm * 12;
  const flows = [-totalCost];
  for (let m = 1; m <= months; m++) flows.push(monthlyRevenue);
  return flows;
}

function calcBreakeven(params) {
  for (let u = 1; u <= 100; u++) {
    const flows = generateCashflows({ ...params, utilization: u });
    const irr = calcIRR(flows);
    if (!isNaN(irr) && irr > 0) return u;
  }
  return 100;
}

function Stat({ label, value, sub, danger, success }) {
  return (
    <div style={{ background: "#f8f7f5", borderRadius: 8, padding: "14px 16px" }}>
      <div style={{ fontFamily: "'DM Sans'", fontSize: 11, color: "#8a8780", letterSpacing: "0.04em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: "'DM Mono'", fontSize: 22, fontWeight: 500, color: danger ? "#c0392b" : success ? "#1a7a4c" : "#1a1a18" }}>{value}</div>
      {sub && <div style={{ fontFamily: "'DM Sans'", fontSize: 11, color: "#8a8780", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function SliderInput({ label, value, onChange, min, max, step, format }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: "#5a5850" }}>{label}</span>
        <span style={{ fontFamily: "'DM Mono'", fontSize: 13, fontWeight: 500, color: "#1a1a18" }}>{format ? format(value) : value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: "#1a1a18", height: 4, cursor: "pointer" }} />
    </div>
  );
}

function Tab({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      fontFamily: "'DM Sans'", fontSize: 13, fontWeight: active ? 500 : 400,
      color: active ? "#1a1a18" : "#8a8780", background: "none", border: "none",
      borderBottom: active ? "2px solid #1a1a18" : "2px solid transparent",
      padding: "8px 16px", cursor: "pointer", transition: "all 0.2s"
    }}>{label}</button>
  );
}

function DealMemo({ params, metrics, isGenerating, memo, onGenerate }) {
  return (
    <div style={{ marginTop: 24, padding: 20, background: "#f8f7f5", borderRadius: 10, border: "1px solid #eae8e3" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontFamily: "'DM Sans'", fontSize: 14, fontWeight: 500, color: "#1a1a18" }}>AI deal memo</span>
        <button onClick={onGenerate} disabled={isGenerating}
          style={{
            fontFamily: "'DM Sans'", fontSize: 12, fontWeight: 500, padding: "6px 14px",
            background: isGenerating ? "#d5d3ce" : "#1a1a18", color: "#f8f7f5", border: "none",
            borderRadius: 6, cursor: isGenerating ? "default" : "pointer"
          }}>
          {isGenerating ? "Analyzing..." : "Generate memo"}
        </button>
      </div>
      {memo ? (
        <div style={{ fontFamily: "'DM Sans'", fontSize: 13, lineHeight: 1.7, color: "#3a3a35", whiteSpace: "pre-wrap" }}>{memo}</div>
      ) : (
        <div style={{ fontFamily: "'DM Sans'", fontSize: 13, color: "#8a8780", fontStyle: "italic" }}>
          Click "Generate memo" to have Claude analyze this deal and produce a structured credit assessment.
        </div>
      )}
    </div>
  );
}

function SecuritizationModule({ params, metrics }) {
  const [poolSize, setPoolSize] = useState(30);
  const [advanceRate, setAdvanceRate] = useState(0.80);

  const absMetrics = useMemo(() => {
    const totalCost = params.costPerCharger * params.numChargers;
    const poolValue = totalCost * poolSize;
    const annualCashPerDeal = metrics.monthlyRevenue * 12;
    const totalAnnualCash = annualCashPerDeal * poolSize;
    const debtIssued = poolValue * advanceRate;
    const equityRetained = poolValue - debtIssued;
    const seniorCoupon = 0.055;
    const debtService = debtIssued * seniorCoupon;
    const residualCash = totalAnnualCash - debtService;
    const equityYield = equityRetained > 0 ? residualCash / equityRetained : 0;
    return { poolValue, debtIssued, equityRetained, debtService, totalAnnualCash, residualCash, equityYield, seniorCoupon };
  }, [poolSize, advanceRate, params, metrics]);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <SliderInput label="Number of leases in pool" value={poolSize} onChange={setPoolSize} min={5} max={100} step={5} />
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: "#5a5850", marginBottom: 8 }}>Advance rate</div>
          <div style={{ display: "flex", gap: 8 }}>
            {ADVANCE_RATES.map(r => (
              <button key={r} onClick={() => setAdvanceRate(r)} style={{
                fontFamily: "'DM Mono'", fontSize: 12, padding: "6px 14px", borderRadius: 6,
                border: advanceRate === r ? "1.5px solid #1a1a18" : "1px solid #d5d3ce",
                background: advanceRate === r ? "#1a1a18" : "white",
                color: advanceRate === r ? "white" : "#5a5850", cursor: "pointer"
              }}>{Math.round(r * 100)}%</button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10, marginBottom: 16 }}>
        <Stat label="Pool value" value={`$${(absMetrics.poolValue / 1e6).toFixed(1)}M`} />
        <Stat label="Senior debt issued" value={`$${(absMetrics.debtIssued / 1e6).toFixed(1)}M`} sub={`at ${(absMetrics.seniorCoupon * 100).toFixed(1)}% coupon`} />
        <Stat label="Equity retained" value={`$${(absMetrics.equityRetained / 1e6).toFixed(1)}M`} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10, marginBottom: 16 }}>
        <Stat label="Annual pool cash flow" value={`$${(absMetrics.totalAnnualCash / 1e6).toFixed(2)}M`} />
        <Stat label="Annual debt service" value={`$${(absMetrics.debtService / 1e6).toFixed(2)}M`} />
        <Stat label="Residual to equity" value={`$${(absMetrics.residualCash / 1e6).toFixed(2)}M`} success />
      </div>
      <div style={{ padding: 16, background: "#1a1a18", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontFamily: "'DM Sans'", fontSize: 11, color: "#8a8780", letterSpacing: "0.04em" }}>Levered equity yield (gross IRR)</div>
          <div style={{ fontFamily: "'DM Mono'", fontSize: 32, fontWeight: 500, color: absMetrics.equityYield > 0.20 ? "#2ecc71" : "#f5c542", marginTop: 4 }}>
            {(absMetrics.equityYield * 100).toFixed(1)}%
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "'DM Sans'", fontSize: 11, color: "#8a8780" }}>vs. generic corporate bond</div>
          <div style={{ fontFamily: "'DM Mono'", fontSize: 18, color: "#8a8780", marginTop: 4 }}>~6.0%</div>
        </div>
      </div>
    </div>
  );
}

function SensitivityTable({ params }) {
  const utilRates = [40, 50, 60, 70, 80, 90, 100];
  const terms = [5, 7, 10, 15, 20];

  return (
    <div style={{ overflowX: "auto", marginTop: 16 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'DM Mono'", fontSize: 12 }}>
        <thead>
          <tr>
            <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 11, color: "#8a8780", fontFamily: "'DM Sans'", fontWeight: 400, borderBottom: "1px solid #eae8e3" }}>
              IRR by util / term
            </th>
            {terms.map(t => (
              <th key={t} style={{ padding: "8px 10px", textAlign: "right", fontSize: 11, color: "#8a8780", fontFamily: "'DM Sans'", fontWeight: 400, borderBottom: "1px solid #eae8e3" }}>
                {t}yr
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {utilRates.map(u => (
            <tr key={u}>
              <td style={{ padding: "6px 10px", color: "#5a5850", fontFamily: "'DM Sans'", fontSize: 12, borderBottom: "1px solid #f2f0ec" }}>{u}% util</td>
              {terms.map(t => {
                const flows = generateCashflows({ ...params, utilization: u, leaseTerm: t });
                const irr = calcIRR(flows);
                const annualized = (Math.pow(1 + irr, 12) - 1);
                const display = isNaN(annualized) || annualized < -0.99 ? "n/a" : `${(annualized * 100).toFixed(1)}%`;
                const color = annualized >= 0.15 ? "#1a7a4c" : annualized >= 0.08 ? "#b8860b" : "#c0392b";
                return (
                  <td key={t} style={{ padding: "6px 10px", textAlign: "right", color: isNaN(annualized) ? "#ccc" : color, borderBottom: "1px solid #f2f0ec" }}>
                    {display}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function MegaChargerAnalyzer() {
  const [tab, setTab] = useState("deal");
  const [costPerCharger, setCostPerCharger] = useState(250000);
  const [numChargers, setNumChargers] = useState(8);
  const [leaseTerm, setLeaseTerm] = useState(10);
  const [utilization, setUtilization] = useState(65);
  const [creditRating, setCreditRating] = useState("A");
  const [monthlyRevenuePerCharger, setMonthlyRevenuePerCharger] = useState(5000);
  const [memo, setMemo] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const params = { costPerCharger, numChargers, leaseTerm, utilization, monthlyRevenuePerCharger };

  const metrics = useMemo(() => {
    const totalCost = costPerCharger * numChargers;
    const monthlyRevenue = monthlyRevenuePerCharger * numChargers * (utilization / 100);
    const annualRevenue = monthlyRevenue * 12;
    const flows = generateCashflows(params);
    const irr = calcIRR(flows);
    const annualizedIRR = Math.pow(1 + irr, 12) - 1;
    const breakeven = calcBreakeven(params);
    const npv = calcNPV(flows, 0.08);
    const dscr = monthlyRevenue / (totalCost / (leaseTerm * 12));
    const spread = SPREAD_MAP[creditRating] || 1.0;
    const benchmarkYield = (4.5 + spread) / 100;
    const excessReturn = annualizedIRR - benchmarkYield;
    return { totalCost, monthlyRevenue, annualRevenue, irr: annualizedIRR, breakeven, npv, dscr, benchmarkYield, excessReturn };
  }, [costPerCharger, numChargers, leaseTerm, utilization, monthlyRevenuePerCharger, creditRating]);

  const generateMemo = useCallback(async () => {
    setIsGenerating(true);
    try {
      const prompt = `You are a credit analyst at a renewable energy private credit firm. Analyze this MegaCharger lease deal and write a concise deal memo (300 words max).

Deal parameters:
- ${numChargers} Tesla MegaChargers at $${costPerCharger.toLocaleString()} each (total: $${metrics.totalCost.toLocaleString()})
- Lease term: ${leaseTerm} years
- Counterparty credit rating: ${creditRating}
- Contracted utilization: ${utilization}%
- Monthly revenue per charger at full utilization: $${monthlyRevenuePerCharger.toLocaleString()}

Computed metrics:
- Unlevered IRR: ${(metrics.irr * 100).toFixed(1)}%
- Breakeven utilization: ${metrics.breakeven}%
- Annual revenue: $${metrics.annualRevenue.toLocaleString()}
- DSCR: ${metrics.dscr.toFixed(2)}x
- Comparable corporate bond yield (${creditRating}): ${(metrics.benchmarkYield * 100).toFixed(1)}%
- Excess return over benchmark: ${(metrics.excessReturn * 100).toFixed(1)}%

Context: California's Advanced Clean Trucks rule mandates 40% ZEV truck sales by 2030. Tesla's Semi is coming to market with strong initial demand. Fortune 500 companies want the trucks but won't pay for charging infrastructure. This lease finances MegaCharger installation at logistics hubs.

Structure the memo as:
1. DEAL SUMMARY (2-3 sentences)
2. RETURN ANALYSIS (assess attractiveness vs benchmark credit, highlight the complexity premium)
3. RISK FACTORS (utilization risk, technology risk, regulatory risk, counterparty risk)
4. RECOMMENDATION (approve/flag/decline with conditions)

Be specific and quantitative. Reference the breakeven utilization as a margin of safety metric.`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }]
        })
      });
      const data = await response.json();
      const text = data.content?.map(b => b.text || "").join("\n") || "Error generating memo.";
      setMemo(text);
    } catch (e) {
      setMemo("Failed to generate memo. Check API connection.");
    }
    setIsGenerating(false);
  }, [numChargers, costPerCharger, leaseTerm, creditRating, utilization, monthlyRevenuePerCharger, metrics]);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", maxWidth: 720, margin: "0 auto", padding: "2rem 0" }}>
      <link href={FONT_URL} rel="stylesheet" />

      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.08em", color: "#8a8780", marginBottom: 6 }}>GOODFINCH CAPITAL</div>
        <h1 style={{ fontFamily: "'DM Sans'", fontSize: 26, fontWeight: 500, color: "#1a1a18", margin: "0 0 6px", lineHeight: 1.2 }}>
          MegaCharger deal analyzer
        </h1>
        <p style={{ fontSize: 14, color: "#8a8780", margin: 0, lineHeight: 1.5 }}>
          Lease pricing, return modeling, and AI credit analysis for Tesla MegaCharger infrastructure investments
        </p>
      </div>

      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #eae8e3", marginBottom: 24 }}>
        <Tab label="Deal analysis" active={tab === "deal"} onClick={() => setTab("deal")} />
        <Tab label="Sensitivity" active={tab === "sensitivity"} onClick={() => setTab("sensitivity")} />
        <Tab label="Securitization" active={tab === "securitization"} onClick={() => setTab("securitization")} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "260px minmax(0, 1fr)", gap: 28 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, color: "#5a5850", marginBottom: 14 }}>Deal parameters</div>
          <SliderInput label="Cost per charger" value={costPerCharger} onChange={setCostPerCharger}
            min={100000} max={500000} step={10000} format={v => `$${(v / 1000)}K`} />
          <SliderInput label="Number of chargers" value={numChargers} onChange={setNumChargers}
            min={1} max={30} step={1} />
          <SliderInput label="Lease term (years)" value={leaseTerm} onChange={setLeaseTerm}
            min={3} max={25} step={1} />
          <SliderInput label="Utilization" value={utilization} onChange={setUtilization}
            min={10} max={100} step={5} format={v => `${v}%`} />
          <SliderInput label="Revenue / charger / mo" value={monthlyRevenuePerCharger} onChange={setMonthlyRevenuePerCharger}
            min={1000} max={15000} step={500} format={v => `$${v.toLocaleString()}`} />

          <div style={{ marginBottom: 16, marginTop: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: "#5a5850" }}>Counterparty rating</span>
            </div>
            <select value={creditRating} onChange={e => setCreditRating(e.target.value)}
              style={{
                width: "100%", padding: "8px 10px", fontFamily: "'DM Mono'", fontSize: 13,
                border: "1px solid #d5d3ce", borderRadius: 6, background: "white", color: "#1a1a18"
              }}>
              {CREDIT_RATINGS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        <div>
          {tab === "deal" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10, marginBottom: 10 }}>
                <Stat label="Total investment" value={`$${(metrics.totalCost / 1e6).toFixed(2)}M`} />
                <Stat label="Annual revenue" value={`$${(metrics.annualRevenue / 1000).toFixed(0)}K`} />
                <Stat label="Monthly cash flow" value={`$${metrics.monthlyRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10, marginBottom: 10 }}>
                <Stat label="Unlevered IRR" value={`${(metrics.irr * 100).toFixed(1)}%`}
                  success={metrics.irr >= 0.12} danger={metrics.irr < 0.05}
                  sub={`vs ${(metrics.benchmarkYield * 100).toFixed(1)}% benchmark`} />
                <Stat label="Breakeven utilization" value={`${metrics.breakeven}%`}
                  success={metrics.breakeven < utilization - 15}
                  sub={`${utilization - metrics.breakeven}pt cushion`} />
                <Stat label="DSCR" value={`${metrics.dscr.toFixed(2)}x`}
                  success={metrics.dscr >= 1.3} danger={metrics.dscr < 1.0} />
              </div>

              <div style={{ padding: 14, background: metrics.excessReturn > 0.05 ? "#eafaf1" : metrics.excessReturn > 0 ? "#fef9e7" : "#fdecea",
                borderRadius: 8, marginBottom: 8 }}>
                <div style={{ fontFamily: "'DM Sans'", fontSize: 13, color: "#3a3a35" }}>
                  <span style={{ fontWeight: 500 }}>Complexity premium: </span>
                  This deal yields {(metrics.excessReturn * 100).toFixed(1)}% above a comparable {creditRating}-rated corporate bond.
                  {metrics.excessReturn > 0.08
                    ? " Strong value creation from the infrastructure complexity wrapper."
                    : metrics.excessReturn > 0
                      ? " Moderate premium — may need tighter pricing or higher utilization."
                      : " Negative excess return — deal does not compensate for complexity risk."}
                </div>
              </div>

              <DealMemo params={params} metrics={metrics} isGenerating={isGenerating} memo={memo} onGenerate={generateMemo} />
            </div>
          )}

          {tab === "sensitivity" && (
            <div>
              <div style={{ fontSize: 13, color: "#5a5850", marginBottom: 12, lineHeight: 1.6 }}>
                Annualized IRR across utilization rates and lease terms. Green cells exceed 15% target return, amber 8–15%, red below 8%.
              </div>
              <SensitivityTable params={params} />
            </div>
          )}

          {tab === "securitization" && (
            <SecuritizationModule params={params} metrics={metrics} />
          )}
        </div>
      </div>
    </div>
  );
}
