import type {SharedTableColumn} from './shared-table.tsx';

/** Keeps column definitions type-safe while allowing each page to own its cells. */
export const defineColumns = <Row,>() =>
    <const Columns extends readonly SharedTableColumn<Row>[]>(columns: Columns): Columns => columns;
