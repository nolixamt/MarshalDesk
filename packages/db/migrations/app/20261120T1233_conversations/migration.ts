#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/b8c4acd6924b82a35ab9b6c357f56e5afccd82a83e4aadfafb5654ec2f19b4a4/contract';
import startContract from '../../snapshots/b8c4acd6924b82a35ab9b6c357f56e5afccd82a83e4aadfafb5654ec2f19b4a4/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/cc46b23b9b17ee5bd153023bca25ea17e16b3a0b071ad275a1cafbd5dd3e778e/contract';
import endContract from '../../snapshots/cc46b23b9b17ee5bd153023bca25ea17e16b3a0b071ad275a1cafbd5dd3e778e/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
  sql,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'conversations',
        columns: [
          col('closed_at', 'timestamptz(3)', {
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('created_at', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('handoff_reason', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('last_message_at', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('last_message_preview', 'text', {
            notNull: true,
            default: lit(''),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('state', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('unread', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('visitor_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('workspace_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'conversations_handoff_reason_check_ae20b9e1',
            sql`"handoff_reason" IN ('low_confidence', 'no_relevant_knowledge', 'visitor_requested', 'agent_off')`,
          ),
          checkExpression(
            'conversations_state_check_c0b30865',
            sql`"state" IN ('ai', 'waiting', 'human', 'closed')`,
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'messages',
        columns: [
          col('author', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('body', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('conversation_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('created_at', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('member_id', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('member_image_url', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('member_name', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('system_notice', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('workspace_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'messages_author_check_8d9bb6ef',
            sql`"author" IN ('visitor', 'agent', 'member', 'system')`,
          ),
          checkExpression(
            'messages_system_notice_check_e8c18c5d',
            sql`"system_notice" IN ('greeting', 'agent_off', 'hand_back', 'closed')`,
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'visitors',
        columns: [
          col('browser', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('city', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('country', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('device', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('first_seen_at', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('language', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('last_seen_at', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('os', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('page', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('referrer', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('timezone', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('visit_count', 'int4', {
            notNull: true,
            default: lit(1),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('vsk_hash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('workspace_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createIndex({
        schema: 'public',
        table: 'conversations',
        index: 'conversations_one_open_per_visitor_28da2cb9',
        columns: ['visitor_id'],
        extras: { where: sql`state IN ('ai', 'waiting', 'human')`, unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'conversations',
        index: 'conversations_visitor_id_idx_f711bdfd',
        columns: ['visitor_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'conversations',
        index: 'conversations_workspace_id_idx_90a9f461',
        columns: ['workspace_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'conversations',
        index: 'conversations_workspace_id_last_message_at_idx_a80869f0',
        columns: ['workspace_id', 'last_message_at'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'messages',
        index: 'messages_conversation_id_created_at_idx_13048a6f',
        columns: ['conversation_id', 'created_at'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'messages',
        index: 'messages_conversation_id_idx_0c3639df',
        columns: ['conversation_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'messages',
        index: 'messages_workspace_id_idx_90a9f461',
        columns: ['workspace_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'visitors',
        index: 'visitors_workspace_id_idx_90a9f461',
        columns: ['workspace_id'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'conversations',
        foreignKey: {
          name: 'conversations_workspace_id_fkey',
          columns: ['workspace_id'],
          references: { schema: 'public', table: 'workspaces', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'conversations',
        foreignKey: {
          name: 'conversations_visitor_id_fkey',
          columns: ['visitor_id'],
          references: { schema: 'public', table: 'visitors', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'messages',
        foreignKey: {
          name: 'messages_workspace_id_fkey',
          columns: ['workspace_id'],
          references: { schema: 'public', table: 'workspaces', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'messages',
        foreignKey: {
          name: 'messages_conversation_id_fkey',
          columns: ['conversation_id'],
          references: { schema: 'public', table: 'conversations', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'visitors',
        foreignKey: {
          name: 'visitors_workspace_id_fkey',
          columns: ['workspace_id'],
          references: { schema: 'public', table: 'workspaces', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
