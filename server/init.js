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
const bcrypt = require("bcrypt");

const insertData = async () => {
  await db.ref("constituency").remove();
  await db.ref("results").remove();
  await db.ref("admin").remove();
  await db.ref("users").remove();
  await db.ref("UVC").remove();
  await db
    .ref("constituency")
    .child("shangri-la-town")
    .set({
      constituency: "shangri-la-town",
      result: [
        { name: "Nero Claudius", party: "Red Party", vote: "0" },
        { name: "Artoria Pandragon", party: "Blue Party", vote: "0" },
        { name: "Gilgamesh", party: "Yellow Party", vote: "0" },
        { name: "Siegfried", party: "Independent", vote: "0" },
      ],
    });
  await db
    .ref("constituency")
    .child("northern-kunlun-mountain")
    .set({
      constituency: "northern-kunlun-mountain",
      result: [
        { name: "Atalanta", party: "Red Party", vote: "0" },
        { name: "Euryale", party: "Blue Party", vote: "0" },
        { name: "Arash", party: "Yellow Party", vote: "0" },
        { name: "Cú Chulainn", party: "Independent", vote: "0" },
      ],
    });
  await db
    .ref("constituency")
    .child("western-shangri-la")
    .set({
      constituency: "western-shangri-la",
      result: [
        { name: "Gaius Julius Caesar", party: "Red Party", vote: "0" },
        { name: "Gilles de Rais", party: "Blue Party", vote: "0" },
        { name: "Chevalier d'Eon", party: "Yellow Party", vote: "0" },
        { name: "Robin Hood", party: "Independent", vote: "0" },
      ],
    });
  await db
    .ref("constituency")
    .child("naboo-vallery")
    .set({
      constituency: "naboo-vallery",
      result: [
        { name: "Elizabeth Báthory", party: "Red Party", vote: "0" },
        { name: "Musashibō Benkei", party: "Blue Party", vote: "0" },
        { name: "Leonidas I", party: "Yellow Party", vote: "0" },
        { name: "Romulus", party: "Independent", vote: "0" },
      ],
    });
  await db
    .ref("constituency")
    .child("new-felucia")
    .set({
      constituency: "new-felucia",
      result: [
        { name: "Medusa", party: "Red Party", vote: "0" },
        { name: "Georgios", party: "Blue Party", vote: "0" },
        { name: "Edward Teach", party: "Yellow Party", vote: "0" },
        { name: "Boudica", party: "Independent", vote: "0" },
      ],
    });
  await db.ref("results").set({
    status: "Not Started",
    winner: "N/A",
    seats: [
      { party: "Red Party", seat: "0" },
      { party: "Blue Party", seat: "0" },
      { party: "Yellow Party", seat: "0" },
      { party: "Independent", seat: "0" },
    ],
  });
  await db.ref("admin").set({
    email: "election@shangrila.gov.sr",
    password: await hash("shangrila2024$"),
  });

  await db.ref("UVC").set({
    HH64FWPE: "0",
    BBMNS9ZJ: "0",
    KYMK9PUH: "0",
    WL3K3YPT: "0",
    JA9WCMAS: "0",
    Z93G7PN9: "0",
    WPC5GEHA: "0",
    RXLNLTA6: "0",
    "7XUFD78Y": "0",
    DBP4GQBQ: "0",
    ZSRBTK9S: "0",
    B7DMPWCQ: "0",
    YADA47RL: "0",
    "9GTZQNKB": "0",
    KSM9NB5L: "0",
    BQCRWTSG: "0",
    ML5NSKKG: "0",
    D5BG6FDH: "0",
    "2LJFM6PM": "0",
    "38NWLPY3": "0",
    "2TEHRTHJ": "0",
    G994LD9T: "0",
    Q452KVQE: "0",
    "75NKUXAH": "0",
    DHKVCU8T: "0",
    TH9A6HUB: "0",
    "2E5BHT5R": "0",
    "556JTA32": "0",
    LUFKZAHW: "0",
    DBAD57ZR: "0",
    K96JNSXY: "0",
    PFXB8QXM: "0",
    "8TEXF2HD": "0",
    N6HBFD2X: "0",
    K3EVS3NM: "0",
    "5492AC6V": "0",
    U5LGC65X: "0",
    BKMKJN5S: "0",
    JF2QD3UF: "0",
    NW9ETHS7: "0",
    VFBH8W6W: "0",
    "7983XU4M": "0",
    "2GYDT5D3": "0",
    LVTFN8G5: "0",
    UNP4A5T7: "0",
    UMT3RLVS: "0",
    TZZZCJV8: "0",
    UVE5M7FR: "0",
    W44QP7XJ: "0",
    "9FCV9RMT": "0",
  });

  admin.app().delete();
};

const hash = async (text) => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(text, salt);
  return hash;
};

insertData();
