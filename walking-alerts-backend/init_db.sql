-- Init DB schema for Walking Alerts

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS alert_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

-- seed default types if table empty
INSERT INTO alert_types (name)
SELECT v FROM (VALUES
  ('Asalto'),
  ('Accidente vehicular'),
  ('Accidente peatonal'),
  ('Portonazo'),
  ('Incendio')
) AS t(v)
WHERE NOT EXISTS (SELECT 1 FROM alert_types);

CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  alert_type_id INTEGER REFERENCES alert_types(id),
  location geometry(Point,4326),
  device_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS alerts_location_gist ON alerts USING GIST (location);
