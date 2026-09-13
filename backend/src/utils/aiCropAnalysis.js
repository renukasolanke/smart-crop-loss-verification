const sharp = require("sharp");

/**
 * PROTOTYPE / DEMO MODE
 * This is a heuristic color-analysis approach, NOT a trained CNN model.
 * It estimates crop health by analyzing the ratio of green (healthy vegetation)
 * vs brown/yellow/dry pixels in the image. Real deployment would require
 * a properly trained model (e.g. MobileNet/EfficientNet transfer learning)
 * on a labeled crop-damage dataset.
 */
const analyzeCropDamage = async (imageBuffer) => {
  try {
    const { data, info } = await sharp(imageBuffer)
      .resize(80, 80, { fit: "fill" })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const totalPixels = info.width * info.height;
    let greenPixels = 0;
    let brownYellowPixels = 0;
    let darkPixels = 0;

    for (let i = 0; i < data.length; i += 3) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (r + g + b) / 3;

      if (brightness < 40) {
        darkPixels++;
        continue;
      }

      // Healthy vegetation: green channel dominant
      if (g > r + 12 && g > b + 12) {
        greenPixels++;
      }
      // Damaged/dry: brown, yellow, or reddish-brown tones
      else if (r > g && r > 80 && g > 40 && b < g) {
        brownYellowPixels++;
      }
    }

    const vegetationPixels = greenPixels + brownYellowPixels;
    const cropDetected = vegetationPixels / totalPixels > 0.15;

    let damagePercent;
    let category;

    if (!cropDetected) {
      damagePercent = null;
      category = "Crop not clearly detected";
    } else {
      const greenRatio = greenPixels / vegetationPixels;
      damagePercent = Math.round((1 - greenRatio) * 100);
      damagePercent = Math.max(3, Math.min(97, damagePercent));

      if (damagePercent < 25) category = "Healthy";
      else if (damagePercent < 60) category = "Partially damaged";
      else category = "Severely damaged";
    }

    return {
      mode: "prototype_heuristic",
      cropDetected,
      damagePercent,
      category,
      note: "Estimated using color-pattern analysis (demo mode) — not a trained AI model.",
    };
  } catch (err) {
    console.error("AI analysis error:", err.message);
    return {
      mode: "prototype_heuristic",
      cropDetected: false,
      damagePercent: null,
      category: "Analysis failed",
      note: "Could not analyze image.",
    };
  }
};

/**
 * EXPERIMENTAL / LOW-CONFIDENCE CROP SUGGESTION
 * This does NOT reliably identify crop type. Distinguishing crop species
 * from a single photo using color/texture heuristics alone is not feasible
 * without a properly trained model on a large labeled dataset. This function
 * only provides a rough, low-confidence suggestion based on very broad visual
 * traits (color tone, texture uniformity). It is shown to the farmer as an
 * optional hint only -- the farmer must always confirm or override manually.
 */
const suggestCropType = async (imageBuffer) => {
  try {
    const { data, info } = await sharp(imageBuffer)
      .resize(60, 60, { fit: "fill" })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    let sumG = 0, sumR = 0, sumB = 0;
    let variance = 0;
    const pixelCount = info.width * info.height;

    for (let i = 0; i < data.length; i += 3) {
      sumR += data[i];
      sumG += data[i + 1];
      sumB += data[i + 2];
    }
    const avgR = sumR / pixelCount;
    const avgG = sumG / pixelCount;
    const avgB = sumB / pixelCount;

    for (let i = 0; i < data.length; i += 3) {
      variance += Math.pow(data[i + 1] - avgG, 2);
    }
    variance = variance / pixelCount;

    // Very rough heuristic buckets -- NOT a reliable classifier
    let suggestion;
    if (avgG > avgR + 20 && variance < 800) {
      suggestion = "Rice (Paddy)";
    } else if (avgG > avgR + 10 && variance >= 800) {
      suggestion = "Sugarcane";
    } else if (avgR > avgG && avgB < avgG) {
      suggestion = "Cotton";
    } else {
      suggestion = "Other";
    }

    return {
      mode: "experimental_low_confidence",
      suggestion,
      confidence: "low",
      note: "This is an experimental, low-confidence suggestion based on basic color analysis. It is not a reliable crop classifier. Please verify and select the correct crop type manually.",
    };
  } catch (err) {
    return {
      mode: "experimental_low_confidence",
      suggestion: null,
      confidence: "low",
      note: "Could not generate a suggestion for this image.",
    };
  }
};

module.exports = { analyzeCropDamage, suggestCropType };

