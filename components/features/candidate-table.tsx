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
  RowSelectionState,
} from '@tanstack/react-table';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  ArrowsUpDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import type { Candidate } from '@/lib/types';

interface EnhancedCandidateTableProps {
  data: Candidate[];
}

// Draggable Column Header Component
function DraggableColumnHeader({
  header,
  children,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  header: any;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: header.column.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <th
      ref={setNodeRef}
      style={{
        ...style,
        width: header.getSize(),
        position: header.column.id === 'select' || header.column.id === 'full_name' ? 'sticky' : 'relative',
        left: header.column.id === 'select' ? 0 : header.column.id === 'full_name' ? 50 : undefined,
        zIndex: header.column.id === 'select' ? 30 : header.column.id === 'full_name' ? 25 : isDragging ? 35 : 1,
        boxShadow: header.column.id === 'full_name' ? '2px 0 4px rgba(0,0,0,0.1)' : undefined,
      }}
      className={cn(
        "relative text-left px-6 py-4 text-xs font-bold text-neutral-100 bg-neutral-20 uppercase tracking-wide",
        (header.column.id === 'select' || header.column.id === 'full_name') && "bg-neutral-20",
        header.column.id === 'full_name' && "border-r border-neutral-40"
      )}
    >
      <div className="flex items-center gap-2">
        {/* Drag Handle */}
        {header.column.id !== 'select' && (
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-neutral-30 rounded"
          >
            <Bars3Icon className="w-4 h-4 text-neutral-60" />
          </button>
        )}
        
        {children}
      </div>

      {/* Resize Handle */}
      {header.column.getCanResize() && (
        <div
          onMouseDown={header.getResizeHandler()}
          onTouchStart={header.getResizeHandler()}
          className={cn(
            'absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none',
            'hover:bg-primary-main hover:w-1.5',
            header.column.getIsResizing() ? 'bg-primary-main w-1.5 opacity-100' : 'bg-transparent opacity-0 hover:opacity-100'
          )}
          style={{
            userSelect: 'none',
          }}
        />
      )}
    </th>
  );
}

export function EnhancedCandidateTable({ data }: EnhancedCandidateTableProps) {
  'use no memo'; // TanStack Table's useReactTable API returns functions that cannot be safely memoized
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState('');

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Transform data to flat structure for table
  const tableData = useMemo(() => {
    return data.map((candidate) => {
      // Format applied date nicely (e.g., "30 January 2001")
      let formattedDate = '';
      if (candidate.created_at) {
        try {
          const date = new Date(candidate.created_at);
          formattedDate = date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          });
        } catch {
          formattedDate = candidate.created_at;
        }
      } else {
        // Default to today's date if not provided
        formattedDate = new Date().toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      }

      const flatData: Record<string, string> = {
        id: candidate.id,
        applied_date: formattedDate,
        // Store raw date for sorting
        applied_date_raw: candidate.created_at || new Date().toISOString(),
        // Add user information if available
        ...(candidate.users && candidate.users.email ? {
          applicant_email: candidate.users.email,
          applicant_name: candidate.users.full_name
        } : {})
      };

      // Handle attributes - support both old array format and new object format
      if (Array.isArray(candidate.attributes)) {
        // Old format: array of {key, value} objects
        candidate.attributes.forEach((attr) => {
          flatData[attr.key] = attr.value || '';
        });
      } else if (candidate.attributes && typeof candidate.attributes === 'object') {
        // New format: direct object with key-value pairs
        Object.entries(candidate.attributes).forEach(([key, value]) => {
          flatData[key] = value || '';
        });
      }

      return flatData;
    });
  }, [data]);

  // Extract all unique column keys from candidates
  const columnKeys = useMemo(() => {
    const keys = new Set<string>();
    data.forEach((candidate) => {
      // Handle attributes - support both old array format and new object format
      if (Array.isArray(candidate.attributes)) {
        // Old format: array of {key, value} objects
        candidate.attributes.forEach((attr) => {
          keys.add(attr.key);
        });
      } else if (candidate.attributes && typeof candidate.attributes === 'object') {
        // New format: direct object with key-value pairs
        Object.keys(candidate.attributes).forEach((key) => {
          keys.add(key);
        });
      }
    });
    return Array.from(keys);
  }, [data]);

  // Define columns dynamically
  const columns = useMemo<ColumnDef<Record<string, string>>[]>(() => {
    const cols: ColumnDef<Record<string, string>>[] = [
      // Checkbox column
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllRowsSelected()}
            onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        size: 50,
        enableSorting: false,
        enableResizing: false,
      },
      ...columnKeys.map((key) => {
        // Find label from first candidate that has this attribute
        let label = key;

        // Support both old array format and new object format
        for (const candidate of data) {
          if (Array.isArray(candidate.attributes)) {
            // Old format: array of {key, label, value} objects
            const attr = candidate.attributes.find((attr) => attr.key === key);
            if (attr?.label) {
              label = attr.label;
              break;
            }
          } else if (candidate.attributes && typeof candidate.attributes === 'object') {
            // New format: direct object - convert key to label
            if (key in candidate.attributes) {
              label = key.split('_').map(word =>
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ');
              break;
            }
          }
        }
         
         // Add user information columns if available
         if (key === 'applicant_email' || key === 'applicant_name') {
           return {
             id: key,
             accessorKey: key,
             header: key === 'applicant_email' ? 'APPLICANT EMAIL' : 'APPLICANT NAME',
             cell: ({ getValue }: { getValue: () => unknown }) => {
               const value = getValue() as string;
               return <div className="truncate">{value || '-'}</div>;
             },
             size: 180,
             enableSorting: true,
             enableResizing: true,
           };
         }

        return {
          id: key,
          accessorKey: key,
          header: label.toUpperCase(),
          cell: ({ getValue }: { getValue: () => unknown }) => {
            const value = getValue() as string;
            // Handle LinkedIn links
            if (key === 'linkedin_link' && value) {
              return (
                <a
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-main hover:underline"
                >
                  {value}
                </a>
              );
            }
            // Handle profile photos - display as image
            if (key === 'photo_profile' && value) {
              return (
                <div className="flex items-center justify-center">
                  <img
                    src={value}
                    alt="Profile"
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const nextElement = target.nextSibling as HTMLElement;
                      if (nextElement) {
                        nextElement.style.display = 'block';
                      }
                    }}
                  />
                  <span className="hidden text-xs text-gray-500 ml-2">Failed to load</span>
                </div>
              );
            }
            return <div className="truncate">{value || '-'}</div>;
          },
          size: 180,
          enableSorting: true,
          enableResizing: true,
        };
      }),
      // Applied Date column
      {
        id: 'applied_date',
        accessorKey: 'applied_date',
        header: 'APPLIED DATE',
        cell: ({ getValue }: { getValue: () => unknown }) => {
          const value = getValue() as string;
          return (
            <div className="truncate">
              <span className="text-neutral-100">{value || '-'}</span>
            </div>
          );
        },
        size: 180,
        enableSorting: true,
        enableResizing: true,
        sortingFn: (rowA, rowB) => {
          // Sort by raw date value
          const dateA = new Date(rowA.original.applied_date_raw).getTime();
          const dateB = new Date(rowB.original.applied_date_raw).getTime();
          return dateA - dateB;
        },
      },
    ];

    return cols;
  }, [columnKeys, data]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting,
      columnFilters,
      columnOrder,
      columnSizing,
      rowSelection,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: setColumnSizing,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    columnResizeMode: 'onChange',
    enableColumnResizing: true,
    enableRowSelection: true,
    globalFilterFn: 'includesString',
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  // Handle column reordering via drag and drop
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = columnOrder.indexOf(active.id as string);
      const newIndex = columnOrder.indexOf(over.id as string);
      
      const newOrder = arrayMove(columnOrder, oldIndex, newIndex);
      setColumnOrder(newOrder);
    }
  }

  // Initialize column order
  if (columnOrder.length === 0) {
    const initialOrder = table.getAllLeafColumns().map((col) => col.id);
    setColumnOrder(initialOrder);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="w-full space-y-4">
        {/* Search and Controls */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <TextField
              type="text"
              placeholder="Search all columns..."
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              suffix={<MagnifyingGlassIcon className="w-5 h-5 text-primary-main" />}
            />
          </div>
          <div className="text-sm text-neutral-60">
            {table.getFilteredSelectedRowModel().rows.length} of{' '}
            {table.getFilteredRowModel().rows.length} row(s) selected
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg shadow-sm relative">
          <table className="w-full border-collapse relative">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b-2 border-neutral-40">
                  <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
                    {headerGroup.headers.map((header) => (
                      <DraggableColumnHeader key={header.id} header={header}>
                        {header.isPlaceholder ? null : (
                          <div
                            className={cn(
                              "flex items-center gap-1",
                              header.column.getCanSort() && "cursor-pointer select-none"
                            )}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getCanSort() && (
                              <span className="ml-1">
                                {header.column.getIsSorted() === 'asc' ? (
                                  <ChevronUpIcon className="w-4 h-4" />
                                ) : header.column.getIsSorted() === 'desc' ? (
                                  <ChevronDownIcon className="w-4 h-4" />
                                ) : (
                                  <ArrowsUpDownIcon className="w-4 h-4 text-neutral-50" />
                                )}
                              </span>
                            )}
                          </div>
                        )}
                      </DraggableColumnHeader>
                    ))}
                  </SortableContext>
                </tr>
              ))}
            </thead>
            <tbody className="bg-white">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-neutral-30 hover:bg-neutral-10 transition-colors bg-white"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        style={{
                          width: cell.column.getSize(),
                          position:
                            cell.column.id === 'select' || cell.column.id === 'full_name'
                              ? 'sticky'
                              : 'relative',
                          left:
                            cell.column.id === 'select'
                              ? 0
                              : cell.column.id === 'full_name'
                              ? 50
                              : undefined,
                          zIndex:
                            cell.column.id === 'select' ? 30 : cell.column.id === 'full_name' ? 25 : 1,
                          backgroundColor: 'white',
                          boxShadow:
                            cell.column.id === 'full_name' ? '2px 0 4px rgba(0,0,0,0.1)' : undefined,
                        }}
                        className={cn(
                          'px-6 py-4 text-sm text-neutral-100 font-normal',
                          cell.column.id === 'full_name' && 'border-r border-neutral-40'
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="h-24 text-center text-neutral-60">
                    No results found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-m-regular text-neutral-60">Rows per page:</span>
            <Select
              value={table.getState().pagination.pageSize.toString()}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map((pageSize) => (
                  <SelectItem key={pageSize} value={pageSize.toString()}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-m-regular text-neutral-60">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="h-10 w-10 p-0"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="h-10 w-10 p-0"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DndContext>
  );
}
