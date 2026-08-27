'use client';

import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  className = '',
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers array with ellipsis if needed
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className={`pagination-container ${className}`}>
      <style jsx>{`
        .pagination-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: #FFFFFF;
          border-top: 1px solid rgba(44, 94, 67, 0.08);
          border-bottom-left-radius: 16px;
          border-bottom-right-radius: 16px;
          flex-wrap: wrap;
          gap: 12px;
          font-family: var(--font-sans, system-ui, -apple-system, sans-serif);
        }

        .pagination-info {
          font-size: 13px;
          color: #64748B;
          font-weight: 500;
        }
        .pagination-info strong {
          color: #0F172A;
          font-weight: 700;
        }

        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .pg-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 34px;
          height: 34px;
          padding: 0 8px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          border: 1px solid rgba(44, 94, 67, 0.12);
          background: #FFFFFF;
          color: #334155;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .pg-btn:hover:not(:disabled):not(.active) {
          background: #F1F5F9;
          border-color: #CBD5E1;
          color: #0F172A;
        }

        .pg-btn.active {
          background: #2C5E43;
          color: #FFFFFF;
          border-color: #2C5E43;
          box-shadow: 0 2px 6px rgba(44, 94, 67, 0.25);
        }

        .pg-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          background: #F8FAFC;
        }

        .pg-ellipsis {
          padding: 0 4px;
          color: #94A3B8;
          font-size: 13px;
        }

        @media (max-width: 640px) {
          .pagination-container {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
        }
      `}</style>

      <div className="pagination-info">
        Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of <strong>{totalItems}</strong> entries
      </div>

      <div className="pagination-controls">
        <button
          type="button"
          className="pg-btn"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous Page"
        >
          ‹
        </button>

        {getPageNumbers().map((p, idx) =>
          p === '...' ? (
            <span key={`ellipsis-${idx}`} className="pg-ellipsis">
              ...
            </span>
          ) : (
            <button
              key={`page-${p}`}
              type="button"
              className={`pg-btn ${currentPage === p ? 'active' : ''}`}
              onClick={() => onPageChange(p as number)}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          className="pg-btn"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next Page"
        >
          ›
        </button>
      </div>
    </div>
  );
}
