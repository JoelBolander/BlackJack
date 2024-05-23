const express = require("express");
const app = express();
const mysql = require("mysql2/promise");
const { join } = require("node:path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

// parse application/json, för att hantera att man POSTar med JSON
const bodyParser = require("body-parser");

// Inställningar av servern.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static("public/"));
app.use(cookieParser());

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
  res.send(`<h1>Goto thingys</h1>
  <ul><li> /signup </li></ul>
  <ul><li> /login </li></ul>
  <ul><li> /blackjack (kräver att du har loggat in) </li></ul>
  `);
});

app.get("/signup", async function (req, res) {
  res.sendFile(join(__dirname, "public/signUp.html"));
});

app.post("/signup", async function (req, res) {
  try {
    const { username, password } = req.body;

    let connection = await getDBConnnection();

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
      sub: justSignUp[0].id,
      name: justSignUp[0].username,
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
    let connection = await getDBConnnection();
    let sql =
      "SELECT id, username, password FROM users WHERE username ='" +
      username +
      "'";
    let [results] = await connection.execute(sql, [username, password]);

    const match = await bcrypt.compare(password, results[0].password);
    if (match) {
      let payload = {
        sub: results[0].id,
        name: results[0].username,
      };
      let token = jwt.sign(
        payload,
        "jag är ledsen för att mina föräldrar inte älskar mig"
      );
      res.cookie("token", token);
      res.json(token);
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while processing your request." });
  }
});

app.post("/win", async function (req, res) {
  let bet = req.body.betAmount;

  let authHeader = req.headers["authorization"];
  if (authHeader === undefined) {
    res.status(401).send("Invalid or missing auth token");
  }

  let token = authHeader.slice(7);

  let tokenJSON;
  try {
    tokenJSON = jwt.verify(
      token,
      "jag är ledsen för att mina föräldrar inte älskar mig"
    );
  } catch (err) {
    res.status(401).send("Invalid or missing auth token");
  }

  let username = tokenJSON.name;

  let connection = await getDBConnnection();
  let selectsql = "SELECT * FROM users WHERE username ='" + username + "'";

  let [selectResults] = await connection.execute(selectsql, []);

  let updatesql = `UPDATE users
  SET games_won = ?, total_games = ?, chips_won = ?, current_chips = ?
  WHERE id = ?;`;

  let [updateresults] = await connection.execute(updatesql, [
    Number(selectResults[0].games_won) + 1,
    Number(selectResults[0].total_games) + 1,
    Number(selectResults[0].chips_won) + Number(bet),
    Number(selectResults[0].current_chips) + Number(bet),
    selectResults[0].id,
  ]);
});

app.post("/lose", async function (req, res) {
  let bet = req.body.betAmount;

  let authHeader = req.headers["authorization"];
  if (authHeader === undefined) {
    res.status(401).send("Invalid or missing auth token");
  }

  let token = authHeader.slice(7);

  let tokenJSON;
  try {
    tokenJSON = jwt.verify(
      token,
      "jag är ledsen för att mina föräldrar inte älskar mig"
    );
  } catch (err) {
    res.status(401).send("Invalid or missing auth token");
  }

  let username = tokenJSON.name;

  let connection = await getDBConnnection();
  let selectsql = "SELECT * FROM users WHERE username ='" + username + "'";

  let [selectResults] = await connection.execute(selectsql, []);

  let updatesql = `UPDATE users
  SET games_lost = ?, total_games = ?, chips_lost = ?, current_chips = ?
  WHERE id = ?;`;

  let [updateresults] = await connection.execute(updatesql, [
    Number(selectResults[0].games_lost) + 1,
    Number(selectResults[0].total_games) + 1,
    Number(selectResults[0].chips_lost) + Number(bet),
    Number(selectResults[0].current_chips) - Number(bet),
    selectResults[0].id,
  ]);
});

app.get("/getChips", async function (req, res) {
  let authHeader = req.headers["authorization"];
  if (authHeader === undefined) {
    res.status(401).send("Missing auth token");
  }

  let token = authHeader.slice(7);

  let tokenJSON;
  try {
    tokenJSON = jwt.verify(
      token,
      "jag är ledsen för att mina föräldrar inte älskar mig"
    );
  } catch (err) {
    res.status(401).send("Invalid auth token");
  }

  let username = tokenJSON.name;

  let connection = await getDBConnnection();
  let selectsql = "SELECT * FROM users WHERE username ='" + username + "'";

  let [selectResults] = await connection.execute(selectsql, []);

  res.json(selectResults[0].current_chips);
});

app.get("/blackjack", async function (req, res) {
  var token = req.cookies.token;
  try {
    let tokenJSON = jwt.verify(
      token,
      "jag är ledsen för att mina föräldrar inte älskar mig"
    );
  } catch (err) {
    res.status(401).send("Invalid or missing auth token");
  }
  res.sendFile(join(__dirname, "public/blackJack.html"));
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
