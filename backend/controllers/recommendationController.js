const db = require('../config/db');
const { buildAndSaveReport } = require('../utils/intelligence');

function platformPrice(property) {
  const min = Math.round(Number(property.price) * 1.05);
  const max = Math.round(Number(property.price) * 1.10);
  return {
    platform_price_min: min,
    platform_price_max: max,
    price_range: `₹${min.toLocaleString('en-IN')} - ₹${max.toLocaleString('en-IN')}`,
  };
}

function scoreProperty(property, preference, report) {
  const reasons = [];
  let score = 0;
  const midpoint = Number(property.price) * 1.075;

  if (preference.preferred_city) {
    if (String(property.city).toLowerCase() === String(preference.preferred_city).toLowerCase()) {
      score += 26;
      reasons.push(`Matches your preferred city: ${property.city}.`);
    }
  } else score += 8;

  if (preference.preferred_type) {
    if (property.property_type === preference.preferred_type) {
      score += 20;
      reasons.push(`Matches your preferred property type: ${property.property_type}.`);
    }
  } else score += 8;

  if (preference.budget_min || preference.budget_max) {
    const minimum = Number(preference.budget_min || 0);
    const maximum = Number(preference.budget_max || Number.MAX_SAFE_INTEGER);
    if (midpoint >= minimum && midpoint <= maximum) {
      score += 25;
      reasons.push('Platform price range fits your saved budget.');
    } else if (midpoint <= maximum * 1.1) {
      score += 10;
      reasons.push('Platform price is close to your saved budget.');
    }
  } else score += 10;

  if (preference.min_area_sqft) {
    if (Number(property.area_sqft) >= Number(preference.min_area_sqft)) {
      score += 10;
      reasons.push('Meets your minimum area requirement.');
    }
  } else score += 5;

  if (preference.purpose === 'investment') {
    score += Math.round(Number(report.investment_score) * 0.22);
    score += Math.round(Number(report.growth_score) * 0.12);
    reasons.push(`Investment score: ${report.investment_score}/100 with ${report.future_outlook} outlook.`);
  } else {
    score += Math.round(Number(report.livability_score) * 0.25);
    reasons.push(`Livability score: ${report.livability_score}/100 for self-use.`);
  }
  if (Number(report.risk_score) >= 40) reasons.push('Review the risk disclosures before deciding.');

  return { suitability_score: Math.min(100, Math.round(score)), reasons };
}

exports.getRecommendations = async (req, res) => {
  try {
    const [preferences] = await db.query(
      'SELECT * FROM user_preferences WHERE user_id = ?',
      [req.user.userId]
    );
    if (preferences.length === 0) {
      return res.status(400).json({
        message: 'Save your buyer preferences before requesting recommendations.',
      });
    }

    const preference = preferences[0];
    const [properties] = await db.query(
      `SELECT p.*, image.image_url AS primary_image, intelligence.*
       FROM properties p
       LEFT JOIN property_images image ON image.property_id = p.property_id AND image.is_primary = 1
       LEFT JOIN property_intelligence intelligence ON intelligence.property_id = p.property_id
       WHERE p.status = 'verified'`
    );

    const recommendations = await Promise.all(properties.map(async (property) => {
      let report = {
        growth_score: property.growth_score,
        investment_score: property.investment_score,
        livability_score: property.livability_score,
        risk_score: property.risk_score,
        future_outlook: property.future_outlook,
      };
      if (!report.growth_score) report = await buildAndSaveReport(property);
      const match = scoreProperty(property, preference, report);
      return {
        property_id: property.property_id,
        title: property.title,
        property_type: property.property_type,
        area_sqft: property.area_sqft,
        city: property.city,
        state: property.state,
        primary_image: property.primary_image || null,
        growth_tag: property.growth_tag,
        ...platformPrice(property),
        ...match,
        intelligence: report,
      };
    }));

    recommendations.sort((a, b) => b.suitability_score - a.suitability_score);
    res.json({
      purpose: preference.purpose,
      data_note: 'Recommendations are rule-based decision support, not a purchase or investment guarantee.',
      recommendations,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not generate recommendations.', error: err.message });
  }
};
