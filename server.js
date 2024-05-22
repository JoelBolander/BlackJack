const express = require("express");
const app = express();
const mysql = require("mysql2/promise");
const { join } = require("node:path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// parse application/json, för att hantera att man POSTar med JSON
const bodyParser = require("body-parser");

// Inställningar av servern.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static("public/"));

async function getDBConnnection() {
  // Här skapas ett databaskopplings-objekt med inställningar för att ansluta till servern och databasen.
  return await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "jack black",
  });
}

app.get("/", (req, res) => {
  res.send(`<h1>Saker du kan skriva in</h1>
  <ul><li> GET /users</li></ul>
  <ul><li> GET /users/1</li></ul>
  <ul><li> GET /users/2</li></ul>
  <ul><li> GET /users?id=[id]</li></ul>
  <ul><li> GET /users?username=[user]</li></ul>
  <ul><li> If you go to /users you have to include values for username, password and many other statisticstis</li></ul>
  <ul><li> POST /signup </li></ul>`);
});

/*
  app.post() hanterar en http request med POST-metoden.
*/
app.get("/users/:id", function (req, res) {
  // Data som postats till routen ligger i body-attributet på request-objektet.
  if (req.params.id == 1) {
    let answer = { message: "Baller" };
    res.json(answer);
  }
  if (req.params.id == 2) {
    let answer = { message: "Joel" };
    res.json(answer);
  } else {
    let answer = { message: "No such user" };
    res.json(answer);
  }

  // POST ska skapa något så här kommer det behövas en INSERT
  let sql = `INSERT INTO ...`;
});

app.get("/users", async function (req, res) {
  let authHeader = req.headers["authorization"];
  if (authHeader === undefined) {
    // skicka lämplig HTTP-status om auth-header saknas, en “400 någonting”
    console.log("din kod har en error");
  }
  console.log(authHeader);
  let token = authHeader.slice(7); // tar bort "BEARER " från headern
  let decoded;
  try {
    decoded = jwt.verify(
      token,
      "jag är ledsen för att mina föräldrar inte älskar mig"
    );
  } catch (err) {
    console.log(err); //Logga felet, för felsökning på servern.
    res.status(401).send("Invalid auth token");
  }

  let connection = await getDBConnnection();
  let sql = `SELECT * FROM users`;
  let [results] = await connection.execute(sql);

  //res.json() skickar resultat som JSON till klienten
  res.json(results);
});

// app.post("/logincheck", async function (req, res) {
//   console.log(req.body.first_name);
// });

app.get("/signup", async function (req, res) {
  res.sendFile(join(__dirname, "public/signUp.html"));
});

app.post("/signup", async function (req, res) {
  try {
    const { username, password } = req.body;

    let connection = await getDBConnnection();

    // Check if the username already exists
    let [existingUser] = await connection.execute(
      "SELECT username FROM users WHERE username = ?",
      [username]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ error: "Username already taken" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let sql = `INSERT INTO users (username, password)
                  VALUES (?, ?)`;

    let [results] = await connection.execute(sql, [username, hashedPassword]);

    sql = "SELECT id, username FROM users WHERE username ='" + username + "'";
    let [justSignUp] = await connection.execute(sql, [username]);

    let payload = {
      sub: justSignUp[0].id, // sub är obligatorisk
      name: justSignUp[0].username, // Valbar
      // kan innehålla ytterligare attribut, t.ex. roller
    };

    let token = jwt.sign(
      payload,
      "jag är ledsen för att mina föräldrar inte älskar mig"
    );
    res.json(token);
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while processing your request." });
  }
});

app.get("/login", async function (req, res) {
  res.sendFile(join(__dirname, "/public/loginAD.html"));
});

app.post("/login", async function (req, res) {
  try {
    const { username, password } = req.body;
    console.log(req.body);
    console.log(username);
    console.log(password);
    let connection = await getDBConnnection();
    let sql =
      "SELECT id, username, password FROM users WHERE username ='" +
      username +
      "'";
    let [results] = await connection.execute(sql, [username, password]);

    console.log(password);
    console.log(results[0].password);

    const match = await bcrypt.compare(password, results[0].password);
    console.log(match);
    if (match) {
      let payload = {
        sub: results[0].id, // sub är obligatorisk
        name: results[0].username, // Valbar
        // kan innehålla ytterligare attribut, t.ex. roller
      };
      let token = jwt.sign(
        payload,
        "jag är ledsen för att mina föräldrar inte älskar mig"
      );
      res.json(token);
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while processing your request." });
  }
});

// app.post("/users", async function (req, res) {
//   //req.body innehåller det postade datat

//   if (
//     req.body &&
//     req.body.username &&
//     req.body.first_name &&
//     req.body.last_name &&
//     req.body.password
//   ) {
//     //skriv till databas
//     let connection = await getDBConnnection();
//     let sql = `INSERT INTO users (username, first_name, last_name, password)
//     VALUES (?, ?, ?, ?)`;

//     let [results] = await connection.execute(sql, [
//       req.body.username,
//       req.body.first_name,
//       req.body.last_name,
//       req.body.password,
//     ]);

//     res.json(results);
//   } else {
//     //returnera med felkod 422 Unprocessable entity.
//     //eller 400 Bad Request.
//     res.sendStatus(422);
//   }
// });

app.post("/check", async function (req, res) {
  token = localStorage.getItem("token");
  let apa = jwt.decode(
    token,
    "jag är ledsen för att mina föräldrar inte älskar mig"
  );

  console.log(apa);
});

app.get("/blackjack", async function (req, res) {
  res.sendFile(join(__dirname, "blackJack.html"));
});

app.post("/blackjack", async function (req, res) {
  try {
    const { username, password } = req.body;

    let connection = await getDBConnnection();

    let selectsql =
      "SELECT id, username, password FROM users WHERE username ='" +
      username +
      "'";
    let [selectresults] = await connection.execute(selectsql, [
      username,
      password,
    ]);

    let updatesql = `INSERT INTO users (username, password)
                  VALUES (?, ?)`;

    let [updateresults] = await connection.execute(updatesql, [
      username,
      hashedPassword,
    ]);

    sql = "SELECT id, username FROM users WHERE username ='" + username + "'";
    let [justSignUp] = await connection.execute(sql, [username]);

    let payload = {
      sub: justSignUp[0].id, // sub är obligatorisk
      name: justSignUp[0].username, // Valbar
      // kan innehålla ytterligare attribut, t.ex. roller
    };

    let token = jwt.sign(
      payload,
      "jag är ledsen för att mina föräldrar inte älskar mig"
    );
    res.json(token);
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while processing your request." });
  }
});

// app.put("/users/:id", async function (req, res) {
//   //kod här för att hantera anrop…

//   let connection = await getDBConnnection();
//   let sql = `UPDATE users
//     SET first_name = ?, last_name = ?, username = ?, password = ?
//     WHERE id = ?`;

//   let [results] = await connection.execute(sql, [
//     req.body.first_name,
//     req.body.last_name,
//     req.body.username,
//     req.body.password,
//     req.params.id,
//   ]);
//   //kod här för att returnera data

//   res.json(results);
// });

const port = 3000;
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
