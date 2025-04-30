import * as React from 'react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

interface PaginationProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
  className,
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages && startPage > 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <li key={i}>
          <Button
            variant={currentPage === i ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'h-8 w-8 p-0',
              currentPage === i
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'text-gray-700'
            )}
            onClick={() => onPageChange(i)}
          >
            {i}
          </Button>
        </li>
      );
    }
    return pageNumbers;
  };

  if (totalPages <= 1) return null;

  return (
    <nav className={cn('flex justify-center', className)}>
      <ul className="inline-flex -space-x-px">
        <li>
          <Button
            variant="outline"
            size="sm"
            className="rounded-l-md"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
        </li>
        {renderPageNumbers()}
        <li>
          <Button
            variant="outline"
            size="sm"
            className="rounded-r-md"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Siguiente
          </Button>
        </li>
      </ul>
    </nav>
  );
}