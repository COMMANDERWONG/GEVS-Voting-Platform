import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import Link from "@mui/material/Link";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from "@mui/material/InputLabel";
import { QrScanner } from "@yudiel/react-qr-scanner";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useState } from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { format } from "date-fns";
import * as Yup from "yup";

const defaultTheme = createTheme();

export default function SignUp() {
  const handleSubmit = async (event) => {
    event.preventDefault();
    var checkField = true;
    const data = new FormData(event.currentTarget);
    const formattedDOB = format(dob, "yyyy-MM-dd");

    setFormErrors({
      fullName: !data.get("fullName"),
      email: !data.get("email"),
      password: !data.get("password"),
      UVC: !uvc,
    });

    const payload = {
      fullName: data.get("fullName"),
      email: data.get("email"),
      password: data.get("password"),
      constituency: data.get("constituency"),
      DOB: formattedDOB,
      UVC: uvc,
    };

    for (let field in payload) {
      if (!payload[field]) {
        checkField = false;
        break;
      }
    }
    if (!checkField) {
      setErrorMessage("Please enter all required fields");
    } else if ((await checkEmail(payload.email)) === false) {
    } else if ((await checkPassword(payload.password)) === false) {
    } else {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        setErrorMessage("");
        setSuccessMessage(result.message);
      } else {
        setSuccessMessage("");
        setErrorMessage(result.message);
      }
    }
  };

  const [constituency, setConstituency] = useState("shangri-la-town");
  const [dob, setdob] = React.useState(new Date("2000-01-01"));
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [uvc, setuvc] = useState("");
  const [showScanner, setShowScanner] = useState(true);
  const handleConstituency = (event) => {
    setConstituency(event.target.value);
  };

  const [formErrors, setFormErrors] = useState({
    fullName: false,
    email: false,
    password: false,
    UVC: false,
  });

  const handleScan = (data) => {
    if (data) {
      setuvc(data.text);
    }
  };

  const handleError = (err) => {
    setErrorMessage(err);
  };

  const checkEmail = async (email) => {
    const emailSchema = Yup.string().email("Please enter a valid email");
    let isValid = false;
    try {
      await emailSchema.validate(email);
      isValid = true;
    } catch (err) {
      setErrorMessage(err.message); // Prints 'Invalid email address' if validation fails
    }
    return isValid;
  };

  const checkPassword = async (password) => {
    const passwordSchema = Yup.string()
      .min(8, "Password must be at least 8 characters")
      .matches(/[a-z]/, "Password must contain at least one lowercase letter")
      .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
      .matches(/\d/, "Password must contain at least one number")
      .matches(/\W|_/, "Password must contain at least one symbol");
    let isValid = false;
    try {
      await passwordSchema.validate(password);
      isValid = true;
    } catch (err) {
      setErrorMessage(err.message); // Prints the error message if validation fails
    }
    return isValid;
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: "#1976d2" }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            GEVS
          </Typography>
          <Typography component="h1" variant="h5">
            Sign up
          </Typography>
          <Box
            component="form"
            noValidate
            onSubmit={handleSubmit}
            sx={{ mt: 3 }}
          >
            {errorMessage && (
              <Typography align="center" style={{ color: "red" }}>
                {errorMessage}
              </Typography>
            )}
            {successMessage && (
              <Typography align="center" style={{ color: "green" }}>
                {successMessage}
              </Typography>
            )}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  error={formErrors.fullName}
                  autoComplete="full-name"
                  name="fullName"
                  required
                  fullWidth
                  id="fullName"
                  label="Full Name"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  error={formErrors.email}
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  error={formErrors.password}
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="new-password"
                />
              </Grid>
              <Grid item xs={12}>
                <InputLabel id="label" variant="standard">
                  Constituency *
                </InputLabel>
                <Select
                  labelId="label"
                  value={constituency}
                  required
                  fullWidth
                  id="constituency"
                  onChange={handleConstituency}
                >
                  <MenuItem value={"shangri-la-town"}>Shangri-La Town</MenuItem>
                  <MenuItem value={"northern-kunlun-mountain"}>
                    Northern Kunlun Mountain
                  </MenuItem>
                  <MenuItem value={"western-shangri-la"}>
                    Western Shangri-La
                  </MenuItem>
                  <MenuItem value={"naboo-vallery"}>Naboo Vallery</MenuItem>
                  <MenuItem value={"new-felucia"}>New Felucia</MenuItem>
                </Select>
                <input type="hidden" name="constituency" value={constituency} />
              </Grid>
              <Grid item xs={12}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    required
                    id="dob"
                    label="Date Of Birth *"
                    value={dob}
                    onChange={(newValue) => setdob(newValue)}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  error={formErrors.UVC}
                  required
                  fullWidth
                  name="UVC"
                  label="Unique Voter Code"
                  id="UVC"
                  value={uvc}
                  autoComplete="UVC"
                  onChange={(e) => setuvc(e.target.value)}
                />
              </Grid>
              <Grid item xs={6}>
                <Button
                  variant="contained"
                  onClick={() => setShowScanner(!showScanner)}
                >
                  Scan QR Code
                </Button>
              </Grid>
              <Grid item xs={12}>
                <QrScanner
                  onError={handleError}
                  onResult={handleScan}
                  stopDecoding={showScanner}
                />
              </Grid>
            </Grid>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Sign Up
            </Button>
            <Grid container justifyContent="flex-end">
              <Grid item>
                <Link href="/login" variant="body2">
                  Already have an account? Sign in
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}
