const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

const sql = fs.readFileSync(path.resolve(__dirname, '../init_db.sql'), 'utf8')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
})

async function main() {
  try {
    console.log('Connecting to DB...')
    await pool.query('SELECT 1')
    console.log('Connected. Running init SQL...')
    await pool.query(sql)
    console.log('DB initialization completed')
  } catch (err) {
    console.error('DB init error:', err)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()
