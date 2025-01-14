const express = require("express");
const bodyParser = require("body-parser");
const pracownikRoutes = require("./pracownikRoutes");
const szkolenieRoutes = require("./szkolenieRoutes");
const pracownikSzkolenieRoutes = require("./pracownikSzkolenieRoutes");
const budynekRoutes = require("./budynekRoutes");
const gabinetRoutes = require("./gabinetRoutes");
const lekarzRoutes = require("./lekarzRoutes");
const pacjentRoutes = require("./pacjentRoutes");
const recepcjonistaRoutes = require("./recepcjonistaRoutes");
const specjalizacjaRoutes = require("./specjalizacjaRoutes");
const wizytaRoutes = require("./wizytaRoutes");
const zabiegRoutes = require("./zabiegRoutes");
const zastepstwoRoutes = require("./zastepstwoRoutes");
const umowWizyteRoutes = require("./umowWizyteRoutes");
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

app.use("/api/pracownik", pracownikRoutes);
app.use("/api/szkolenie", szkolenieRoutes);
app.use("/api/pracownikSzkolenie", pracownikSzkolenieRoutes);
app.use("/api/budynek", budynekRoutes);
app.use("/api/gabinet", gabinetRoutes);
app.use("/api/lekarz", lekarzRoutes);
app.use("/api/pacjent", pacjentRoutes);
app.use("/api/recepcjonista", recepcjonistaRoutes);
app.use("/api/specjalizacja", specjalizacjaRoutes);
app.use("/api/wizyta", wizytaRoutes);
app.use("/api/zabieg", zabiegRoutes);
app.use("/api/zastepstwo", zastepstwoRoutes);
app.use("/api/umow-wizyte", umowWizyteRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
