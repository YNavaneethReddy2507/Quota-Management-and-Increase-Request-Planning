/**
 * MySQL Database Access Layer with Prisma & In-Memory Fallback
 * Quota Management and Increase Request Planning Control Plane
 */

const { v4: uuidv4 } = require('uuid');
const config = require('../config');

// In-Memory store used during testing, offline development, or when MySQL is unreachable
const memoryStore = {
  projects: [
    {
      id: 'proj-001',
      gcp_project_id: 'enterprise-prod-finance-42',
      environment: 'PRODUCTION',
      created_at: new Date('2026-01-15T00:00:00Z'),
    },
    {
      id: 'proj-002',
      gcp_project_id: 'enterprise-staging-services-18',
      environment: 'STAGING',
      created_at: new Date('2026-02-01T00:00:00Z'),
    },
    {
      id: 'proj-003',
      gcp_project_id: 'ai-research-sandbox-07',
      environment: 'DEVELOPMENT',
      created_at: new Date('2026-03-10T00:00:00Z'),
    },
  ],
  quota_metrics: [
    {
      id: 'qm-001',
      project_id: 'proj-001',
      metric_name: 'compute.googleapis.com/cpus',
      region: 'us-central1',
      current_usage: 92.0,
      quota_limit: 100.0,
      utilization_percentage: 92.0,
      last_synced_at: new Date(),
    },
    {
      id: 'qm-002',
      project_id: 'proj-001',
      metric_name: 'compute.googleapis.com/nvidia_h100_gpus',
      region: 'us-central1',
      current_usage: 14.0,
      quota_limit: 16.0,
      utilization_percentage: 87.5,
      last_synced_at: new Date(),
    },
    {
      id: 'qm-003',
      project_id: 'proj-001',
      metric_name: 'compute.googleapis.com/disks_total_storage_gb',
      region: 'us-central1',
      current_usage: 32000.0,
      quota_limit: 50000.0,
      utilization_percentage: 64.0,
      last_synced_at: new Date(),
    },
    {
      id: 'qm-004',
      project_id: 'proj-002',
      metric_name: 'compute.googleapis.com/cpus',
      region: 'europe-west1',
      current_usage: 45.0,
      quota_limit: 100.0,
      utilization_percentage: 45.0,
      last_synced_at: new Date(),
    },
    {
      id: 'qm-005',
      project_id: 'proj-002',
      metric_name: 'compute.googleapis.com/in_use_addresses',
      region: 'europe-west1',
      current_usage: 18.0,
      quota_limit: 20.0,
      utilization_percentage: 90.0,
      last_synced_at: new Date(),
    },
    {
      id: 'qm-006',
      project_id: 'proj-003',
      metric_name: 'compute.googleapis.com/cpus',
      region: 'us-east4',
      current_usage: 12.0,
      quota_limit: 50.0,
      utilization_percentage: 24.0,
      last_synced_at: new Date(),
    },
  ],
  increase_requests: [
    {
      id: 'req-001',
      quota_metric_id: 'qm-001',
      requested_by: 'lead.architect@enterprise.org',
      current_limit: 100.0,
      requested_limit: 200.0,
      business_justification: 'Quarterly financial ledger batch processing migration scheduled for next week.',
      status: 'PENDING',
      admin_comments: null,
      created_at: new Date(Date.now() - 3600000),
      updated_at: new Date(Date.now() - 3600000),
    },
  ],
};

let prisma = null;
let usePrisma = false;

try {
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient();
  // If explicitly configured with valid connection string
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('root:@')) {
    usePrisma = true;
  }
} catch (e) {
  // Prisma not generated yet or offline
  usePrisma = false;
}

const db = {
  get isPrismaConnected() {
    return usePrisma;
  },

  projects: {
    findMany: async () => {
      if (usePrisma && prisma) {
        try {
          return await prisma.project.findMany();
        } catch (e) {
          // fallback
        }
      }
      return [...memoryStore.projects];
    },
    findUnique: async ({ where }) => {
      if (usePrisma && prisma) {
        try {
          return await prisma.project.findUnique({ where });
        } catch (e) {}
      }
      return memoryStore.projects.find((p) => p.id === where.id || p.gcp_project_id === where.gcp_project_id) || null;
    },
    upsert: async ({ where, update, create }) => {
      if (usePrisma && prisma) {
        try {
          return await prisma.project.upsert({ where, update, create });
        } catch (e) {}
      }
      const existing = memoryStore.projects.find((p) => p.gcp_project_id === where.gcp_project_id);
      if (existing) {
        Object.assign(existing, update);
        return existing;
      }
      const record = { id: uuidv4(), created_at: new Date(), ...create };
      memoryStore.projects.push(record);
      return record;
    },
  },

  quota_metrics: {
    findMany: async (args = {}) => {
      if (usePrisma && prisma) {
        try {
          return await prisma.quotaMetric.findMany(args);
        } catch (e) {}
      }
      let list = [...memoryStore.quota_metrics];
      if (args.where?.project_id) {
        list = list.filter((q) => q.project_id === args.where.project_id);
      }
      if (args.where?.utilization_percentage?.gte !== undefined) {
        list = list.filter((q) => q.utilization_percentage >= args.where.utilization_percentage.gte);
      }
      if (args.skip) {
        list = list.slice(args.skip);
      }
      if (args.take) {
        list = list.slice(0, args.take);
      }
      return list;
    },
    findUnique: async ({ where }) => {
      if (usePrisma && prisma) {
        try {
          return await prisma.quotaMetric.findUnique({ where });
        } catch (e) {}
      }
      return memoryStore.quota_metrics.find((q) => q.id === where.id) || null;
    },
    upsert: async ({ where, update, create }) => {
      if (usePrisma && prisma) {
        try {
          return await prisma.quotaMetric.upsert({ where, update, create });
        } catch (e) {}
      }
      const existingIndex = memoryStore.quota_metrics.findIndex(
        (q) => q.id === where.id || (q.project_id === (where.project_id || create.project_id) && q.metric_name === (where.metric_name || create.metric_name) && q.region === (where.region || create.region))
      );
      if (existingIndex !== -1) {
        memoryStore.quota_metrics[existingIndex] = {
          ...memoryStore.quota_metrics[existingIndex],
          ...update,
          last_synced_at: new Date(),
        };
        return memoryStore.quota_metrics[existingIndex];
      }
      const record = {
        id: create.id || uuidv4(),
        last_synced_at: new Date(),
        ...create,
      };
      memoryStore.quota_metrics.push(record);
      return record;
    },
    update: async ({ where, data }) => {
      if (usePrisma && prisma) {
        try {
          return await prisma.quotaMetric.update({ where, data });
        } catch (e) {}
      }
      const item = memoryStore.quota_metrics.find((q) => q.id === where.id);
      if (item) {
        Object.assign(item, data, { last_synced_at: new Date() });
      }
      return item;
    },
  },

  increase_requests: {
    findMany: async (args = {}) => {
      if (usePrisma && prisma) {
        try {
          return await prisma.increaseRequest.findMany(args);
        } catch (e) {}
      }
      let list = [...memoryStore.increase_requests];
      if (args.where?.status) {
        list = list.filter((r) => r.status === args.where.status);
      }
      return list;
    },
    findUnique: async ({ where }) => {
      if (usePrisma && prisma) {
        try {
          return await prisma.increaseRequest.findUnique({ where });
        } catch (e) {}
      }
      return memoryStore.increase_requests.find((r) => r.id === where.id) || null;
    },
    create: async ({ data }) => {
      if (usePrisma && prisma) {
        try {
          return await prisma.increaseRequest.create({ data });
        } catch (e) {}
      }
      const record = {
        id: uuidv4(),
        status: 'PENDING',
        admin_comments: null,
        created_at: new Date(),
        updated_at: new Date(),
        ...data,
      };
      memoryStore.increase_requests.push(record);
      return record;
    },
    update: async ({ where, data }) => {
      if (usePrisma && prisma) {
        try {
          return await prisma.increaseRequest.update({ where, data });
        } catch (e) {}
      }
      const record = memoryStore.increase_requests.find((r) => r.id === where.id);
      if (record) {
        Object.assign(record, data, { updated_at: new Date() });
      }
      return record;
    },
  },
};

module.exports = {
  db,
  prisma,
  memoryStore,
};
