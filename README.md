# MegaCharger Deal Analyzer

AI-powered lease pricing and return modeling for Tesla MegaCharger infrastructure investments.

Built for CS 153: Frontier Systems at Stanford University.

## Overview

California's Advanced Clean Trucks (ACT) regulation mandates that 40% of new Class 7/8 truck sales must be zero-emission vehicles by 2030. Tesla's Semi is coming to market with strong initial demand, but large-scale fleet adoption depends on reliable charging infrastructure at corporate logistics hubs.

This tool models the economics of financing MegaCharger installations through lease-backed deals with Fortune 500 counterparties. It helps an investment team evaluate deal attractiveness, assess risk, and model portfolio-level securitization returns.

## Features

### Deal Analysis
- Input deal parameters: charger cost, count, lease term, utilization, counterparty credit rating
- Real-time calculation of unlevered IRR, breakeven utilization, DSCR, and complexity premium vs. benchmark corporate bonds
- AI-generated deal memos via Claude API — structured credit assessments with risk analysis and recommendations

### Sensitivity Analysis
- IRR matrix across utilization rates (40–100%) and lease terms (5–20 years)
- Color-coded cells: green (>15% target), amber (8–15%), red (<8%)

### Securitization Module
- Model portfolio-level returns from bundling multiple leases into an ABS
- Adjustable pool size and advance rate
- Calculates levered equity yield vs. generic corporate bond benchmark

## Tech Stack

- **Frontend**: React + Vite
- **Financial Engine**: JavaScript (NPV, IRR via Newton-Raphson, cash flow scheduling)
- **AI Integration**: Anthropic Claude API (deal memo generation)
- **External Dependencies**: None — fully self-contained

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

The app runs at `http://localhost:5173`. The Claude API integration for deal memo generation requires access through a supported environment.

## Architecture

```
src/
├── main.jsx                  # React entry point
├── App.jsx                   # App wrapper
└── MegaChargerAnalyzer.jsx   # Main application component
    ├── Financial engine (IRR, NPV, cash flow generation)
    ├── Deal analysis tab (metrics + AI memo)
    ├── Sensitivity analysis tab (IRR matrix)
    └── Securitization module tab (ABS modeling)
```

## Financial Model

The core financial engine calculates:
- **Unlevered IRR**: Newton-Raphson method on monthly cash flows
- **Breakeven utilization**: Minimum utilization rate for positive IRR
- **DSCR**: Debt service coverage ratio (monthly revenue / implied debt service)
- **Complexity premium**: Excess return over comparable corporate bond yield, adjusted for counterparty credit rating
- **Securitization returns**: Levered equity yield after senior tranche debt service at a 5.5% coupon

## Author

Brian Donohugh — Stanford University, CS 153 (Spring 2026)
