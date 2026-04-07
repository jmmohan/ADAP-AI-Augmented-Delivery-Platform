import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import poAgentRoutes from './routes/poAgentRoutes.js';
import archAgentRoutes from './routes/archAgentRoutes.js';
import testAgentRoutes from './routes/testAgentRoutes.js';
import codeAgentRoutes from './routes/codeAgentRoutes.js';
import deployAgentRoutes from './routes/deployAgentRoutes.js';
import monitorAgentRoutes from './routes/monitorAgentRoutes.js';
import reviewAgentRoutes from './routes/reviewAgentRoutes.js';
import codeReviewAgentRoutes from './routes/codeReviewAgentRoutes.js';
import securityAgentRoutes from './routes/securityAgentRoutes.js';
import docAgentRoutes from './routes/docAgentRoutes.js';
import releaseAgentRoutes from './routes/releaseAgentRoutes.js';
import complianceAgentRoutes from './routes/complianceAgentRoutes.js';
import perfAgentRoutes from './routes/perfAgentRoutes.js';
import incidentAgentRoutes from './routes/incidentAgentRoutes.js';
import gitRoutes from './routes/gitRoutes.js';
import promptRoutes from './routes/promptRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..', '..');
const frontendDir = path.join(workspaceRoot, 'frontend');

app.use(express.json({ limit: '1mb' }));
app.use('/api', poAgentRoutes);
app.use('/api', archAgentRoutes);
app.use('/api', testAgentRoutes);
app.use('/api', codeAgentRoutes);
app.use('/api', deployAgentRoutes);
app.use('/api', monitorAgentRoutes);
app.use('/api', reviewAgentRoutes);
app.use('/api', codeReviewAgentRoutes);
app.use('/api', securityAgentRoutes);
app.use('/api', docAgentRoutes);
app.use('/api', releaseAgentRoutes);
app.use('/api', complianceAgentRoutes);
app.use('/api', perfAgentRoutes);
app.use('/api', incidentAgentRoutes);
app.use('/api', gitRoutes);
app.use('/api', promptRoutes);
app.use('/api', settingsRoutes);
app.use(express.static(frontendDir));

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

app.use((error, req, res, next) => {
  const status = error.status || 500;
  const message = error.message || 'Unexpected server error.';
  if (config.nodeEnv !== 'production') {
    console.error(error);
  }
  res.status(status).json({ message });
});

app.listen(config.port, () => {
  console.log(`AADP platform running on http://localhost:${config.port}`);
});
