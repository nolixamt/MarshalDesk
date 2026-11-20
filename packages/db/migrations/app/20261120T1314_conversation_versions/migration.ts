#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/588464ad75f7a2e51caa399e28a3dfc37006c44f05eed7895cb188933f828618/contract';
import endContract from '../../snapshots/588464ad75f7a2e51caa399e28a3dfc37006c44f05eed7895cb188933f828618/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/cc46b23b9b17ee5bd153023bca25ea17e16b3a0b071ad275a1cafbd5dd3e778e/contract';
import startContract from '../../snapshots/cc46b23b9b17ee5bd153023bca25ea17e16b3a0b071ad275a1cafbd5dd3e778e/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'conversations',
        column: col('updated_at', 'timestamptz(3)', {
          notNull: true,
          default: fn(sql`now()`),
          codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
