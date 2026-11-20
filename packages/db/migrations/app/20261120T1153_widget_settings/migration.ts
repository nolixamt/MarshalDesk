#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/180de13c94d2aa53f56b4eb11b59833919cb58313ae29716cb5d5c3a0c5d2d17/contract';
import startContract from '../../snapshots/180de13c94d2aa53f56b4eb11b59833919cb58313ae29716cb5d5c3a0c5d2d17/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/b8c4acd6924b82a35ab9b6c357f56e5afccd82a83e4aadfafb5654ec2f19b4a4/contract';
import endContract from '../../snapshots/b8c4acd6924b82a35ab9b6c357f56e5afccd82a83e4aadfafb5654ec2f19b4a4/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'workspaces',
        column: col('agent_avatar_key', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'workspaces',
        column: col('agent_name', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'workspaces',
        column: col('allowed_domains', 'text[]', {
          notNull: true,
          default: lit([]),
          codecRef: { codecId: 'pg/text@1', many: true },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'workspaces',
        column: col('color', 'text', {
          notNull: true,
          default: lit('blue'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'workspaces',
        column: col('greeting', 'text', {
          notNull: true,
          default: lit('Hi there! How can we help you today?'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'workspaces',
        column: col('position', 'text', {
          notNull: true,
          default: lit('bottom-right'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'workspaces',
        column: col('snippet_installed_at', 'timestamptz(3)', {
          codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
        }),
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'workspaces',
        constraint: 'workspaces_allowed_domains_elem_not_null_50f9fffb',
        expression: sql`array_position("allowed_domains", NULL) IS NULL`,
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'workspaces',
        constraint: 'workspaces_color_check_5299eb4e',
        expression: sql`"color" IN ('blue', 'indigo', 'violet', 'pink', 'red', 'orange', 'green')`,
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'workspaces',
        constraint: 'workspaces_position_check_1202051e',
        expression: sql`"position" IN ('bottom-right', 'bottom-left')`,
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
