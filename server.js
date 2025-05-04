const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const portsDataPath = path.join(__dirname, 'ports.json');

const PORT = process.env.PORT || 3000;

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const sketchName = path.parse(file.originalname).name;
    const sketchDir = path.join(__dirname, 'uploads', sketchName);
    fs.mkdirSync(sketchDir, { recursive: true });
    cb(null, sketchDir);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Get available ports
app.get('/ports', (req, res) => {
  try {
    if (fs.existsSync(portsDataPath)) {
      const portsData = JSON.parse(fs.readFileSync(portsDataPath, 'utf8'));
      res.json(portsData);
    } else {
      res.json({ ports: [], timestamp: new Date().toISOString() });
    }
  } catch (err) {
    console.error('Error reading ports data:', err);
    res.status(500).json({ error: 'Could not read ports data' });
  }
});

// Handle sketch upload
// app.post('/upload', upload.single('sketch'), (req, res) => {
//   if (!req.file) {
//     return res.status(400).send('No file uploaded');
//   }

//   const selectedPort = req.body.port || 'COM3';
//   const sketchPath = req.file.path;
//   const sketchName = path.parse(req.file.originalname).name;
//   const sketchDir = path.dirname(sketchPath);
//   const buildPath = path.join(__dirname, 'builds', sketchName);

//   fs.mkdirSync(path.join(__dirname, 'builds'), { recursive: true });
//   fs.mkdirSync(buildPath, { recursive: true });

//   console.log(`Processing sketch for ${selectedPort}: ${sketchPath}`);

//   const compileCmd = `arduino-cli compile "${sketchDir}" -b arduino:avr:mega --build-path "${buildPath}" --verbose`;

//   exec(compileCmd, (compileError, compileStdout, compileStderr) => {
//     if (compileError) {
//       console.error(`Compilation error: ${compileStderr}`);
//       return res.status(500).send(`Compilation failed: ${compileStderr}`);
//     }

//     console.log('Compilation successful, now uploading...');
//     const uploadCmd = `arduino-cli upload -b arduino:avr:mega -p ${selectedPort} --input-dir "${buildPath}" --verbose`;
    
//     cleanOldFiles(path.join(__dirname, 'uploads'));
//     cleanOldFiles(path.join(__dirname, 'builds'));
    
//     exec(uploadCmd, (uploadError, uploadStdout, uploadStderr) => {
//       if (uploadError) {
//         console.error(`Upload error: ${selectedPort}: ${uploadStderr}`);
//         return res.status(500).send(`Upload failed to ${selectedPort}: ${uploadStderr}`);
//       }

//       console.log(`Upload successful to ${selectedPort}`);
//       res.send(`Sketch compiled and uploaded successfully to ${selectedPort}!`);
//     });
//   });
// });

// Handle sketch upload
app.post('/upload', upload.single('sketch'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded');
  }

  const selectedPort = req.body.port; // This already gets the selected port from the form
  if (!selectedPort) {
    return res.status(400).send('No port selected');
  }

  const sketchPath = req.file.path;
  const sketchName = path.parse(req.file.originalname).name;
  const sketchDir = path.dirname(sketchPath);
  const buildPath = path.join(__dirname, 'builds', sketchName);

  fs.mkdirSync(path.join(__dirname, 'builds'), { recursive: true });
  fs.mkdirSync(buildPath, { recursive: true });

  console.log(`Processing sketch for ${selectedPort}: ${sketchPath}`);

  const compileCmd = `arduino-cli compile "${sketchDir}" -b arduino:avr:mega --build-path "${buildPath}" --verbose`;

  exec(compileCmd, (compileError, compileStdout, compileStderr) => {
    if (compileError) {
      console.error(`Compilation error: ${compileStderr}`);
      return res.status(500).send(`Compilation failed: ${compileStderr}`);
    }

    console.log('Compilation successful, now uploading...');
    const uploadCmd = `arduino-cli upload -b arduino:avr:mega -p ${selectedPort} --input-dir "${buildPath}" --verbose`;
    
    cleanOldFiles(path.join(__dirname, 'uploads'));
    cleanOldFiles(path.join(__dirname, 'builds'));
    
    exec(uploadCmd, (uploadError, uploadStdout, uploadStderr) => {
      if (uploadError) {
        console.error(`Upload error: ${selectedPort}: ${uploadStderr}`);
        return res.status(500).send(`Upload failed to ${selectedPort}: ${uploadStderr}`);
      }

      console.log(`Upload successful to ${selectedPort}`);
      res.send(`Sketch compiled and uploaded successfully to ${selectedPort}!`);
    });
  });
});

// Clean old files function
function cleanOldFiles(directory, maxAgeHours = 24) {
  const cutoff = Date.now() - (maxAgeHours * 60 * 60 * 1000);
  fs.readdir(directory, (err, files) => {
    if (err) return;
    files.forEach(file => {
      const filePath = path.join(directory, file);
      fs.stat(filePath, (err, stat) => {
        if (err) return;
        if (stat.isDirectory()) {
          cleanOldFiles(filePath, maxAgeHours);
          fs.readdir(filePath, (err, files) => {
            if (err) return;
            if (files.length === 0) {
              fs.rmdir(filePath, () => {});
            }
          });
        } else if (stat.mtimeMs < cutoff) {
          fs.unlink(filePath, () => {});
        }
      });
    });
  });
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
