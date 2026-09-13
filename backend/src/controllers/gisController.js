const pool = require("../config/db");

// Insert sample demo plots (run once)
const seedPlots = async (req, res) => {
  try {
    const plots = [
      {
        gat_number: "145",
        owner_name: "Sunita Deshmukh",
        village: "Pimpri",
        taluka: "Haveli",
        district: "Pune",
        area_acres: 2.4,
        coords: "18.6280,73.8000 18.6295,73.8000 18.6295,73.8020 18.6280,73.8020 18.6280,73.8000",
      },
      {
        gat_number: "212",
        owner_name: "Vikram Jadhav",
        village: "Chinchwad",
        taluka: "Haveli",
        district: "Pune",
        area_acres: 1.8,
        coords: "18.6450,73.7650 18.6465,73.7650 18.6465,73.7670 18.6450,73.7670 18.6450,73.7650",
      },
      {
        gat_number: "88",
        owner_name: "Ramesh Patil",
        village: "Wakad",
        taluka: "Mulshi",
        district: "Pune",
        area_acres: 3.1,
        coords: "18.5980,73.7620 18.5995,73.7620 18.5995,73.7640 18.5980,73.7640 18.5980,73.7620",
      },
      {
        gat_number: "301",
        owner_name: "Demo Owner D",
        village: "Hinjawadi",
        taluka: "Mulshi",
        district: "Pune",
        area_acres: 2.0,
        coords: "18.5900,73.7300 18.5915,73.7300 18.5915,73.7320 18.5900,73.7320 18.5900,73.7300",
      },
    ];

    for (const p of plots) {
      const points = p.coords
        .split(" ")
        .map((pair) => {
          const [lat, lng] = pair.split(",");
          return lng + " " + lat;
        })
        .join(", ");

      await pool.query(
        `INSERT INTO plots (gat_number, owner_name, village, taluka, district, area_acres, geometry)
         VALUES ($1, $2, $3, $4, $5, $6, ST_GeomFromText($7, 4326))`,
        [p.gat_number, p.owner_name, p.village, p.taluka, p.district, p.area_acres, "POLYGON((" + points + "))"]
      );
    }

    res.json({ success: true, message: "Sample plots seeded successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const matchPlot = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;
    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: "latitude and longitude are required" });
    }

    const exactMatch = await pool.query(
      `SELECT plot_id, gat_number, owner_name, village, taluka, district, area_acres,
              ST_AsGeoJSON(geometry) as geojson
       FROM plots
       WHERE ST_Contains(geometry, ST_SetSRID(ST_MakePoint($1, $2), 4326))
       LIMIT 1`,
      [longitude, latitude]
    );

    if (exactMatch.rows.length > 0) {
      return res.json({ success: true, matchType: "exact", plot: exactMatch.rows[0] });
    }

    const nearest = await pool.query(
      `SELECT plot_id, gat_number, owner_name, village, taluka, district, area_acres,
              ST_AsGeoJSON(geometry) as geojson,
              ST_Distance(geometry::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as distance_m
       FROM plots
       ORDER BY distance_m ASC
       LIMIT 1`,
      [longitude, latitude]
    );

    if (nearest.rows.length > 0) {
      return res.json({ success: true, matchType: "nearest", plot: nearest.rows[0] });
    }

    res.json({ success: false, message: "No plots found in the system" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get plots associated with the logged-in farmer (via their claims)
const getMyPlots = async (req, res) => {
  try {
    const farmer_id = req.user.user_id;
    const result = await pool.query(
      `SELECT DISTINCT p.plot_id, p.gat_number, p.village, p.taluka, p.district, p.area_acres,
              ST_AsGeoJSON(p.geometry) as geojson,
              (SELECT COUNT(*) FROM claims c2 WHERE c2.plot_id = p.plot_id AND c2.farmer_id = $1) as claim_count
       FROM plots p
       JOIN claims c ON c.plot_id = p.plot_id
       WHERE c.farmer_id = $1`,
      [farmer_id]
    );
    res.json({ success: true, plots: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { seedPlots, matchPlot, getMyPlots };

