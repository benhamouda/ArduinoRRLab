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
    "-video_size", "640x480",         // Lower resolution = faster streaming

    "-i", "video=USB2.0 Camera", // change this to your camera name
    "-f", "mjpeg",
    "-q", "5",
    "pipe:1"
  ]);

  // const ffmpeg = spawn("ffmpeg", [
  //   "-f", "dshow",                     // Windows; use v4l2 on Linux
  //   // "-framerate", "30",               // Input FPS (depends on camera capability)
  //   // "-video_size", "640x480",         // Lower resolution = faster streaming
  //   "-i", "video=USB2.0 Camera",      // Camera name
  
  //   // "-r", "30",                       // Output FPS
  //   // "-q:v", "5",                      // JPEG quality (2 = best, 31 = worst)
  //   "-fflags", "nobuffer",            // Reduce latency
  //   "-flags", "low_delay",            // Low-latency flag
  //   "-an",                            // Disable audio
  //   "-f", "mjpeg",                    // MJPEG format
  //   "pipe:1"
  // ]);
  

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

app.listen(port,  () => {
  console.log(`Server running at http://localhost:${port}`);
});

