import React, { useEffect, useState } from "react";
import {
  styled,
  createTheme,
  ThemeProvider,
  List,
  ListItemIcon,
  ListItemText,
  ListItemButton,
} from "@mui/material";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import MuiDrawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import MuiAppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Grid from "@mui/material/Grid";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import PieChartIcon from "@mui/icons-material/PieChart";
import InfoIcon from "@mui/icons-material/Info";
import BallotIcon from "@mui/icons-material/Ballot";
import LogoutIcon from "@mui/icons-material/Logout";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { VictoryPie } from "victory";
import Cookies from "js-cookie";

const drawerWidth = 240;

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  "& .MuiDrawer-paper": {
    position: "relative",
    whiteSpace: "nowrap",
    width: drawerWidth,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    boxSizing: "border-box",
    ...(!open && {
      overflowX: "hidden",
      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      width: theme.spacing(7),
      [theme.breakpoints.up("sm")]: {
        width: theme.spacing(9),
      },
    }),
  },
}));

const defaultTheme = createTheme();

export default function Dashboard() {
  const [open, setOpen] = React.useState(true);
  const toggleDrawer = () => {
    setOpen(!open);
  };

  const navigate = useNavigate();
  const [userType, setUserType] = useState("user");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [status, setStatus] = useState("");
  const [result, setResult] = useState("");
  const [page, setPage] = useState("info");
  const [userData, setUserData] = useState("[]");
  const [candidates, setCandidates] = useState("[]");
  const [allCandidates, setAllCandidates] = useState("[]");
  const [selectedConstituency, setSelectedConstituency] =
    useState("shangri-la-town");
  const [isLoading, setIsLoading] = useState(null);
  const pwdHash = Cookies.get("password");
  const token = Cookies.get("token");
  const email = Cookies.get("email");

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get("/api/dashboard/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            email,
            password: pwdHash,
          },
        });

        if (response.data.data === "admin") {
          setUserType("admin");
          const adminResponse = await axios.get("/api/admin/result");
          setAllCandidates(adminResponse.data);
        } else {
          setUserType("user");
          setUserData(response.data.data);
          const constituencyResponse = await axios.get(
            `/gevs/constituency/${response.data.data.constituency}`
          );
          setCandidates(constituencyResponse.data.data);
        }
        checkStatus();
      } catch (error) {
        if (error.response) {
          navigate("/login");
        } else {
          console.error(error);
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const handleVote = async (party, constituency) => {
    try {
      const response = await axios.post(
        "/api/vote/",
        {
          password: pwdHash,
          constituency,
          party,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSuccessMessage(response.data.message);
      setErrorMessage("");
    } catch (error) {
      if (error.response && error.response.status === 401) {
        setErrorMessage("Token expired, please login again.");
        setTimeout(() => {
          clearAllCookies();
          navigate("/login");
        }, 2000);
      } else if (error.response && error.response.data) {
        setErrorMessage(error.response.data.message);
        setSuccessMessage("");
      } else {
        setErrorMessage("An error occurred.");
        setSuccessMessage("");
      }
    }
  };
  const checkStatus = async () => {
    const response = await axios.get("/gevs/results/");
    const status = response.data.data.status;
    switch (status) {
      default:
        break;
      case "Not Started":
        setStatus("Election has not started.");
        setResult("Election has not started.");
        break;
      case "Pending":
        setStatus("Election has started.");
        setResult("Election is ongoing");
        break;
      case "Completed":
        setStatus("Election has completed.");
        setResult(
          "Election has completed. Overall winner is " + response.data.data.winner
        );
        break;
    }
  };

  const manageElection = async (option) => {
    try {
      const response = await axios.get(`/api/election/${option}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          email,
          password: pwdHash,
        },
      });
      setSuccessMessage(response.data.message);
      setErrorMessage("");
    } catch (error) {
      if (error.response && error.response.status === 401) {
        setErrorMessage("Token expired, please login again.");
        setTimeout(() => {
          clearAllCookies();
          navigate("/login");
        }, 2000);
      } else if (error.response && error.response.data) {
        setErrorMessage(error.response.data.message);
        setSuccessMessage("");
      }
    }
  };

  const renderPageContent = () => {
    switch (page) {
      default:
      case "info":
        if (userType === "admin") {
          return (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h4">User Information</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h4">
                  Election Commission Officer Account
                </Typography>
              </Grid>
            </Grid>
          );
        } else {
          return (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h4">User Information</Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1">
                  Full Name: {userData.fullName}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1">
                  Email: {userData.email}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1">
                  Date of Birth: {userData.DOB}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1">
                  Constituency: {userData.constituency}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1">
                  Unique Voter Code: {userData.UVC}
                </Typography>
              </Grid>
            </Grid>
          );
        }

      case "results":
        if (userType === "admin") {
          const constituencyData = allCandidates[selectedConstituency]?.result;

          const handleConstituencyChange = (event) => {
            setSelectedConstituency(event.target.value);
          };

          const pieChartData = constituencyData?.map((vote) => ({
            x: `(${vote.vote})`,
            y: vote.vote,
          }));

          return (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h4">Results</Typography>
                <Typography variant="h5">Select constituency</Typography>
              </Grid>
              <Grid item xs={12}>
                <FormControl>
                  <Select
                    value={selectedConstituency}
                    onChange={handleConstituencyChange}
                  >
                    {Object.keys(allCandidates).map((constituency) => (
                      <MenuItem key={constituency} value={constituency}>
                        {allCandidates[constituency].constituency}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              {constituencyData?.map((candidate) => (
                <Grid item xs={12} key={candidate.name}>
                  <Typography variant="h6">
                    {candidate.name}, {candidate.party}
                  </Typography>
                </Grid>
              ))}
              <Grid item xs={6}>
                {pieChartData && (
                  <div style={{ width: "80%", height: "80%" }}>
                    <VictoryPie
                      data={pieChartData}
                      colorScale={["red", "blue", "yellow", "grey"]}
                      labelRadius={({ innerRadius }) => innerRadius + 50}
                    />
                  </div>
                )}
              </Grid>
              {result && (
                <Grid item xs={12}>
                  <Typography variant="h4" style={{ color: "black" }}>
                    {result}
                  </Typography>
                </Grid>
              )}
            </Grid>
          );
        } else {
          const candidateVotes = {};
          let maxVoteCount = 0;
          let mostVotedCandidate = "";
          candidates.result?.forEach((candidate) => {
            const name = candidate.name;
            const voteCount = parseInt(candidate.vote);
            candidateVotes[name] = voteCount;
            if (voteCount > maxVoteCount) {
              maxVoteCount = voteCount;
              mostVotedCandidate = `${name}. `;
            } else if (voteCount === maxVoteCount) {
              // Handle tied candidates
              mostVotedCandidate += `${name}. `;
            }
          });
          const data = candidates.result.map((vote) => ({
            x: `(${vote.vote})`,
            y: vote.vote,
          }));

          return (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h4">Results</Typography>
              </Grid>
              <Grid item xs={6}>
                <div style={{ width: "80%", height: "80%" }}>
                  {candidates.result?.map((candidate) => (
                    <Grid item xs={12} key={candidate.name}>
                      <Typography variant="h6">
                        {candidate.name}, {candidate.party}
                      </Typography>
                    </Grid>
                  ))}
                  <VictoryPie
                    data={data}
                    colorScale={["red", "blue", "yellow", "grey"]}
                    labelRadius={({ innerRadius }) => innerRadius + 50}
                  />
                  <Grid item xs={12}>
                    <Typography variant="h4" style={{ color: "black" }}>
                      Most voted candidate(s): {mostVotedCandidate}
                    </Typography>
                  </Grid>

                  {result && (
                    <Grid item xs={12}>
                      <Typography variant="h4" style={{ color: "black" }}>
                        {result}
                      </Typography>
                    </Grid>
                  )}
                </div>
              </Grid>
            </Grid>
          );
        }

      case "vote":
        if (userType === "admin") {
          return (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h4">Manage Election</Typography>
              </Grid>
              {status && (
                <Grid item xs={12}>
                  <Typography variant="subtitle1" style={{ color: "black" }}>
                    {status}
                  </Typography>
                </Grid>
              )}
              <Grid item xs={12}>
                <Button
                  onClick={() => manageElection("start")}
                  size="small"
                  type="button"
                  style={{
                    backgroundColor: "#1976d2",
                    color: "white",
                    fontSize: "1.2rem",
                    padding: "10px 20px",
                  }}
                >
                  Start Election
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Button
                  onClick={() => manageElection("stop")}
                  size="small"
                  type="button"
                  style={{
                    backgroundColor: "#1976d2",
                    color: "white",
                    fontSize: "1.2rem",
                    padding: "10px 20px",
                  }}
                >
                  Stop Election
                </Button>
                {successMessage && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" style={{ color: "green" }}>
                      {successMessage}
                    </Typography>
                  </Grid>
                )}
                {errorMessage && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" style={{ color: "red" }}>
                      {errorMessage}
                    </Typography>
                  </Grid>
                )}
              </Grid>
              <Grid item xs={6}></Grid>
            </Grid>
          );
        } else {
          return (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h4">Vote in Your Constituency</Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h4">{userData.constituency}</Typography>
              </Grid>

              <Grid item xs={12}>
                <Divider />
              </Grid>
              {status && (
                <Grid item xs={12}>
                  <Typography variant="subtitle1" style={{ color: "black" }}>
                    {status}
                  </Typography>
                </Grid>
              )}
              {errorMessage && (
                <Grid item xs={12}>
                  <Typography variant="subtitle1" style={{ color: "red" }}>
                    {errorMessage}
                  </Typography>
                </Grid>
              )}
              {successMessage && (
                <Grid item xs={12}>
                  <Typography variant="subtitle1" style={{ color: "green" }}>
                    {successMessage}
                  </Typography>
                </Grid>
              )}
              {candidates.result.map((candidate) => (
                <Grid item xs={12} key={candidate.name}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">{candidate.name}</Typography>
                      <Typography variant="subtitle1">
                        {candidate.party}
                      </Typography>
                    </CardContent>
                    <Button
                      onClick={() =>
                        handleVote(candidate.party, userData.constituency)
                      }
                      size="small"
                      type="button"
                    >
                      Vote
                    </Button>
                  </Card>
                </Grid>
              ))}
            </Grid>
          );
        }
    }
  };

  const clearAllCookies = () => {
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
  };
  const logout = () => {
    var result = window.confirm("Are you sure you want to log out?");
    if (result) {
      clearAllCookies();
      navigate("/login");
    }
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <Box sx={{ display: "flex" }}>
        <CssBaseline />
        <AppBar position="absolute" open={open}>
          <Toolbar
            sx={{
              pr: "24px", // keep right padding when drawer closed
            }}
          >
            <IconButton
              edge="start"
              color="inherit"
              aria-label="open drawer"
              onClick={toggleDrawer}
              sx={{
                marginRight: "36px",
                ...(open && { display: "none" }),
              }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              component="h1"
              variant="h6"
              color="inherit"
              noWrap
              sx={{ flexGrow: 1 }}
            >
              Dashboard
            </Typography>
          </Toolbar>
        </AppBar>
        <Drawer variant="permanent" open={open}>
          <Toolbar
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              px: [1],
            }}
          >
            <IconButton onClick={toggleDrawer}>
              <ChevronLeftIcon />
            </IconButton>
          </Toolbar>
          <Divider />
          <List>
            <ListItemButton onClick={() => setPage("info")}>
              <ListItemIcon>
                <InfoIcon />
              </ListItemIcon>
              <ListItemText primary="Info" />
            </ListItemButton>
            <ListItemButton onClick={() => setPage("results")}>
              <ListItemIcon>
                <PieChartIcon />
              </ListItemIcon>
              <ListItemText primary="Results" />
            </ListItemButton>
            <ListItemButton onClick={() => setPage("vote")}>
              <ListItemIcon>
                <BallotIcon />
              </ListItemIcon>
              <ListItemText primary="Vote" />
            </ListItemButton>
            <ListItemButton onClick={() => logout()}>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Log Out" />
            </ListItemButton>
          </List>
        </Drawer>
        <Box
          component="main"
          sx={{
            backgroundColor: (theme) =>
              theme.palette.mode === "light"
                ? theme.palette.grey[100]
                : theme.palette.grey[900],
            flexGrow: 1,
            height: "100vh",
            overflow: "auto",
          }}
        >
          <Toolbar />
          {isLoading ? "Loading..." : renderPageContent()}
        </Box>
      </Box>
    </ThemeProvider>
  );
}
