export function buildMockCodeGen(stories) {
  return {
    scaffold: {
      project_structure: [
        { path: 'src/app.module.ts', type: 'config', description: 'NestJS root module with dependency injection', lines: 35 },
        { path: 'src/slices/slice.module.ts', type: 'config', description: 'Slice feature module with providers', lines: 22 },
        { path: 'src/slices/slice.controller.ts', type: 'controller', description: 'REST controller for slice CRUD operations', lines: 85 },
        { path: 'src/slices/slice.service.ts', type: 'service', description: 'Core business logic for slice provisioning', lines: 142 },
        { path: 'src/slices/slice.repository.ts', type: 'service', description: 'Prisma-backed data access layer', lines: 68 },
        { path: 'src/slices/dto/create-slice.dto.ts', type: 'model', description: 'Validated DTO for slice creation', lines: 28 },
        { path: 'src/slices/dto/update-slice.dto.ts', type: 'model', description: 'Partial DTO for slice modification', lines: 18 },
        { path: 'src/auth/auth.guard.ts', type: 'service', description: 'JWT auth guard with tenant extraction', lines: 45 },
        { path: 'src/events/event-bus.service.ts', type: 'service', description: 'Kafka event producer and consumer', lines: 96 },
        { path: 'prisma/schema.prisma', type: 'config', description: 'Prisma schema with Slice, Tenant, SLA models', lines: 72 },
        { path: 'test/slices/slice.service.spec.ts', type: 'test', description: 'Unit tests for slice service', lines: 115 },
        { path: 'test/slices/slice.controller.spec.ts', type: 'test', description: 'Controller integration tests', lines: 88 }
      ],
      tech_stack: {
        runtime: 'Node.js 20 LTS',
        framework: 'NestJS 10',
        orm: 'Prisma 5',
        queue: 'Bull MQ + Kafka',
        cache: 'Redis 7'
      },
      total_files: 12,
      total_lines: 814
    },
    code_snippets: [
      {
        file: 'src/slices/slice.service.ts',
        language: 'typescript',
        description: 'Core slice provisioning service with quota enforcement and event publishing',
        code: `import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { SliceRepository } from './slice.repository';
import { EventBusService } from '../events/event-bus.service';
import { CreateSliceDto } from './dto/create-slice.dto';

@Injectable()
export class SliceService {
  constructor(
    private readonly repo: SliceRepository,
    private readonly eventBus: EventBusService,
  ) {}

  async create(dto: CreateSliceDto, tenantId: string) {
    const quota = await this.repo.getTenantQuota(tenantId);
    const active = await this.repo.countActiveSlices(tenantId);

    if (active >= quota.maxSlices) {
      throw new HttpException(
        { code: 'QUOTA_EXCEEDED', current: active, max: quota.maxSlices },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const slice = await this.repo.create({
      ...dto,
      tenantId,
      status: 'provisioning',
    });

    await this.eventBus.publish('slice.created', {
      sliceId: slice.id,
      tenantId,
      templateId: dto.templateId,
    });

    return slice;
  }
}`
      },
      {
        file: 'src/slices/slice.controller.ts',
        language: 'typescript',
        description: 'REST controller with auth guard and validation pipes',
        code: `import { Controller, Post, Get, Param, Body, UseGuards, Req } from '@nestjs/common';
import { SliceService } from './slice.service';
import { CreateSliceDto } from './dto/create-slice.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('api/v1/slices')
@UseGuards(AuthGuard)
export class SliceController {
  constructor(private readonly sliceService: SliceService) {}

  @Post()
  async create(@Body() dto: CreateSliceDto, @Req() req: any) {
    const tenantId = req.user.tenantId;
    return this.sliceService.create(dto, tenantId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.sliceService.findOneForTenant(id, req.user.tenantId);
  }
}`
      },
      {
        file: 'src/events/event-bus.service.ts',
        language: 'typescript',
        description: 'Kafka event producer with schema validation',
        code: `import { Injectable, OnModuleInit } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class EventBusService implements OnModuleInit {
  private producer: Producer;

  async onModuleInit() {
    const kafka = new Kafka({
      clientId: 'slice-platform',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
    });
    this.producer = kafka.producer();
    await this.producer.connect();
  }

  async publish(topic: string, payload: Record<string, unknown>) {
    await this.producer.send({
      topic,
      messages: [{
        key: String(payload.tenantId || 'global'),
        value: JSON.stringify({
          ...payload,
          timestamp: new Date().toISOString(),
          version: '1.0',
        }),
      }],
    });
  }
}`
      },
      {
        file: 'prisma/schema.prisma',
        language: 'typescript',
        description: 'Prisma schema defining core data models',
        code: `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Slice {
  id          String   @id @default(uuid())
  name        String
  templateId  String   @map("template_id")
  tenantId    String   @map("tenant_id")
  status      String   @default("provisioning")
  slaProfile  String   @default("bronze") @map("sla_profile")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  @@map("slices")
}

model Tenant {
  id        String  @id @default(uuid())
  name      String
  maxSlices Int     @default(10) @map("max_slices")
  slices    Slice[]
  @@map("tenants")
}`
      }
    ],
    unit_tests: [
      {
        file: 'test/slices/slice.service.spec.ts',
        framework: 'Jest',
        test_count: 8,
        code: `import { Test } from '@nestjs/testing';
import { SliceService } from '../../src/slices/slice.service';
import { SliceRepository } from '../../src/slices/slice.repository';
import { EventBusService } from '../../src/events/event-bus.service';
import { HttpException } from '@nestjs/common';

describe('SliceService', () => {
  let service: SliceService;
  let repo: jest.Mocked<SliceRepository>;
  let eventBus: jest.Mocked<EventBusService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        SliceService,
        { provide: SliceRepository, useValue: { create: jest.fn(), getTenantQuota: jest.fn(), countActiveSlices: jest.fn() } },
        { provide: EventBusService, useValue: { publish: jest.fn() } },
      ],
    }).compile();
    service = module.get(SliceService);
    repo = module.get(SliceRepository);
    eventBus = module.get(EventBusService);
  });

  it('should create a slice and publish event', async () => {
    repo.getTenantQuota.mockResolvedValue({ maxSlices: 10 });
    repo.countActiveSlices.mockResolvedValue(3);
    repo.create.mockResolvedValue({ id: 'slice-1', status: 'provisioning' });

    const result = await service.create(
      { templateId: 'tmpl-embb', name: 'test-slice', slaProfile: 'gold' },
      'tenant-001'
    );
    expect(result.status).toBe('provisioning');
    expect(eventBus.publish).toHaveBeenCalledWith('slice.created', expect.objectContaining({ sliceId: 'slice-1' }));
  });

  it('should reject when quota exceeded', async () => {
    repo.getTenantQuota.mockResolvedValue({ maxSlices: 5 });
    repo.countActiveSlices.mockResolvedValue(5);

    await expect(service.create(
      { templateId: 'tmpl-embb', name: 'over-quota', slaProfile: 'bronze' },
      'tenant-001'
    )).rejects.toThrow(HttpException);
  });
});`
      },
      {
        file: 'test/slices/slice.controller.spec.ts',
        framework: 'Jest',
        test_count: 5,
        code: `import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { SliceController } from '../../src/slices/slice.controller';
import { SliceService } from '../../src/slices/slice.service';

describe('SliceController (e2e)', () => {
  let app: INestApplication;
  let sliceService: jest.Mocked<SliceService>;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [SliceController],
      providers: [{ provide: SliceService, useValue: { create: jest.fn(), findOneForTenant: jest.fn() } }],
    }).compile();
    app = module.createNestApplication();
    await app.init();
    sliceService = module.get(SliceService);
  });

  it('POST /api/v1/slices - creates slice', async () => {
    sliceService.create.mockResolvedValue({ id: 'new-slice', status: 'provisioning' });
    const res = await request(app.getHttpServer())
      .post('/api/v1/slices')
      .send({ templateId: 'tmpl-embb', name: 'e2e-test' })
      .expect(201);
    expect(res.body.id).toBe('new-slice');
  });

  afterAll(() => app.close());
});`
      }
    ],
    pr_summary: {
      title: 'feat(slices): implement network slice provisioning service with tenant isolation',
      description:
        'Adds core slice provisioning module with NestJS controller, service, and repository layers. Includes Prisma schema for Slice/Tenant models, Kafka event publishing for lifecycle events, JWT auth guard with tenant extraction, and quota enforcement. Covers 13 unit/integration tests with 87% coverage.',
      files_changed: 12,
      additions: 814,
      deletions: 0,
      reviewers: ['@platform-arch', '@security-team', '@qa-lead'],
      labels: ['feature', 'slice-provisioning', 'needs-review', 'includes-tests']
    },
    static_analysis: {
      tool: 'SonarQube',
      quality_gate: 'Passed',
      metrics: {
        bugs: 0,
        vulnerabilities: 0,
        code_smells: 4,
        coverage: '87.3%',
        duplications: '2.1%',
        complexity: 18
      },
      issues: [
        {
          severity: 'Minor',
          rule: 'typescript:S1874',
          file: 'src/events/event-bus.service.ts',
          message: 'Consider using a config service instead of direct process.env access'
        },
        {
          severity: 'Info',
          rule: 'typescript:S1135',
          file: 'src/slices/slice.service.ts',
          message: 'Add JSDoc for public method create()'
        },
        {
          severity: 'Minor',
          rule: 'typescript:S3776',
          file: 'src/slices/slice.repository.ts',
          message: 'Cognitive complexity of findWithFilters() is 12 (threshold: 10)'
        },
        {
          severity: 'Major',
          rule: 'typescript:S4144',
          file: 'src/auth/auth.guard.ts',
          message: 'Extract duplicate JWT decode logic into shared utility'
        }
      ]
    }
  };
}
