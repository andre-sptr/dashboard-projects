# PHASE 3 ARCHITECTURE: Technical Specifications

## Table of Contents
1. [Google Sheets Integration](#1-google-sheets-integration)
2. [WebSocket Real-time Updates](#2-websocket-real-time-updates)
3. [Advanced Analytics](#3-advanced-analytics)
4. [Notification System](#4-notification-system)
5. [Document Management](#5-document-management)
6. [Audit Logging](#6-audit-logging)
7. [Performance Optimization](#7-performance-optimization)

---

## 1. Google Sheets Integration

### 1.1 Architecture Overview

```
┌─────────────────┐
│  Google Sheets  │
│   (Data Source) │
└────────┬────────┘
         │
         │ Google Sheets API
         │
┌────────▼────────┐
│  Sync Service   │
│  (Node-cron)    │
└────────┬────────┘
         │
         ├─── Validate Data
         ├─── Transform Data
         ├─── Conflict Resolution
         │
┌────────▼────────┐
│   Repositories  │
│  (OLT/ODC/JPP)  │
└────────┬────────┘
         │
┌────────▼────────┐
│    Database     │
│    (SQLite)     │
└─────────────────┘
```

### 1.2 Google Sheets API Setup

```typescript
// src/lib/google-sheets.ts
import { google } from 'googleapis';

interface GoogleSheetsConfig {
  spreadsheetId: string;
  credentials: {
    client_email: string;
    private_key: string;
  };
}

export class GoogleSheetsClient {
  private sheets;
  private auth;

  constructor(config: GoogleSheetsConfig) {
    this.auth = new google.auth.JWT(
      config.credentials.client_email,
      undefined,
      config.credentials.private_key,
      ['https://www.googleapis.com/auth/spreadsheets.readonly']
    );

    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
  }

  async getSheetData(sheetName: string, range: string) {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `${sheetName}!${range}`,
    });

    return response.data.values;
  }

  async batchGetSheetData(ranges: string[]) {
    const response = await this.sheets.spreadsheets.values.batchGet({
      spreadsheetId: this.spreadsheetId,
      ranges,
    });

    return response.data.valueRanges;
  }
}
```

### 1.3 Sync Scheduler

```typescript
// src/lib/sync-scheduler.ts
import cron from 'node-cron';
import { GoogleSheetsClient } from './google-sheets';
import { syncJPPData, syncOLTData, syncODCData } from './sync-handlers';

export class SyncScheduler {
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  scheduleSync(interval: string = '0 * * * *') { // Every hour
    const job = cron.schedule(interval, async () => {
      console.log('Starting scheduled sync...');
      await this.runSync();
    });

    this.jobs.set('main-sync', job);
    return job;
  }

  async runSync() {
    const startTime = Date.now();
    const results = {
      jpp: { success: false, records: 0, errors: [] },
      olt: { success: false, records: 0, errors: [] },
      odc: { success: false, records: 0, errors: [] },
    };

    try {
      // Sync JPP data
      results.jpp = await syncJPPData();
      
      // Sync OLT data
      results.olt = await syncOLTData();
      
      // Sync ODC data
      results.odc = await syncODCData();

      // Log sync results
      await this.logSyncResults(results, Date.now() - startTime);
      
      return results;
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    }
  }

  stopSync(jobName: string = 'main-sync') {
    const job = this.jobs.get(jobName);
    if (job) {
      job.stop();
      this.jobs.delete(jobName);
    }
  }
}
```

### 1.4 Data Transformation

```typescript
// src/lib/sync-handlers.ts
import { GoogleSheetsClient } from './google-sheets';
import { OltRepository } from '@/repositories/OltRepository';

export async function syncOLTData() {
  const client = new GoogleSheetsClient({
    spreadsheetId: process.env.GOOGLE_SHEETS_ID!,
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL!,
      private_key: process.env.GOOGLE_PRIVATE_KEY!,
    },
  });

  // Get data from sheet
  const rows = await client.getSheetData('OLT', 'A2:Z1000');
  
  let created = 0;
  let updated = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const row of rows) {
    try {
      const oltData = transformOLTRow(row);
      
      // Check if exists
      const existing = OltRepository.findByIpAddress(oltData.ip_address);
      
      if (existing) {
        OltRepository.update(existing.id, oltData);
        updated++;
      } else {
        OltRepository.create(oltData);
        created++;
      }
    } catch (error) {
      failed++;
      errors.push(`Row ${rows.indexOf(row) + 2}: ${error.message}`);
    }
  }

  return {
    success: failed === 0,
    records: created + updated,
    created,
    updated,
    failed,
    errors,
  };
}

function transformOLTRow(row: any[]): any {
  return {
    ip_address: row[0],
    hostname: row[1],
    brand: row[2],
    model: row[3],
    // ... map other columns
  };
}
```

---

## 2. WebSocket Real-time Updates

### 2.1 Architecture Overview

```
┌─────────────┐         ┌─────────────┐
│  Client A   │◄────────┤             │
└─────────────┘         │             │
                        │  WebSocket  │
┌─────────────┐         │   Server    │
│  Client B   │◄────────┤  (Socket.IO)│
└─────────────┘         │             │
                        │             │
┌─────────────┐         │             │
│  Client C   │◄────────┤             │
└─────────────┘         └──────┬──────┘
                               │
                        ┌──────▼──────┐
                        │   Database  │
                        └─────────────┘
```

### 2.2 WebSocket Server Setup

```typescript
// src/lib/websocket.ts
import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

export class WebSocketServer {
  private io: SocketIOServer;

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL,
        methods: ['GET', 'POST'],
      },
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Join room based on user
      socket.on('join', (userId: string) => {
        socket.join(`user:${userId}`);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  // Emit events
  emitProjectUpdate(projectId: string, data: any) {
    this.io.emit('project.updated', { projectId, data });
  }

  emitOLTUpdate(oltId: string, data: any) {
    this.io.emit('olt.updated', { oltId, data });
  }

  emitNotification(userId: string, notification: any) {
    this.io.to(`user:${userId}`).emit('notification.new', notification);
  }

  emitSyncCompleted(results: any) {
    this.io.emit('sync.completed', results);
  }
}
```

### 2.3 Client Hook

```typescript
// src/hooks/useWebSocket.ts
'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useWebSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_WS_URL || '', {
      autoConnect: true,
    });

    socketInstance.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const subscribe = (event: string, callback: (data: any) => void) => {
    if (socket) {
      socket.on(event, callback);
    }
  };

  const unsubscribe = (event: string) => {
    if (socket) {
      socket.off(event);
    }
  };

  return { socket, isConnected, subscribe, unsubscribe };
}
```

---

## 3. Advanced Analytics

### 3.1 Analytics Engine

```typescript
// src/lib/analytics.ts

export class AnalyticsEngine {
  // Calculate KPIs
  static calculateKPIs(data: any[]) {
    return {
      totalProjects: data.length,
      activeProjects: data.filter(p => p.status === 'active').length,
      completedProjects: data.filter(p => p.status === 'completed').length,
      averageCompletion: this.calculateAverageCompletion(data),
      onTimeDeliveryRate: this.calculateOnTimeRate(data),
    };
  }

  // Trend analysis
  static analyzeTrends(data: any[], period: 'daily' | 'weekly' | 'monthly') {
    const grouped = this.groupByPeriod(data, period);
    return Object.entries(grouped).map(([date, items]) => ({
      date,
      count: items.length,
      value: items.reduce((sum, item) => sum + (item.value || 0), 0),
    }));
  }

  // Predictive analytics
  static predictCapacityExhaustion(currentUsage: number, maxCapacity: number, growthRate: number) {
    const remainingCapacity = maxCapacity - currentUsage;
    const monthsUntilFull = remainingCapacity / (currentUsage * growthRate);
    
    return {
      monthsRemaining: Math.round(monthsUntilFull),
      exhaustionDate: this.addMonths(new Date(), monthsUntilFull),
      recommendation: monthsUntilFull < 6 ? 'urgent' : monthsUntilFull < 12 ? 'plan' : 'monitor',
    };
  }

  // Distribution analysis
  static analyzeDistribution(data: any[], groupBy: string) {
    const grouped = data.reduce((acc, item) => {
      const key = item[groupBy] || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([name, value]) => ({
      name,
      value,
      percentage: (value / data.length) * 100,
    }));
  }

  // Performance scoring
  static calculatePerformanceScore(metrics: {
    onTimeRate: number;
    qualityScore: number;
    completionRate: number;
  }) {
    const weights = {
      onTimeRate: 0.4,
      qualityScore: 0.3,
      completionRate: 0.3,
    };

    return (
      metrics.onTimeRate * weights.onTimeRate +
      metrics.qualityScore * weights.qualityScore +
      metrics.completionRate * weights.completionRate
    );
  }
}
```

### 3.2 Chart Components

```typescript
// src/components/features/analytics/TrendChart.tsx
'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TrendChartProps {
  data: Array<{ date: string; value: number }>;
  title: string;
}

export function TrendChart({ data, title }: TrendChartProps) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

---

## 4. Notification System

### 4.1 Email Service

```typescript
// src/lib/email.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export class EmailService {
  static async sendTransactionalEmail(to: string, template: string, data: any) {
    const msg = {
      to,
      from: process.env.EMAIL_FROM!,
      templateId: template,
      dynamicTemplateData: data,
    };

    try {
      await sgMail.send(msg);
      return { success: true };
    } catch (error) {
      console.error('Email send failed:', error);
      return { success: false, error };
    }
  }

  static async sendDigestEmail(to: string, summary: any) {
    const html = this.generateDigestHTML(summary);
    
    const msg = {
      to,
      from: process.env.EMAIL_FROM!,
      subject: 'Daily Project Summary',
      html,
    };

    await sgMail.send(msg);
  }

  private static generateDigestHTML(summary: any): string {
    return `
      <html>
        <body>
          <h1>Daily Summary</h1>
          <p>Total Projects: ${summary.totalProjects}</p>
          <p>Completed Today: ${summary.completedToday}</p>
          <!-- More content -->
        </body>
      </html>
    `;
  }
}
```

### 4.2 Notification Rules Engine

```typescript
// src/lib/notification-rules.ts

export class NotificationRulesEngine {
  static async evaluateRules(event: any) {
    const rules = await this.getRules();
    
    for (const rule of rules) {
      if (this.matchesCondition(event, rule.condition)) {
        await this.triggerNotification(rule, event);
      }
    }
  }

  private static matchesCondition(event: any, condition: any): boolean {
    // Evaluate condition logic
    switch (condition.type) {
      case 'status_change':
        return event.type === 'project.updated' && 
               event.data.status !== event.data.previousStatus;
      
      case 'deadline_approaching':
        const daysUntil = this.getDaysUntilDeadline(event.data.deadline);
        return daysUntil <= condition.days;
      
      default:
        return false;
    }
  }

  private static async triggerNotification(rule: any, event: any) {
    // Create notification
    const notification = {
      userId: rule.userId,
      type: rule.notificationType,
      title: this.generateTitle(rule, event),
      message: this.generateMessage(rule, event),
      relatedEntityType: event.entityType,
      relatedEntityId: event.entityId,
    };

    // Save to database
    await NotificationRepository.create(notification);

    // Send via channels
    if (rule.channels.includes('email')) {
      await EmailService.sendTransactionalEmail(
        rule.userEmail,
        'notification',
        notification
      );
    }

    if (rule.channels.includes('websocket')) {
      WebSocketServer.emitNotification(rule.userId, notification);
    }
  }
}
```

---

## 5. Document Management

### 5.1 File Storage

```typescript
// src/lib/file-storage.ts
import fs from 'fs/promises';
import path from 'path';

export class FileStorage {
  private uploadDir: string;

  constructor(uploadDir: string = './uploads') {
    this.uploadDir = uploadDir;
  }

  async saveFile(file: File, category: string): Promise<string> {
    const filename = `${Date.now()}-${file.name}`;
    const categoryDir = path.join(this.uploadDir, category);
    
    // Ensure directory exists
    await fs.mkdir(categoryDir, { recursive: true });
    
    const filepath = path.join(categoryDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    
    await fs.writeFile(filepath, buffer);
    
    return filepath;
  }

  async deleteFile(filepath: string): Promise<void> {
    await fs.unlink(filepath);
  }

  async getFile(filepath: string): Promise<Buffer> {
    return await fs.readFile(filepath);
  }
}
```

### 5.2 Version Control

```typescript
// src/repositories/DocumentRepository.ts

export class DocumentRepository {
  static createVersion(documentId: string, file: File) {
    const db = getDatabase();
    
    // Get current version
    const current = db.prepare(
      'SELECT version FROM documents WHERE id = ?'
    ).get(documentId) as any;
    
    const newVersion = (current?.version || 0) + 1;
    
    // Create new version
    const id = generateId();
    db.prepare(`
      INSERT INTO documents (
        id, project_uid, category, name, file_path,
        file_size, mime_type, version, parent_document_id,
        uploaded_by, upload_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      current.project_uid,
      current.category,
      file.name,
      filePath,
      file.size,
      file.type,
      newVersion,
      documentId,
      userId,
      new Date().toISOString()
    );
    
    return id;
  }

  static getVersionHistory(documentId: string) {
    const db = getDatabase();
    
    return db.prepare(`
      SELECT * FROM documents
      WHERE id = ? OR parent_document_id = ?
      ORDER BY version DESC
    `).all(documentId, documentId);
  }
}
```

---

## 6. Audit Logging

### 6.1 Audit Logger

```typescript
// src/lib/audit-logger.ts

export class AuditLogger {
  static async log(action: {
    userId: string;
    action: string;
    entityType: string;
    entityId: string;
    oldValue?: any;
    newValue?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const db = getDatabase();
    
    db.prepare(`
      INSERT INTO audit_logs (
        id, user_id, action, entity_type, entity_id,
        old_value, new_value, ip_address, user_agent, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      generateId(),
      action.userId,
      action.action,
      action.entityType,
      action.entityId,
      JSON.stringify(action.oldValue || {}),
      JSON.stringify(action.newValue || {}),
      action.ipAddress || '',
      action.userAgent || '',
      new Date().toISOString()
    );
  }

  static async getAuditTrail(entityType: string, entityId: string) {
    const db = getDatabase();
    
    return db.prepare(`
      SELECT * FROM audit_logs
      WHERE entity_type = ? AND entity_id = ?
      ORDER BY created_at DESC
    `).all(entityType, entityId);
  }
}
```

---

## 7. Performance Optimization

### 7.1 Caching Strategy

```typescript
// src/lib/cache.ts

class CacheManager {
  private cache: Map<string, { data: any; expiry: number }> = new Map();

  set(key: string, data: any, ttl: number = 3600) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl * 1000,
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  invalidate(pattern: string) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

export const cache = new CacheManager();
```

---

**Document Version**: 1.0  
**Created**: 2026-05-07  
**Status**: Technical Specification  
**Complexity**: Very High