const express = require("express");
const { spawn } = require("child_process");

const app = express();
const port = 5000;

// Serve index.html from public folder
app.use(express.static("public"));

app.get("/stream", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "multipart/x-mixed-replace; boundary=frame",
    "Cache-Control": "no-cache",
    "Connection": "close",
    "Pragma": "no-cache",
  });

  const ffmpeg = spawn("ffmpeg", [
    "-f", "dshow", // or "v4l2" for Linux
    "-i", "video=USB2.0 Camera", // change this to your camera name
    "-f", "mjpeg",
    "-q", "5",
    "pipe:1"
  ]);

  ffmpeg.stdout.on("data", (chunk) => {
    res.write(`--frame\r\n`);
    res.write("Content-Type: image/jpeg\r\n");
    res.write(`Content-Length: ${chunk.length}\r\n\r\n`);
    res.write(chunk);
  });

  ffmpeg.on("close", () => {
    res.end();
  });

  req.on("close", () => {
    ffmpeg.kill("SIGINT");
  });
});

/*app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});*/

app.listen(port, "192.168.221.164", () => {
  console.log(`Server running at http://192.168.221.164:${port}`);
});

