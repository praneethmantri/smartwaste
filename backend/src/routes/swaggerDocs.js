import swaggerUi from 'swagger-ui-express';

const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Smart Waste Collection and Management System API',
    version: '1.0.0',
    description:
      'Production RESTful API for the Smart Waste Community Service Project (CSP). Backed by PostgreSQL 18 & Express.js. Powers Citizen Portal, Sanitation Worker Portal, and Municipal Admin Control Center.',
    contact: {
      name: 'Smart Waste Engineering Team',
      email: 'admin@smartwaste.gov',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000/api',
      description: 'Local Development API Gateway',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token obtained from /auth/login or /auth/register',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          fullName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          role: { type: 'string', enum: ['CITIZEN', 'WORKER', 'ADMIN'] },
          address: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          pincode: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Complaint: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          complaintReference: { type: 'string', example: 'SW-2026-0001' },
          wasteType: { type: 'string', example: 'Wet waste' },
          category: { type: 'string', example: 'Garbage not collected' },
          description: { type: 'string' },
          priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'] },
          latitude: { type: 'number', example: 17.7215 },
          longitude: { type: 'number', example: 83.2985 },
          address: { type: 'string' },
          status: { type: 'string', enum: ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'REOPENED'] },
          imageUrl: { type: 'string', nullable: true },
          assignedWorkerId: { type: 'string', format: 'uuid', nullable: true },
          serviceZoneId: { type: 'string', format: 'uuid', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          completedAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      Schedule: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          serviceZoneId: { type: 'string', format: 'uuid' },
          workerId: { type: 'string', format: 'uuid', nullable: true },
          collectionDate: { type: 'string', format: 'date' },
          collectionTime: { type: 'string', example: '07:00 AM - 09:00 AM' },
          wasteType: { type: 'string' },
          vehicleNumber: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'System health check',
        responses: {
          200: {
            description: 'System healthy and running',
            content: { 'application/json': { example: { status: 'HEALTHY', system: 'Smart Waste' } } },
          },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Citizen public registration',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['fullName', 'email', 'password'],
                properties: {
                  fullName: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 6 },
                  phone: { type: 'string' },
                  address: { type: 'string' },
                  city: { type: 'string' },
                  state: { type: 'string' },
                  pincode: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Citizen registered successfully' },
          409: { description: 'Email already registered' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Authenticate citizen, worker, or administrator',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Authenticated successfully with JWT token' },
          401: { description: 'Invalid email or password' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Authentication'],
        summary: 'User session logout',
        responses: { 200: { description: 'Logged out successfully' } },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get current authenticated user profile',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Active user profile' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Request password reset',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['email'], properties: { email: { type: 'string' } } } } },
        },
        responses: { 200: { description: 'Reset instructions acknowledged' } },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Reset account password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'newPassword'],
                properties: {
                  email: { type: 'string' },
                  newPassword: { type: 'string', minLength: 6 },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Password reset completed' }, 404: { description: 'User not found' } },
      },
    },
    '/complaints': {
      get: {
        tags: ['Complaints'],
        summary: 'List complaints scoped to role with filters & pagination',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'wasteType', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'priority', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { 200: { description: 'Complaints list and aggregate counts' } },
      },
      post: {
        tags: ['Complaints'],
        summary: 'Submit a new waste grievance (Citizen)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['wasteType', 'category', 'description', 'latitude', 'longitude', 'address'],
                properties: {
                  wasteType: { type: 'string' },
                  category: { type: 'string' },
                  description: { type: 'string', minLength: 10 },
                  priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'] },
                  latitude: { type: 'number' },
                  longitude: { type: 'number' },
                  address: { type: 'string' },
                  image: { type: 'string', format: 'binary' },
                  serviceZoneId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Complaint created' }, 400: { description: 'Validation error' } },
      },
    },
    '/complaints/{id}': {
      get: {
        tags: ['Complaints'],
        summary: 'Get detailed complaint audit trail & proofs',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Complaint details' }, 403: { description: 'Forbidden' }, 404: { description: 'Not found' } },
      },
    },
    '/complaints/{id}/status': {
      patch: {
        tags: ['Complaints'],
        summary: 'Update grievance status (Sanitation Worker / Admin)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'REOPENED'] },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Status updated' } },
      },
    },
    '/complaints/{id}/assign': {
      patch: {
        tags: ['Complaints'],
        summary: 'Allocate complaint to sanitation worker (Admin only)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['workerId'],
                properties: {
                  workerId: { type: 'string', format: 'uuid' },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Assigned successfully' } },
      },
    },
    '/complaints/{id}/reopen': {
      post: {
        tags: ['Complaints'],
        summary: 'Reopen an unresolved complaint (Citizen / Admin)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': { schema: { type: 'object', properties: { notes: { type: 'string' } } } },
          },
        },
        responses: { 200: { description: 'Complaint reopened' } },
      },
    },
    '/workers': {
      get: {
        tags: ['Workers'],
        summary: 'Get all municipal sanitation workers (Admin)',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Workers list' } },
      },
    },
    '/workers/tasks': {
      get: {
        tags: ['Workers'],
        summary: 'Get assigned tasks and daily timetable for worker',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Worker roster' } },
      },
    },
    '/workers/tasks/{id}/status': {
      patch: {
        tags: ['Workers'],
        summary: 'Worker update task status (IN_PROGRESS, COMPLETED)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string' },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Task status updated' } },
      },
    },
    '/workers/tasks/{id}/completion-proof': {
      post: {
        tags: ['Workers'],
        summary: 'Upload photographic proof of cleaned spot and complete task',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['image'],
                properties: {
                  image: { type: 'string', format: 'binary' },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Completion proof recorded' } },
      },
    },
    '/schedules': {
      get: {
        tags: ['Schedules'],
        summary: 'Get waste collection schedule calendar',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'serviceZoneId', in: 'query', schema: { type: 'string' } },
          { name: 'date', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Schedules list' } },
      },
      post: {
        tags: ['Schedules'],
        summary: 'Create collection schedule round (Admin)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['serviceZoneId', 'collectionDate', 'collectionTime', 'wasteType'],
                properties: {
                  serviceZoneId: { type: 'string' },
                  workerId: { type: 'string' },
                  collectionDate: { type: 'string', format: 'date' },
                  collectionTime: { type: 'string' },
                  wasteType: { type: 'string' },
                  vehicleNumber: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Schedule created' } },
      },
    },
    '/schedules/zones': {
      get: {
        tags: ['Schedules'],
        summary: 'Get all municipal service zones & wards',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Zones list' } },
      },
    },
    '/schedules/{id}': {
      patch: {
        tags: ['Schedules'],
        summary: 'Update collection schedule (Admin)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: { 'application/json': { schema: { type: 'object' } } },
        },
        responses: { 200: { description: 'Schedule updated' } },
      },
      delete: {
        tags: ['Schedules'],
        summary: 'Cancel collection schedule (Admin)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Schedule cancelled' } },
      },
    },
    '/feedback': {
      get: {
        tags: ['Feedback'],
        summary: 'Get satisfaction ratings and reviews',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Feedback reviews list and average rating' } },
      },
      post: {
        tags: ['Feedback'],
        summary: 'Submit citizen rating for completed task',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['complaintId', 'rating'],
                properties: {
                  complaintId: { type: 'string', format: 'uuid' },
                  rating: { type: 'integer', minimum: 1, maximum: 5 },
                  recommendation: { type: 'boolean', default: true },
                  comments: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Feedback saved' }, 409: { description: 'Already submitted' } },
      },
    },
    '/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'Get in-app activity notifications',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Notifications and unread count' } },
      },
    },
    '/notifications/{id}/read': {
      patch: {
        tags: ['Notifications'],
        summary: 'Mark single notification as read',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Marked read' } },
      },
    },
    '/notifications/read-all': {
      patch: {
        tags: ['Notifications'],
        summary: 'Mark all user notifications as read',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'All marked read' } },
      },
    },
    '/profile': {
      get: {
        tags: ['Profile'],
        summary: 'Get user profile details',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'User profile' } },
      },
      patch: {
        tags: ['Profile'],
        summary: 'Update user profile details and avatar',
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  fullName: { type: 'string' },
                  phone: { type: 'string' },
                  address: { type: 'string' },
                  city: { type: 'string' },
                  state: { type: 'string' },
                  pincode: { type: 'string' },
                  profileImage: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Profile updated' } },
      },
    },
    '/profile/password': {
      patch: {
        tags: ['Profile'],
        summary: 'Change account password',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currentPassword', 'newPassword'],
                properties: {
                  currentPassword: { type: 'string' },
                  newPassword: { type: 'string', minLength: 6 },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Password changed' }, 400: { description: 'Incorrect current password' } },
      },
    },
    '/admin/statistics': {
      get: {
        tags: ['Admin'],
        summary: 'Live database KPI statistics (Admin only)',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Live KPI metrics from PostgreSQL' } },
      },
    },
    '/admin/analytics': {
      get: {
        tags: ['Admin'],
        summary: 'Visual analytics breakdown (category, status, zones, performance)',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Charts dataset' } },
      },
    },
    '/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'User & staff roster lookup',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'role', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Users list' } },
      },
    },
    '/admin/export/csv': {
      get: {
        tags: ['Admin'],
        summary: 'Export complete complaints dataset as CSV download',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'CSV stream', content: { 'text/csv': {} } } },
      },
    },
    '/admin/export/pdf': {
      get: {
        tags: ['Admin'],
        summary: 'Generate official formatted municipal audit report (PDF)',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'PDF stream', content: { 'application/pdf': {} } } },
      },
    },
  },
};

export const setupSwagger = (app) => {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Smart Waste Management - API Docs',
  }));
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};
