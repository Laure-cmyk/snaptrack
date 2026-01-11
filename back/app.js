// Express
import 'dotenv/config';
import express from 'express';
import createError from 'http-errors';
import logger from 'morgan';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import indexRouter from '../back/routes/index.js';
import usersRouter from '../back/routes/users.js';
import friendsRouter from '../back/routes/friends.js';
import groupsRouter from '../back/routes/groups.js';
import userGroupsRouter from '../back/routes/userGroups.js';
import journeysRouter from '../back/routes/journeys.js';
import userJourneysRouter from '../back/routes/userJourneys.js';
import stepsRouter from '../back/routes/steps.js';
import ratingsRouter from '../back/routes/ratings.js';
import participationsRouter from '../back/routes/participations.js';
import scoresRouter from '../back/routes/scores.js';

// Load and merge OpenAPI documentation
const docsPath = path.join(__dirname, 'docs');
const openapiFiles = fs.readdirSync(docsPath).filter(file => file.startsWith('openapi-') && file.endsWith('.json'));

// Base OpenAPI document
const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'SnapTrack API',
    description: 'Complete API documentation for SnapTrack application.',
    version: '1.0.0',
    contact: {
      name: 'SnapTrack Team'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server'
    },
    {
      url: 'https://snaptrack-nd9h.onrender.com',
      description: 'Production server'
    }
  ],
  tags: [],
  paths: {},
  components: {
    schemas: {},
    responses: {},
    securitySchemes: {}
  }
};

// Merge all OpenAPI files
for (const file of openapiFiles) {
  const filePath = path.join(docsPath, file);
  const doc = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  // Merge tags
  if (doc.tags) {
    swaggerDocument.tags.push(...doc.tags);
  }
  
  // Merge paths
  if (doc.paths) {
    Object.assign(swaggerDocument.paths, doc.paths);
  }
  
  // Merge components
  if (doc.components) {
    if (doc.components.schemas) {
      Object.assign(swaggerDocument.components.schemas, doc.components.schemas);
    }
    if (doc.components.responses) {
      Object.assign(swaggerDocument.components.responses, doc.components.responses);
    }
    if (doc.components.securitySchemes) {
      Object.assign(swaggerDocument.components.securitySchemes, doc.components.securitySchemes);
    }
  }
}

const app = express();

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
  })
);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Swagger UI documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes REST API
app.use('/api', indexRouter);
app.use('/users', usersRouter);
app.use('/friends', friendsRouter);
app.use('/groups', groupsRouter);
app.use('/user-groups', userGroupsRouter);
app.use('/journeys', journeysRouter);
app.use('/user-journeys', userJourneysRouter);
app.use('/steps', stepsRouter);
app.use('/ratings', ratingsRouter);
app.use('/participations', participationsRouter);
app.use('/scores', scoresRouter);

// Serve static files and index.html in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));

  // Catch-all for SPA - but NOT for API routes
  app.get('{*path}', (req, res, next) => {
    // Skip API routes - let them fall through to 404 handler
    if (
      req.path.startsWith('/users') ||
      req.path.startsWith('/journeys') ||
      req.path.startsWith('/steps') ||
      req.path.startsWith('/friends') ||
      req.path.startsWith('/groups') ||
      req.path.startsWith('/ratings') ||
      req.path.startsWith('/participations') ||
      req.path.startsWith('/scores') ||
      req.path.startsWith('/user-groups') ||
      req.path.startsWith('/user-journeys') ||
      req.path.startsWith('/api-docs') ||
      req.path.startsWith('/api')
    ) {
      return next();
    }
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Send the error status
  res.status(err.status || 500);
  res.send(err.message);
});

export default app;
