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

// POST request to handle user login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  // Retrieve admin data from the database
  const adminSnapshot = await db.ref("admin").once("value");

  // Check if the user is an admin
  if (
    email === adminSnapshot.val().email &&
    bcrypt.compareSync(password, adminSnapshot.val().password)
  ) {
    // Make a request to an external API
    const response = await axios.request(Aoptions);

    // Set cookies for authentication
    res.cookie("token", response.data.access_token, { maxAge: 3600000 });
    res.cookie("email", adminSnapshot.val().email, { maxAge: 3600000 });
    res.cookie("password", adminSnapshot.val().password, { maxAge: 3600000 });

    // Send a success response
    res.status(200).send({
      message: "Admin logged in successfully",
    });

    return;
  }

  // Retrieve user data from the database
  const userSnapshot = await db.ref("users").once("value");

  // Check if there are no user accounts in the database
  if (!userSnapshot.exists()) {
    res.status(400).send({ message: "No user account found in database" });
    return;
  }

  // Find the user in the database based on email and password
  const user = Object.values(userSnapshot.val()).find((child) => {
    return (
      email === child.email && bcrypt.compareSync(password, child.password)
    );
  });

  // Check if the user is found
  if (!user) {
    res.status(400).send({ message: "Invalid email/password" });
  } else {
    // Make a request to an external API
    const response = await axios.request(Aoptions);

    // Set cookies for authentication
    res.cookie("token", response.data.access_token, { maxAge: 3600000 });
    res.cookie("email", email, { maxAge: 3600000 });
    res.cookie("password", user.password, { maxAge: 3600000 });

    // Send a success response
    res.status(200).send({
      message: "User logged in successfully",
    });
  }
});

// GET request to retrieve dashboard data
app.get("/api/dashboard", checkJwt, async (req, res) => {
  const { email, password } = req.query;

  // Retrieve admin data from the database
  const adminSnapshot = await db.ref("admin").once("value");

  let userObj;

  // Check if the user is an admin
  if (
    password === adminSnapshot.val().password &&
    email === adminSnapshot.val().email
  ) {
    res.status(200).send({ data: "admin" });
  } else {
    // Retrieve user data from the database
    const userSnapshot = await db.ref("users").once("value");

    // Check if there are user accounts in the database
    if (userSnapshot.exists()) {
      userObj = Object.values(userSnapshot.val() || {}).find(
        (child) => password === child.password
      );

      // Send the user object in the response
      res.status(200).send({
        data: userObj,
      });
    }
  }
});

// POST request to handle user registration
app.post("/api/register", async (req, res) => {
  // Extract data from request body
  const { fullName, email, password, constituency, DOB, UVC } = req.body;

  // Retrieve user data from the database
  const snapshot = await db.ref("users").once("value");

  // Check if email already exists
  const emailExist =
    Object.values(snapshot.val() || {}).find(
      (child) => child.email === email
    ) !== undefined;

  if (emailExist) {
    // Return error response if email is already in use
    return res.status(400).send({ message: "Email already in use." });
  }

  // Retrieve UVC data from the database
  const uvcSnapshot = await db.ref("UVC/" + UVC).once("value");

  if (uvcSnapshot.exists()) {
    if (uvcSnapshot.val() !== "0") {
      // Return error response if UVC is already in use
      return res.status(400).send({ message: "UVC already in use." });
    } else {
      // Set UVC as used
      db.ref("UVC").child(UVC).set("1");
    }
  } else {
    // Return error response if UVC is invalid
    return res.status(400).send({ message: "Invalid UVC." });
  }

  // Hash the password
  const hashedPassword = await hash(password);

  // Add user data to the database
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
      // Return success response if user is registered successfully
      res.status(200).send({ message: "User registered successfully." });
    })
    .catch((error) => {
      // Return error response if there is an error registering the user
      res
        .status(500)
        .send({ message: "Error registering user: " + error.message });
    });
});

app.post("/api/vote/", checkJwt, async (req, res) => {
  // Extract the password, party, and constituency from the request body
  const { password, party, constituency } = req.body;

  // Check the current election status
  const checkStatusSnapshot = await db.ref("results").once("value");
  const electionStatus = checkStatusSnapshot.val().status;

  // If the election status is not "Pending", send an error response
  if (electionStatus !== "Pending") {
    res.status(400).send({
      message: "You can't vote now, the election has " + electionStatus,
    });
    return;
  }

  // Get the list of users from the database
  const usersSnapshot = await db.ref("users").once("value");
  const users = usersSnapshot.val();

  // Find the user with the matching password
  const userSnapshot = Object.values(users).find(
    (childSnapshot) => password === childSnapshot.password
  );

  // If the user is found
  if (userSnapshot) {
    // If the user has already voted, send an error response
    if (userSnapshot.vote === "1") {
      res.status(400).send({ message: "You have already voted" });
      return;
    } else {
      // Mark the user as voted
      userSnapshot.vote = "1";
    }
  } else {
    // If the user is not found, send an error response
    res.status(400).send({ message: "Invalid credentials" });
    return;
  }

  // Get the current result for the constituency
  const resultSnapshot = await db
    .ref("constituency/" + constituency + "/result")
    .once("value");
  const result = resultSnapshot.val();

  // Find the party in the result
  const partyChild = result.find((child) => child.party === party);

  // If the party is found
  if (partyChild) {
    // Update the users and result in the database
    await db.ref("users").set(users);
    partyChild.vote = String(Number(partyChild.vote) + 1);
    await db.ref("constituency/" + constituency + "/result").set(result);
    res.status(200).send({ message: "Vote successfully casted" });
  } else {
    // If the party is not found, send an error response
    res.status(400).send({ message: "Invalid party" });
  }
});

// Route handler for getting constituency by name
app.get("/gevs/constituency/:name", async (req, res) => {
  try {
    // Extract name from request parameters
    const name = req.params.name;

    // Fetch constituency data from the database
    const snapshot = await db.ref("constituency/" + name).once("value");

    // Extract the value from the database snapshot
    const constituency = snapshot.val();

    // Set status codes for better readability
    const successStatus = 200;
    const notFoundStatus = 404;

    if (constituency) {
      // Send JSON response with the constituency data
      res.status(successStatus).json({
        data: constituency,
      });
    } else {
      // Send response with a status code indicating that the constituency was not found
      res.status(notFoundStatus).send("Constituency not found");
    }
  } catch (error) {
    // Handle any errors that may occur during the database retrieval
    console.error(error);
    res.status(notFoundStatus).send("Error retrieving constituency");
  }
});

// Get results from the database and return them as a response
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

// Get the result for the admin
app.get("/api/admin/result", async (req, res) => {
  // Retrieve constituency snapshot from the database
  const constituencySnapshot = await db.ref("constituency").once("value");

  // Extract the result from the snapshot
  const result = constituencySnapshot.val();

  // Check if result exists
  if (result) {
    // Return result with a 200 status code
    res.status(200).send(result);
  } else {
    // Return an empty response with a 204 status code
    res.status(204).send();
  }
});

app.get("/api/election/:option", checkJwt, async (req, res) => {
  // Get email and password from query parameters
  var { email, password } = req.query;

  // Retrieve admin data from the database
  const adminSnapshot = await db.ref("admin").once("value");

  // Check if the provided email and password match the admin credentials
  if (
    password === adminSnapshot.val().password &&
    email === adminSnapshot.val().email
  ) {
    // Get the option from the request parameters
    const option = req.params.option;

    // Retrieve results data from the database
    const snapshot = await db.ref("results").once("value");

    // Get the result for the specified option
    const result = snapshot.val();

    switch (option) {
      default:
        // Invalid option
        console.log("Invalid option:", option);
        break;
      case "start":
        // Check if election is already started
        if (result.status === "Pending") {
          res.status(400).send({ message: "Election already started" });
          break;
        }
        // Check if election is already completed
        else if (result.status === "Completed") {
          res.status(400).send({ message: "Election already completed" });
          break;
        }
        // Start the election
        else {
          result.status = "Pending";
          result.winner = "Pending";
          db.ref("results").set(result);
          res.status(200).send({ message: "Election started" });
          break;
        }
      case "stop":
        // Check if election is already completed
        if (result.status === "Completed") {
          res.status(400).send({ message: "Election already completed" });
          break;
        }
        // Check if election has not started yet
        else if (result.status === "Not Started") {
          res.status(400).send({ message: "Election not yet started" });
          break;
        }
        // Stop the election and set results
        else {
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

// Start the server with SSL certificate
const sslServer = https.createServer(options, app);
sslServer.listen(3001, () => {
  console.log("Secure server is listening on port 3001");
});
