import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

type HelloResponse = { message: string };

async function fetchHello(): Promise<HelloResponse> {
  const res = await fetch(`${process.env.BACKEND_URL ?? "http://backend:8000"}/hello`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`backend returned ${res.status}`);
  return res.json();
}

export default async function Page(): Promise<JSX.Element> {
  const { message } = await fetchHello();
  return (
    <Box component="main" sx={{ p: 4 }}>
      <Stack spacing={2}>
        <Typography variant="pageTitle" component="h1">
          nbktoybrary
        </Typography>
        <Stack spacing={0.5}>
          <Typography variant="label" color="text.secondary">
            Backend
          </Typography>
          <Typography variant="bodyStrong">{message}</Typography>
        </Stack>
      </Stack>
    </Box>
  );
}
