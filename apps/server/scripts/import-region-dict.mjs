import fs from 'fs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: new URL('../.env', import.meta.url) });

const sourcePath = process.argv[2];

if (!sourcePath) {
  console.error('Usage: node scripts/import-region-dict.mjs <regions-json-path>');
  process.exit(1);
}

const raw = fs.readFileSync(sourcePath, 'utf8');
const data = JSON.parse(raw);

if (!Array.isArray(data.province) || !Array.isArray(data.city) || !Array.isArray(data.county)) {
  console.error('Invalid regions json structure.');
  process.exit(1);
}

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'product_ideas'
});

try {
  await connection.beginTransaction();

  const [dictTypes] = await connection.execute(
    'SELECT id FROM dict_types WHERE code = ? LIMIT 1',
    ['region_tree']
  );

  if (!dictTypes.length) {
    throw new Error('dict_types 中不存在 code = region_tree 的字典类型');
  }

  const dictTypeId = dictTypes[0].id;

  const [existingRows] = await connection.execute(
    `
      SELECT id, parent_id AS parentId
      FROM dict_items
      WHERE dict_type_id = ?
      ORDER BY parent_id IS NULL ASC, id DESC
    `,
    [dictTypeId]
  );

  for (const row of existingRows) {
    await connection.execute('DELETE FROM dict_items WHERE id = ?', [row.id]);
  }

  const provinceIdMap = new Map();
  const cityIdMap = new Map();

  for (let index = 0; index < data.province.length; index += 1) {
    const province = data.province[index];
    const [result] = await connection.execute(
      `
        INSERT INTO dict_items (dict_type_id, parent_id, label, value, status, sort_order, remark)
        VALUES (?, NULL, ?, ?, '启用', ?, '')
      `,
      [dictTypeId, province.name, String(province.code), index + 1]
    );

    provinceIdMap.set(Number(province.code), result.insertId);
  }

  const citiesByProvince = new Map();
  for (const city of data.city) {
    const provinceCode = Number(city.p_code);
    if (!citiesByProvince.has(provinceCode)) {
      citiesByProvince.set(provinceCode, []);
    }
    citiesByProvince.get(provinceCode).push(city);
  }

  for (const [provinceCode, cities] of citiesByProvince.entries()) {
    const parentId = provinceIdMap.get(provinceCode);
    if (!parentId) {
      continue;
    }

    for (let index = 0; index < cities.length; index += 1) {
      const city = cities[index];
      const [result] = await connection.execute(
        `
          INSERT INTO dict_items (dict_type_id, parent_id, label, value, status, sort_order, remark)
          VALUES (?, ?, ?, ?, '启用', ?, '')
        `,
        [dictTypeId, parentId, city.name, String(city.code), index + 1]
      );

      cityIdMap.set(Number(city.code), result.insertId);
    }
  }

  const countiesByCity = new Map();
  for (const county of data.county) {
    const cityCode = Number(county.c_code);
    if (!countiesByCity.has(cityCode)) {
      countiesByCity.set(cityCode, []);
    }
    countiesByCity.get(cityCode).push(county);
  }

  for (const [cityCode, counties] of countiesByCity.entries()) {
    const parentId = cityIdMap.get(cityCode);
    if (!parentId) {
      continue;
    }

    for (let index = 0; index < counties.length; index += 1) {
      const county = counties[index];
      await connection.execute(
        `
          INSERT INTO dict_items (dict_type_id, parent_id, label, value, status, sort_order, remark)
          VALUES (?, ?, ?, ?, '启用', ?, '')
        `,
        [dictTypeId, parentId, county.name, String(county.code), index + 1]
      );
    }
  }

  await connection.commit();
  console.log(
    JSON.stringify({
      dictTypeId,
      provinces: data.province.length,
      cities: data.city.length,
      counties: data.county.length,
      total: data.province.length + data.city.length + data.county.length
    })
  );
} catch (error) {
  await connection.rollback();
  console.error(error.message);
  process.exit(1);
} finally {
  await connection.end();
}
