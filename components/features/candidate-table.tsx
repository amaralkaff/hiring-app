'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
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
  RowSelectionState,
  createColumnHelper,
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
  DocumentArrowDownIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import type { Candidate } from '@/lib/types';
import { toast } from 'sonner';

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
        width: `${header.getSize()}px`,
        position: header.column.id === 'select' || header.column.id === 'full_name' ? 'sticky' : 'relative',
        left: header.column.id === 'select' ? 0 : header.column.id === 'full_name' ? 50 : undefined,
        zIndex: header.column.id === 'select' ? 30 : header.column.id === 'full_name' ? 25 : isDragging ? 35 : 10,
        boxShadow: header.column.id === 'full_name' ? '2px 0 4px rgba(0,0,0,0.1)' : undefined,
        overflow: 'visible',
      }}
      className={cn(
        "relative text-left px-6 py-4 text-xs font-bold text-neutral-100 bg-neutral-20 uppercase tracking-wide border-r border-gray-200",
        (header.column.id === 'select' || header.column.id === 'full_name') && "bg-neutral-20"
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

          </th>
  );
}

export function EnhancedCandidateTable({ data }: EnhancedCandidateTableProps) {
  'use no memo'; // TanStack Table's useReactTable API returns functions that cannot be safely memoized
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // CSV export function
  const exportToCSV = (selectedRows: any[]) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    try {
      // Get all column headers from the table data
      const headers = Object.keys(selectedRows[0].original).filter(key =>
        key !== 'id' && !key.includes('_raw') // Exclude internal fields
      );

      // Create CSV content
      const csvContent = [
        headers.join(','), // Header row
        ...selectedRows.map(row =>
          headers.map(header => {
            let value = row.original[header];

            // Special handling for photo_profile field
            if (header === 'photo_profile') {
              if (value && value.startsWith('data:')) {
                // Replace base64 with informative placeholder
                value = '[Base64 image data - should upload to Supabase Storage]';
              } else if (!value || value === '') {
                value = '[No photo]';
              }
            }

            // Handle values that might contain commas or quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value || '';
          }).join(',')
        )
      ].join('\n');

      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `candidates_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return true;
    } catch (error) {
      console.error('Export failed:', error);
      return false;
    }
  };

  // Bulk action handlers
  const handleBulkAction = (action: string) => {
    const selectedRows = table.getSelectedRowModel().rows;
    if (selectedRows.length === 0) return;

    const selectedIds = selectedRows.map(row => row.original.id);
    const count = selectedRows.length;

    switch (action) {
      case 'export':
        // Export selected candidates to CSV
        const toastId = toast.loading(`Exporting ${count} candidate(s) to CSV...`);

        setTimeout(() => {
          const success = exportToCSV(selectedRows);
          if (success) {
            toast.success(`Successfully exported ${count} candidate(s) to CSV`, { id: toastId });
          } else {
            toast.error('Failed to export candidates', { id: toastId });
          }
        }, 1000); // Simulate processing time

        break;

      case 'approve':
        // Mark selected as approved
        const approveId = toast.loading(`Approving ${count} candidate(s)...`);

        setTimeout(() => {
          console.log('Approving candidates:', selectedIds);
          toast.success(`${count} candidate(s) marked as approved`, { id: approveId });
        }, 800);

        break;

      case 'reject':
        // Mark selected as rejected
        const rejectId = toast.loading(`Rejecting ${count} candidate(s)...`);

        setTimeout(() => {
          console.log('Rejecting candidates:', selectedIds);
          toast.success(`${count} candidate(s) marked as rejected`, { id: rejectId });
        }, 800);

        break;

      case 'email':
        // Send email to selected candidates
        const emailId = toast.loading(`Preparing emails for ${count} candidate(s)...`);

        setTimeout(() => {
          console.log('Emailing candidates:', selectedIds);
          toast.success(`Email sent to ${count} candidate(s)`, {
            id: emailId,
            description: 'All emails have been queued for delivery'
          });
        }, 1500);

        break;

      case 'interview':
        // Move to interview stage
        const interviewId = toast.loading(`Moving ${count} candidate(s) to interview stage...`);

        setTimeout(() => {
          console.log('Moving to interview:', selectedIds);
          toast.success(`${count} candidate(s) moved to interview stage`, {
            id: interviewId,
            description: 'Interview invitations have been sent'
          });
        }, 1200);

        break;

      default:
        break;
    }

    // Clear selection after successful action
    setTimeout(() => {
      setRowSelection({});
    }, 2000);
  };

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
          flatData[key] = (value as string) || '';
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

  // Define columns dynamically with proper typing
  const columnHelper = createColumnHelper<Record<string, string>>();
  const columns = useMemo<any[]>(() => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const cols: any[] = [ // eslint-disable-line @typescript-eslint/no-explicit-any
      // Checkbox column
      columnHelper.display({
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
      }),
      ...(columnKeys.map((key) => { // eslint-disable-line @typescript-eslint/no-explicit-any
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
           return columnHelper.accessor(key as keyof Record<string, string>, {
             header: key === 'applicant_email' ? 'APPLICANT EMAIL' : 'APPLICANT NAME',
             cell: ({ getValue }: { getValue: () => unknown }) => {
               const value = getValue() as string;
               return <div className="truncate">{value || '-'}</div>;
             },
             size: 180,
             enableSorting: true,
             enableResizing: true,
             meta: {
               isImportantColumn: key === 'applicant_name'
             }
           });
         }

        // Check if this column should have bolder dividers
        const isImportantColumn = key.toLowerCase().includes('name') || key.toLowerCase().includes('phone');

        return columnHelper.accessor(key as keyof Record<string, string>, {
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
              if (value.startsWith('data:')) {
                // Display base64 image but with warning
                return (
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      <Image
                        src={value}
                        alt="Profile"
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity border-2 border-orange-300"
                        onClick={() => setSelectedPhoto(value)}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const nextElement = target.nextSibling as HTMLElement;
                          if (nextElement) {
                            nextElement.style.display = 'block';
                          }
                        }}
                      />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full"></div>
                    </div>
                    <span className="text-xs text-orange-600 mt-1">Base64</span>
                  </div>
                );
              } else if (value.startsWith('http')) {
                // It's already a URL - display it
                return (
                  <div className="flex items-center justify-center">
                    <Image
                      src={value}
                      alt="Profile"
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setSelectedPhoto(value)}
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
              } else {
                // Unknown format or empty
                return <div className="text-xs text-gray-400">[No Photo]</div>;
              }
            }
            return <div className="truncate">{value || '-'}</div>;
          },
          size: 180,
          enableSorting: true,
          enableResizing: true,
          meta: {
            isImportantColumn
          }
        });
      }),
      // Applied Date column
      columnHelper.accessor('applied_date', {
        header: 'APPLIED DATE',
        cell: ({ getValue }) => {
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
      }),
    ];

    return cols;
  }, [columnKeys, data]); // eslint-disable-line react-hooks/exhaustive-deps

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting,
      columnFilters,
      columnOrder,
      rowSelection,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnOrderChange: setColumnOrder,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
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
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <TextField
              type="text"
              placeholder="Search all columns..."
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              suffix={<MagnifyingGlassIcon className="w-5 h-5 text-primary-main" />}
            />
          </div>

          {/* Selection info and bulk actions */}
          <div className="flex items-center gap-3">
            <div className="text-sm text-neutral-600 bg-neutral-10 px-3 py-2 rounded-md">
              <span className="font-medium">{table.getFilteredSelectedRowModel().rows.length}</span> of{' '}
              <span className="font-medium">{table.getFilteredRowModel().rows.length}</span> candidate(s) selected
            </div>

            {table.getFilteredSelectedRowModel().rows.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('email')}
                  className="h-10 w-10 p-0 flex items-center justify-center relative group"
                  title="Send Email"
                >
                  <EnvelopeIcon className="w-4 h-4" />
                  <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Send Email
                  </span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('interview')}
                  className="h-10 w-10 p-0 flex items-center justify-center relative group"
                  title="Schedule Interview"
                >
                  <UserGroupIcon className="w-4 h-4" />
                  <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Schedule Interview
                  </span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('approve')}
                  className="h-10 w-10 p-0 flex items-center justify-center relative group text-green-600 border-green-600 hover:bg-green-600 hover:text-white"
                  title="Approve Candidate"
                >
                  <CheckCircleIcon className="w-4 h-4" />
                  <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Approve Candidate
                  </span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('reject')}
                  className="h-10 w-10 p-0 flex items-center justify-center relative group text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                  title="Reject Candidate"
                >
                  <XCircleIcon className="w-4 h-4" />
                  <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Reject Candidate
                  </span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('export')}
                  className="h-10 w-10 p-0 flex items-center justify-center relative group"
                  title="Export to CSV"
                >
                  <DocumentArrowDownIcon className="w-4 h-4" />
                  <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Export to CSV
                  </span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg shadow-sm relative bg-white border border-gray-200" style={{ overflowY: 'visible' }}>
          <table className="w-full border-collapse relative" style={{ position: 'relative' }}>
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
                    className="border-b border-gray-200 hover:bg-neutral-10 transition-colors bg-white"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        style={{
                          width: `${cell.column.getSize()}px`,
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
                          'px-6 py-4 text-sm text-neutral-100 font-normal border-r border-gray-200'
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
        <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-200 rounded-b-lg">
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

        {/* Full-size photo modal */}
        {selectedPhoto && (
          <div
            className="fixed inset-0 bg-white/60 backdrop-blur-xs flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <div className="relative max-w-4xl max-h-full">
              <Image
                src={selectedPhoto}
                alt="Full size profile"
                width={800}
                height={800}
                className="max-w-full max-h-full object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                className="absolute top-4 right-4 bg-white text-gray-800 rounded-full p-2 hover:bg-gray-100 transition-colors"
                onClick={() => setSelectedPhoto(null)}
                aria-label="Close photo view"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </DndContext>
  );
}
