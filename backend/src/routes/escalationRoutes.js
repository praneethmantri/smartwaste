import express from 'express';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware.js';
import {
  getEscalationConfig,
  triggerEscalationCheck,
  getEscalatedComplaints,
  handleReassign,
  handlePrioritize,
  handleCollectorInstructions,
  handleResolveEscalated,
} from '../controllers/escalationController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateJWT);

// SLA and escalation settings info
router.get('/config', getEscalationConfig);

// Escalated complaints list
router.get(
  '/complaints',
  authorizeRoles('MUNICIPAL_OFFICER', 'COLLECTOR_OFFICE', 'ADMIN'),
  getEscalatedComplaints
);

// Manual or scheduler trigger
router.post(
  '/check',
  authorizeRoles('ADMIN', 'MUNICIPAL_OFFICER', 'COLLECTOR_OFFICE'),
  triggerEscalationCheck
);

// Municipal Officer / Collector reassign worker
router.patch(
  '/complaints/:id/reassign',
  authorizeRoles('MUNICIPAL_OFFICER', 'COLLECTOR_OFFICE', 'ADMIN'),
  handleReassign
);

// Municipal Officer / Collector prioritize complaint
router.patch(
  '/complaints/:id/prioritize',
  authorizeRoles('MUNICIPAL_OFFICER', 'COLLECTOR_OFFICE', 'ADMIN'),
  handlePrioritize
);

// District Collector Office directives / instructions
router.patch(
  '/complaints/:id/instructions',
  authorizeRoles('COLLECTOR_OFFICE', 'ADMIN'),
  handleCollectorInstructions
);

// Resolve escalated complaint
router.patch(
  '/complaints/:id/resolve',
  authorizeRoles('MUNICIPAL_OFFICER', 'COLLECTOR_OFFICE', 'ADMIN'),
  handleResolveEscalated
);

export default router;
