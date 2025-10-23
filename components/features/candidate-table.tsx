'use client';

import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  ColumnOrderState,
  ColumnSizingState,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeftIcon, ChevronRightIcon, ArrowsUpDownIcon } from '@heroicons/react/24/outline';
import type { Candidate, CandidateAttribute } from '@/lib/types';

interface CandidateTableProps {
  data: Candidate[];
}

export function CandidateTable({ data }: CandidateTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});

  // Transform data to flat structure for table
  const tableData = useMemo(() => {
    return data.map((candidate) => {
      const flatData: Record<string, string> = {
        id: candidate.id,
        applied_date: candidate.created_at || '',
      };
      
      candidate.attributes.forEach((attr) => {
        flatData[attr.key] = attr.value || '';
      });
      
      return flatData;
    });
  }, [data]);

  // Extract all unique column keys from candidates
  const columnKeys = useMemo(() => {
    const keys = new Set<string>();
    data.forEach((candidate) => {
      candidate.attributes.forEach((attr) => {
        keys.add(attr.key);
      });
    });
    return Array.from(keys);
  }, [data]);

  // Define columns dynamically
  const columns = useMemo<ColumnDef<Record<string, string>>[]>(() => {
    const cols: ColumnDef<Record<string, string>>[] = columnKeys.map((key) => {
      // Find label from first candidate that has this attribute
      const sampleAttr = data
        .flatMap((c) => c.attributes)
        .find((attr) => attr.key === key);
      
      const label = sampleAttr?.label || key;

      return {
        id: key,
        accessorKey: key,
        header: ({ column }) => {
          return (
            <div className="flex items-center space-x-2">
              <span>{label}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                className="h-8 w-8 p-0"
              >
                <ArrowsUpDownIcon className="h-4 w-4" />
              </Button>
            </div>
          );
        },
        cell: ({ getValue }) => {
          const value = getValue() as string;
          // Handle LinkedIn links
          if (key === 'linkedin_link' && value) {
            return (
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                View Profile
              </a>
            );
          }
          return <div className="truncate">{value || '-'}</div>;
        },
        size: 150,
      };
    });

    // Add applied date column
    cols.push({
      id: 'applied_date',
      accessorKey: 'applied_date',
      header: ({ column }) => {
        return (
          <div className="flex items-center space-x-2">
            <span>Applied Date</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 w-8 p-0"
            >
              <ArrowsUpDownIcon className="h-4 w-4" />
            </Button>
          </div>
        );
      },
      cell: ({ getValue }) => {
        const value = getValue() as string;
        if (!value) return '-';
        return new Date(value).toLocaleDateString();
      },
      size: 120,
    });

    return cols;
  }, [columnKeys, data]);

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting,
      columnFilters,
      columnOrder,
      columnSizing,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    columnResizeMode: 'onChange',
    enableColumnResizing: true,
  });

  return (
    <div className="space-y-4">
      {/* Column Filters */}
      <div className="flex gap-2 flex-wrap">
        {table.getHeaderGroups()[0]?.headers.map((header) => {
          return (
            <div key={header.id} className="flex-1 min-w-[150px]">
              <Input
                placeholder={`Filter ${header.id}...`}
                value={(header.column.getFilterValue() as string) ?? ''}
                onChange={(e) => header.column.setFilterValue(e.target.value)}
                className="h-8"
              />
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{
                      width: header.getSize(),
                      position: 'relative',
                    }}
                    className="bg-gray-50"
                  >
                    {header.isPlaceholder ? null : (
                      <>
                        <div
                          {...{
                            onMouseDown: header.getResizeHandler(),
                            onTouchStart: header.getResizeHandler(),
                            className: `absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none ${
                              header.column.getIsResizing() ? 'bg-blue-500' : 'hover:bg-gray-300'
                            }`,
                            style: {
                              userSelect: 'none',
                            },
                          }}
                        />
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{
                        width: cell.column.getSize(),
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length
          )}{' '}
          of {table.getFilteredRowModel().rows.length} entries
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Previous
          </Button>
          <div className="text-sm text-gray-600">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
