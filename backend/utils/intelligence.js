const db = require('../config/db');

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(value)));

function createReport(property, facilities = []) {
  const city = String(property.city || '').trim().toLowerCase();
  const issues = String(property.known_issues || '').trim();
  const facilityTypes = new Set(facilities.map((facility) => facility.facility_type));

  let growthScore = 52;
  let investmentScore = 50;
  let livabilityScore = 48;
  let riskScore = issues ? 42 : 15;
  const highlights = [];
  const cautions = [];

  if (city === 'pune') {
    growthScore += 23;
    investmentScore += 18;
    highlights.push('Pune location profile supports a stronger long-term growth outlook.');
  } else {
    highlights.push('Location profile is available; verify local growth plans before investing.');
  }

  if (facilityTypes.has('transport')) {
    growthScore += 8;
    investmentScore += 7;
    livabilityScore += 10;
    highlights.push('Nearby transport improves daily connectivity and resale appeal.');
  }
  if (facilityTypes.has('school')) {
    livabilityScore += 12;
    highlights.push('Nearby schools improve family-use convenience.');
  }
  if (facilityTypes.has('hospital')) {
    livabilityScore += 10;
    highlights.push('Nearby healthcare improves livability.');
  }
  if (facilityTypes.has('market') || facilityTypes.has('park')) {
    livabilityScore += 7;
  }
  if (property.needs_3d_shoot) {
    highlights.push('A 3D/360° tour has been requested for better remote evaluation.');
  }
  if (issues) {
    cautions.push(`Seller disclosure: ${issues}`);
    highlights.push('Risk disclosure is available; review it before making a decision.');
  }

  growthScore = clamp(growthScore);
  investmentScore = clamp(investmentScore + Math.max(0, growthScore - 55) * 0.25);
  livabilityScore = clamp(livabilityScore);
  riskScore = clamp(riskScore);

  const futureOutlook = growthScore >= 75 ? 'high' : growthScore >= 60 ? 'moderate' : 'watch';
  const summary = `Rule-based intelligence report for ${property.title}. It combines location, available facilities, and seller disclosures; it is not a financial, legal, or flood-safety guarantee.`;

  return {
    growth_score: growthScore,
    investment_score: investmentScore,
    livability_score: livabilityScore,
    risk_score: riskScore,
    future_outlook: futureOutlook,
    summary,
    highlights,
    cautions,
  };
}

async function saveReport(propertyId, report) {
  await db.query(
    `INSERT INTO property_intelligence
       (property_id, growth_score, investment_score, livability_score, risk_score, future_outlook, summary, highlights_json, cautions_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       growth_score = VALUES(growth_score),
       investment_score = VALUES(investment_score),
       livability_score = VALUES(livability_score),
       risk_score = VALUES(risk_score),
       future_outlook = VALUES(future_outlook),
       summary = VALUES(summary),
       highlights_json = VALUES(highlights_json),
       cautions_json = VALUES(cautions_json),
       generated_at = CURRENT_TIMESTAMP`,
    [
      propertyId,
      report.growth_score,
      report.investment_score,
      report.livability_score,
      report.risk_score,
      report.future_outlook,
      report.summary,
      JSON.stringify(report.highlights),
      JSON.stringify(report.cautions),
    ]
  );
}

async function buildAndSaveReport(property) {
  const [facilities] = await db.query(
    `SELECT facility_type, facility_name, distance_km
     FROM nearby_facilities WHERE property_id = ?`,
    [property.property_id]
  );
  const report = createReport(property, facilities);
  await saveReport(property.property_id, report);
  return report;
}

module.exports = { buildAndSaveReport, createReport };
