const express = require("express");
const bcrypt = require("bcrypt");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const app = express();
const exphbs = require("express-handlebars");
const expressFileUpload = require("express-fileupload");
const jwt = require("jsonwebtoken");
const port = process.env.PORT;
const cors = require("cors");
const secretKey = "Shhhh";
const {
  registrarSkater,
  getSkaters,
  getSkater,
  updateSkater,
  getSkaterById,
  setSkaterStatus,
  deleteSkater,
} = require("./consultas");

app.use(express.json());
app.use(express.static(__dirname + "/public"));
app.use(cors({ origin: true }));

app.use(
  expressFileUpload({
    limits: 5000000,
    abotOnLimit: true,
    responseOnLimit: "El tamaño de la imagen supera el límite permitido",
  })
);
app.use(express.urlencoded({ extended: true }));
app.use("/css", express.static(__dirname + "/node_modules/bootstrap/dist/css"));
app.use(
  "/sweetalert2",
  express.static(__dirname + "/node_modules/sweetalert2/dist")
);
app.engine(
  "handlebars",
  exphbs({
    defaultLayout: "main",
    layoutsDir: `${__dirname}/views/mainLayout`,
    partials: `${__dirname}/views/partials`,
    helpers: require("./config/handlebars-helpers.js"),
  })
);

app.set("view engine", "handlebars");
app.listen(port || 3000, console.log("Server up"));

app.get("/", async (req, res) => {
  const listaDeSkaters = await getSkaters();
  res.render("Index", { listaDeSkaters, active: { Index: true } });
});

app.get("/registro", (req, res) => {
  res.render("Registro", { active: { Registro: true } });
});
app.get("/login", (req, res) => {
  res.render("Login", { active: { Login: true } });
});

app.get("/admin", async (req, res) => {
  const listaDeSkaters = await getSkaters();
  res.render("Admin", { listaDeSkaters, active: { Admin: true } });
});
app.post("/registro", async (req, res) => {
  if (req.files == null) {
    return res.status(400).send("No se encontro ningun archivo");
  }

  const datosSkater = req.body;
  const { password, email } = datosSkater;
  datosSkater.password = await bcrypt.hash(password, 10);
  const { fotoSkater } = req.files;
  const identificadorFotosSkater = uuidv4().slice(-6);
  const nombreFotoSkater = `${identificadorFotosSkater}-${fotoSkater.name}`;
  datosSkater.imagen = nombreFotoSkater;
  datosSkater.estado = false;
  const verificarSiExisteSkaterEnBd = await getSkater(email);

  if (verificarSiExisteSkaterEnBd) {
    res.status(500).send({
      message: `Algo salio mal..Skater ya existe`,
      code: 500,
    });
  }

  if (fotoSkater.mimetype == "image/jpeg") {
    fotoSkater.mv(
      `${__dirname}/public/img/${nombreFotoSkater}`,
      async (err) => {
        if (err) return res.json(err);
        try {
          const response = await registrarSkater(datosSkater);
        } catch (error) {
          res.status(500).send({
            message: `Algo salio mal..${error}`,
            code: 500,
          });
        }
      }
    );
    res.status(201).send({
      message: `Usuario agregado con exito`,
      code: 201,
    });
  } else {
    return res.status(404).json({
      message:
        "EL archivo subido debe ser con extension.jpg, intente nuevamente",
    });
  }
});

app.post("/verify", async (req, res) => {
  const { email, password } = req.body;

  const skaterExists = await getSkater(email);
  if (skaterExists) {
    const valid = await bcrypt.compare(password, skaterExists.password);

    if (valid) {
      const token = jwt.sign(
        {
          exp: Math.floor(Date.now() / 1000) + 180,
          data: skaterExists,
        },
        secretKey
      );
      res.send(token);
    } else {
      res.status(401).send({
        error: "401 Unauthorized",
        message: "Users credentials dows not match",
      });
    }
  } else {
    res.status(404).send({
      error: "404 Not Found",
      message: "Users credentials dows not match",
    });
  }
});

app.get("/Datos", (req, res) => {
  const { token } = req.query;
  jwt.verify(token, secretKey, (err, decoded) => {
    if (decoded === undefined) {
      return res.status(401).send({
        error: "401 Unauthorized",
        message: "Usted no esta autorizado para estar aqui",
      });
    }
    const { data } = decoded;
    const { id, email, nombre, password, anos_experiencia, especialidad } =
      data;
    err
      ? res.status(401).send({
          error: "401 Unauthorized",
          message: "Usted no esta autorizado para estar aqui",
          token_error: err.message,
        })
      : res.render("Datos", {
          id,
          email,
          nombre,
          password,
          anos_experiencia,
          especialidad,
        });
  });
});

app.put("/skaters/:id", async (req, res) => {
  const { id } = req.params;
  const datosSkater = req.body;
  const { password } = datosSkater;
  datosSkater.password = await bcrypt.hash(password, 10);
  const skaterAEditar = Object.values(datosSkater);

  try {
    const respuesta = await updateSkater([...skaterAEditar, id]);
    res.status(200).json({ message: "Skater Editado con exito" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: error.message });
  }
});

app.put("/skaters", async (req, res) => {
  const { id, estado } = req.body;
  try {
    const skaterStatus = await setSkaterStatus(id, estado);
    res.status(200).send(skaterStatus);
  } catch (error) {
    res.status(500).send({
      message: `Algo salio mal..${error}`,
      code: 500,
    });
  }
});

app.delete("/skaters/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const skaterEncontrado = await getSkaterById(id);
    const { foto } = skaterEncontrado;

    const respuesta = await deleteSkater(id);
    fs.unlinkSync(__dirname + `/public/img/${foto}`);
    console.log(respuesta);
    respuesta > 0
      ? res
          .status(200)
          .json({ message: `El skater de id ${id} fue eliminado con éxito` })
      : res
          .status(404)
          .send({ message: "No existe un skater registrado con ese id" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
