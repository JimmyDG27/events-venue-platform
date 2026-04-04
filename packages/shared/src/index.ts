// Shared types and utilities — populated in Phase 0.2+

export type RequestStatus = 'Active' | 'Completed' | 'Rejected' | 'Cancelled';
export type ViewingStatus = 'Scheduled' | 'Completed' | 'Cancelled';

export type { Database, Tables, TablesInsert, TablesUpdate, Enums, Json } from './database.types';
