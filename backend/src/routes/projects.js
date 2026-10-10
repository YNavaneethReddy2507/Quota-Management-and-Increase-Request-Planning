/**
 * Projects Router
 * GET /api/v1/projects - Lists all tracked GCP projects
 * Quota Management and Increase Request Planning Control Plane
 */

const express = require('express');
const { db } = require('../db');

const router = express.Router();

// GET /api/v1/projects
router.get('/', async (req, res) => {
  try {
    const projects = await db.projects.findMany();
    return res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    console.error('[PROJECTS ROUTE ERROR]', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve GCP projects',
      message: error.message,
    });
  }
});

// GET /api/v1/projects/:id
router.get('/:id', async (req, res) => {
  try {
    const project = await db.projects.findUnique({
      where: { id: req.params.id },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve project',
      message: error.message,
    });
  }
});

module.exports = router;
