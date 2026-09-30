// Egyedi rendelés (eladás) oldalak tartalma — márkánként külön fájlban.
import type { SaleFacts } from './salePage';
import { SALE_BMW } from './saleBMW';
import { SALE_MINI } from './saleMINI';
import { SALE_MB } from './saleMercedes';
import { SALE_AUDI } from './saleAudi';
export const SALE: Record<string, SaleFacts> = { ...SALE_BMW, ...SALE_MINI, ...SALE_MB, ...SALE_AUDI };
