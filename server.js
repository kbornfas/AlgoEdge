const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║                                                                ║');
console.log('║                   🌐 FRONTEND SERVER (Next.js)                 ║');
console.log('║                       AlgoEdge Web Interface                   ║');
console.log('║                                                                ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');
console.log('📍 This is the FRONTEND Next.js server for the web interface');
console.log('📍 For API/backend server, see backend/server.js');
console.log('');

// Create Next.js app
const app = next({ dev, hostname });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  })
    .once('error', (err) => {
      console.error('Server error:', err);
      process.exit(1);
    })
    .listen(port, hostname, () => {
      console.log('\n✅ Frontend Server Started Successfully');
      console.log('========================================');
      console.log(`Server: FRONTEND (Next.js)`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Listening on: http://${hostname}:${port}`);
      console.log(`Port: ${port} (from ${process.env.PORT ? 'process.env.PORT' : 'default'})`);
      console.log(`Hostname: ${hostname}`);
      console.log(`Ready for connections`);
      console.log('========================================\n');
    });
});
