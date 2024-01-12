var admin = require("firebase-admin");
const { getDatabase } = require("firebase-admin/database");

// Fetch the service account key JSON file contents
var serviceAccount = require("./credentials.json");

// Initialize the app with a service account, granting admin privileges
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    "https://gevs-voting-platform-default-rtdb.europe-west1.firebasedatabase.app/",
});

// As an admin, the app has access to read and write all data, regardless of Security Rules
var db = getDatabase();

const express = require("express");
const fs = require("fs");
const path = require("path");
const https = require("https");
const cookieParser = require("cookie-parser");
var axios = require("axios").default;
const { auth } = require("express-oauth2-jwt-bearer");
const options = {
  key: fs.readFileSync(path.join(__dirname, "../private.key")),
  cert: fs.readFileSync(path.join(__dirname, "../cert.crt")),
};

const Aoptions = {
  method: "POST",
  url: "https://dev-kz3wvugl1e6727qh.us.auth0.com/oauth/token",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  data: new URLSearchParams({
    grant_type: "client_credentials",
    client_id: "WVGErJVHPneJcbCPFAuuLfgFaHH4iwI4",
    client_secret:
      "Cwfi8Vuju42GlhILuf4vy_1PEW5CdEyxJrSQXhVDOflNBJJQx0wqMzTDlucYan9z",
    audience: "https://www.gevsapi.com",
  }),
};

const checkJwt = auth({
  audience: "https://www.gevsapi.com",
  issuerBaseURL: `https://dev-kz3wvugl1e6727qh.us.auth0.com/`,
});

const app = express();
app.use(express.json());
app.use(cookieParser());
const bcrypt = require("bcrypt");

const hash = async (text) => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(text, salt);
  return hash;
};

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const adminSnapshot = await db.ref("admin").once("value");
  let user;

  if (
    email === adminSnapshot.val().email &&
    bcrypt.compareSync(password, adminSnapshot.val().password)
  ) {
    const response = await axios.request(Aoptions);
    res.cookie("token", response.data.access_token, { maxAge: 3600000 });
    res.cookie("email", adminSnapshot.val().email, { maxAge: 3600000 });
    res.cookie("password", adminSnapshot.val().password, { maxAge: 3600000 });
    res.status(200).send({
      message: "Admin logged in successfully",
    });
    return;
  }

  const userSnapshot = await db.ref("users").once("value");

  if(!userSnapshot.exists()){
    res.status(400).send({ message: "No user account found in database" });
    return
  } 


  user = Object.values(userSnapshot.val()).find((child) => {
    return (
      email === child.email && bcrypt.compareSync(password, child.password)
    );
  });

  if (!user) {
    res.status(400).send({ message: "Invalid email/password" });
  } else {
    const response = await axios.request(Aoptions);
    res.cookie("token", response.data.access_token, { maxAge: 3600000 });
    res.cookie("email", email, { maxAge: 3600000 });
    res.cookie("password", user.password, { maxAge: 3600000 });
    res.status(200).send({
      message: "User logged in successfully",
    });
  }
});

app.get("/api/dashboard", checkJwt, async (req, res) => {
  const { email, password } = req.query;
  const adminSnapshot = await db.ref("admin").once("value");
  let userObj;

  if (adminSnapshot.exists()) {
    if (
      password === adminSnapshot.val().password &&
      email === adminSnapshot.val().email
    ) {
      res.status(200).send({ data: "admin" });
    } else {
      const userSnapshot = await db.ref("users").once("value");
      if (userSnapshot.exists()) {
        userObj = Object.values(userSnapshot.val() || {}).find(
          (child) => password === child.password
        );
        res.status(200).send({
          data: userObj,
        });
      }
    }
  }
});

app.post("/api/register", async (req, res) => {
  const { fullName, email, password, constituency, DOB, UVC } = req.body;

  const snapshot = await db.ref("users").once("value");
  const emailExist =
    Object.values(snapshot.val() || {}).find(
      (child) => child.email === email
    ) !== undefined;

  if (emailExist) {
    return res.status(400).send({ message: "Email already in use." });
  }

  const uvcSnapshot = await db.ref("UVC/" + UVC).once("value");

  if (uvcSnapshot.exists()) {
    if (uvcSnapshot.val() !== "0") {
      return res.status(400).send({ message: "UVC already in use." });
    } else {
      db.ref("UVC").child(UVC).set("1");
    }
  } else {
    return res.status(400).send({ message: "Invalid UVC." });
  }

  const hashedPassword = await hash(password);
  db.ref("users")
    .push({
      fullName,
      email,
      password: hashedPassword,
      constituency,
      DOB,
      UVC,
    })
    .then(() => {
      res.status(200).send({ message: "User registered successfully." });
    })
    .catch((error) => {
      res
        .status(500)
        .send({ message: "Error registering user: " + error.message });
    });
});

app.post("/api/vote/", checkJwt, async (req, res) => {
  const { password, party, constituency } = req.body;
  const checkStatusSnapshot = await db.ref("results").once("value");
  const electionStatus = checkStatusSnapshot.val().status;
  if (electionStatus !== "Started") {
    res.status(400).send({
      message: "You can't vote now, the election has " + electionStatus,
    });
    return;
  }
  const usersSnapshot = await db.ref("users").once("value");
  const users = usersSnapshot.val();

  const userSnapshot = Object.values(users).find(
    (childSnapshot) => password === childSnapshot.password
  );

  if (userSnapshot) {
    if (userSnapshot.vote === "1") {
      res.status(400).send({ message: "You have already voted" });
      return;
    } else {
      userSnapshot.vote = "1";
    }
  } else {
    res.status(400).send({ message: "Invalid credentials" });
    return;
  }
  const resultSnapshot = await db
    .ref("constituency/" + constituency + "/result")
    .once("value");
  const result = resultSnapshot.val();
  const partyChild = result.find((child) => child.party === party);
  if (partyChild) {
    await db.ref("users").set(users);
    partyChild.vote = String(Number(partyChild.vote) + 1);
    await db.ref("constituency/" + constituency + "/result").set(result);
    res.status(200).send({ message: "Vote successfully casted" });
  } else {
    res.status(400).send({ message: "Invalid party" });
  }
});

app.get("/gevs/constituency/:name", async (req, res) => {
  try {
    const name = req.params.name;

    const snapshot = await db.ref("constituency/" + name).once("value");

    const constituency = snapshot.val();

    // Set status codes for better readability
    const successStatus = 200;
    const notFoundStatus = 404;

    if (constituency) {
      // Send JSON response
      res.status(successStatus).json({
        data: constituency,
      });
    } else {
      res.status(notFoundStatus).send("Constituency not found");
    }
  } catch (error) {
    // Handle any errors that may occur during the database retrieval
    console.error(error);
    res.status(notFoundStatus).send("Error retrieving constituency");
  }
});

app.get("/gevs/results/", async (req, res) => {
  // Retrieve results snapshot from the database
  const resultsSnapshot = await db.ref("results").once("value");

  // Extract the results from the snapshot
  const results = resultsSnapshot.val();

  // Check if results exist
  if (results !== null) {
    // Return results with a 200 status code
    res.status(200).send({
      data: results,
    });
  } else {
    // Return an error message with a 404 status code
    res.status(404).send("Error getting results");
  }
});

app.get("/api/admin/result", async (req, res) => {
  const constituencySnapshot = await db.ref("constituency").once("value");
  const result = constituencySnapshot.val();

  if (result) {
    res.status(200).send(result);
  } else {
    res.status(204).send();
  }
});

app.get("/api/election/:option", checkJwt, async (req, res) => {
  var { email, password } = req.query;
  const adminSnapshot = await db.ref("admin").once("value");
  if (
    password === adminSnapshot.val().password &&
    email === adminSnapshot.val().email
  ) {
    const option = req.params.option;
    const snapshot = await db.ref("results").once("value");
    const result = snapshot.val();
    switch (option) {
      default:
        console.log("Invalid option:", option);
        break;
      case "start":
        if (result.status === "Started") {
          res.status(400).send({ message: "Election already started" });
          break;
        } else if (result.status === "Completed") {
          res.status(400).send({ message: "Election already completed" });
          break;
        } else {
          result.status = "Started";
          result.winner = "Pending";
          db.ref("results").set(result);
          res.status(200).send({ message: "Election started" });
          break;
        }
      case "stop":
        if (result.status === "Completed") {
          res.status(400).send({ message: "Election already completed" });
          break;
        } else if (result.status === "Not Started") {
          res.status(400).send({ message: "Election not yet started" });
          break;
        } else {
          const voteSnapshot = await db.ref("constituency").once("value");
          const vote = voteSnapshot.val();
          result.status = "Completed";
          Object.keys(vote).forEach((constituencyKey) => {
            const candidates = vote[constituencyKey].result;
            let maxVoteCount = 0;
            let winningParty = "";

            candidates.forEach((candidate) => {
              if (parseInt(candidate.vote) > maxVoteCount) {
                maxVoteCount = parseInt(candidate.vote);
                winningParty = candidate.party;
              } else if (parseInt(candidate.vote) === maxVoteCount) {
                winningParty = null;
              }
            });

            result.seats.forEach((seat) => {
              if (seat.party === winningParty) {
                seat.seat = String(Number(seat.seat) + 1);
              }
            });
          });

          let finalWinner = "";
          const maxSeatCount = Math.max(
            ...result.seats.map((seat) => seat.seat)
          );

          if (maxSeatCount < 3) {
            finalWinner = "Hung Parliament";
          } else {
            for (const seat of result.seats) {
              if (parseInt(seat.seat) === maxSeatCount) {
                finalWinner = seat.party;
                break;
              }
            }
          }
          result.winner = finalWinner;
          db.ref("results").set(result);
          res
            .status(200)
            .send({ message: "Election stopped", winner: finalWinner });
          break;
        }
    }
  } else {
    res.status(400).send({ message: "Invalid credentials" });
  }
});

const sslServer = https.createServer(options, app);
sslServer.listen(3001, () => {
  console.log("Secure server is listening on port 3001");
});
