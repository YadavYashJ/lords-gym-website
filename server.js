// LORD'S GYM — Entry point server runner
const config = require('./src/config');
const app = require('./src/app');

app.listen(config.port, () => {
  console.log(`====================================================`);
  console.log(` LORD'S GYM — Sachin, Surat Management Portal      `);
  console.log(` Lead Developer: Yadav Yash Jayprakash              `);
  console.log(` Enrollment:     202506101410003                    `);
  console.log(`====================================================`);
  console.log(` Website:       http://localhost:${config.port}`);
  console.log(` Member Portal: http://localhost:${config.port}/member`);
  console.log(` Admin Command: http://localhost:${config.port}/admin`);
  console.log(` REST API:      http://localhost:${config.port}/api/health`);
  console.log(` Environment:   ${config.nodeEnv}`);
  console.log(`====================================================`);
});
