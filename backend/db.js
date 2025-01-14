const sql = require("mssql");

// Konfiguracja połączenia z bazą danych
const config = {
  user: "myuser",
  password: "mypassword",
  server: "localhost",
  database: "Przychodnia",
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

// Połączenie z bazą danych
const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    console.log("Połączono z bazą danych MSSQL");
    return pool;
  })
  .catch((err) => {
    console.error("Błąd podczas łączenia z bazą danych:", err.message);
    throw err;
  });

module.exports = {
  sql,
  poolPromise,
};
