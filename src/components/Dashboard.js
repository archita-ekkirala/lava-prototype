import React, { useEffect, useState } from "react";
import { Container, Card, CardContent, Typography, CircularProgress, Alert } from "@mui/material";

function Dashboard() {
  const [count, setCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPatientCount = async () => {
      try {
        const response = await fetch("https://fhir-dev.mettles.com/fhir-services/Patient");
        const data = await response.json();
        if (data && data.total !== undefined) {
          setCount(data.total);
        } else {
          throw new Error("Invalid response structure");
        }
      } catch (err) {
        setError("Failed to fetch patient data");
      } finally {
        setLoading(false);
      }
    };

    fetchPatientCount();
  }, []);

  return (
    <Container maxWidth="sm" sx={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Card sx={{ padding: 4, textAlign: "center" }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Patient Count
          </Typography>
          {loading ? (
            <CircularProgress />
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <Typography variant="h3" color="primary">{count}</Typography>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}

export default Dashboard;
