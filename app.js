//importing dependencies.
const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const path = require("path");
//connecting path.
const dbPath = path.join(__dirname, "userData.db");
const app = express();
//
app.use(express.json());
//
let db = null;
//connecting to data base server
const initializeAndDbServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server started at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB error:${e.message}`);
    process.exit(1);
  }
};
initializeAndDbServer();
//api-1.
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectQuery = `
    SELECT
      *
    FROM
      user
    WHERE
      username = '${username}';`;
  const dbUser = await db.get(selectQuery);
  if (dbUser === undefined) {
    //create user in userData table
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const postQuery = `
    INSERT INTO
      user (username, name, password, gender, location)
    VALUES
      ('${username}', '${name}', '${hashedPassword}', '${gender}', '${location}');`;
      await db.run(postQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});
//api-2.
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectQuery = `
    SELECT
      *
    FROM
      user
    WHERE
      username = '${username}';`;
  const dbUser = await db.get(selectQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const hashedPassword = await bcrypt.compare(password, dbUser.password);
    if (hashedPassword === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});
//api-3.
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectQuery = `
    SELECT
      *
    FROM
      user
    WHERE
      username = '${username}';`;
  const dbUser = await db.get(selectQuery);
  console.log(dbUser);
  const hashedPassword = await bcrypt.compare(oldPassword, dbUser.password);
  if (hashedPassword === true) {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const isHashedPassword = await bcrypt.hash(newPassword, 10);
      const putQuery = `
                UPDATE
                  user
                SET
                  password = '${isHashedPassword}'
                WHERE
                  username = '${username}';`;
      await db.run(putQuery);
      response.status(200);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});
//
module.exports = app;
