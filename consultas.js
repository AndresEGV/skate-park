const { Pool } = require("pg");

const config = {
  user: "jibsujjyhprben",
  database: "d30oirstmpmjpo",
  password: "a7c809d614427244b4677ac83076359559b23b254e405e89c71a3dd7bfb535c5",
  port: 5432,
  host: "ec2-44-199-26-122.compute-1.amazonaws.com",
  ssl: {
    rejectUnauthorized: false,
  },
};

const pool = new Pool(config);

const registrarSkater = async (skater) => {
  const values = Object.values(skater);
  try {
    const consulta = {
      text: "insert into skaters (email,nombre, password, anos_experiencia, especialidad,foto,estado) values ($1, $2, $3, $4,$5,$6,$7) returning *",
      values,
    };

    const { rows } = await pool.query(consulta);
    return rows;
  } catch (error) {
    console.log(error);
  }
};

const getSkaters = async () => {
  const { rows } = await pool.query("select * from skaters");
  return rows;
};

const getSkater = async (email) => {
  const {
    rows: [skater],
  } = await pool.query(`SELECT * FROM skaters WHERE email = '${email}'`);
  return skater;
};

const getSkaterById = async (id) => {
  const {
    rows: [skater],
  } = await pool.query(`SELECT * FROM skaters WHERE id = '${id}'`);
  return skater;
};

const updateSkater = async (skaterAEditar) => {
  try {
    const consulta = {
      text: "update skaters set nombre = $1, password =$2, anos_experiencia = $3, especialidad = $4 where id = $5 returning *",
      values: skaterAEditar,
    };

    const { rows } = await pool.query(consulta);
    return rows;
  } catch (error) {
    console.log(error);
  }
};

const setSkaterStatus = async (id, status) => {
  const { rows } = await pool.query(
    `update  skaters set estado = ${status} where id = ${id} returning *`
  );
  const skater = rows[0];
  return skater;
};

const deleteSkater = async (id) => {
  try {
    const { rowCount } = await pool.query(`DELETE FROM skaters WHERE id =
'${id}'`);
    return rowCount;
  } catch (e) {
    console.log(error);
  }
};

module.exports = {
  registrarSkater,
  getSkaters,
  getSkater,
  updateSkater,
  getSkaterById,
  setSkaterStatus,
  deleteSkater,
};
