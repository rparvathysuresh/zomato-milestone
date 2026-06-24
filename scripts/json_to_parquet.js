/**
 * Convert zomato_restaurants.json to Parquet format.
 * Uses parquetjs-lite for lightweight Parquet writing.
 */

const fs = require('fs');
const path = require('path');
const parquet = require('parquetjs-lite');

const DATA_DIR = path.join(__dirname, '..', 'data');
const JSON_PATH = path.join(DATA_DIR, 'zomato_restaurants.json');
const PARQUET_PATH = path.join(DATA_DIR, 'zomato_restaurants.parquet');

async function main() {
  console.log(`Reading ${JSON_PATH}...`);
  const raw = fs.readFileSync(JSON_PATH, 'utf8');
  const data = JSON.parse(raw);
  console.log(`Loaded ${data.length} restaurants.\n`);

  // Define Parquet schema
  const schema = new parquet.ParquetSchema({
    id:              { type: 'UTF8' },
    name:            { type: 'UTF8' },
    location:        { type: 'UTF8' },
    cuisine:         { type: 'UTF8' },        // comma-separated
    costForTwo:      { type: 'INT64' },
    budgetTier:      { type: 'UTF8' },
    rating:          { type: 'DOUBLE' },
    votes:           { type: 'INT64' },
    restaurantType:  { type: 'UTF8' },
    highlights:      { type: 'UTF8' },        // comma-separated
  });

  // Write Parquet file
  const writer = await parquet.ParquetWriter.openFile(schema, PARQUET_PATH);

  for (const row of data) {
    await writer.appendRow({
      id:             row.id || '',
      name:           row.name || '',
      location:       row.location || '',
      cuisine:        Array.isArray(row.cuisine) ? row.cuisine.join(', ') : (row.cuisine || ''),
      costForTwo:     row.costForTwo || 0,
      budgetTier:     row.budgetTier || '',
      rating:         row.rating || 0,
      votes:          row.votes || 0,
      restaurantType: row.restaurantType || '',
      highlights:     Array.isArray(row.highlights) ? row.highlights.join(', ') : (row.highlights || ''),
    });
  }

  await writer.close();

  const stats = fs.statSync(PARQUET_PATH);
  console.log(`✅ Parquet file created: ${PARQUET_PATH}`);
  console.log(`   File size: ${(stats.size / 1024).toFixed(1)} KB (vs ${(fs.statSync(JSON_PATH).size / 1024).toFixed(1)} KB JSON)`);
  console.log(`   Rows: ${data.length}`);
  console.log(`   Columns: id, name, location, cuisine, costForTwo, budgetTier, rating, votes, restaurantType, highlights`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
