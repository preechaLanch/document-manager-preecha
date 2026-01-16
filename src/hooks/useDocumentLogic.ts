import { useState, useMemo } from "react";
import type { IDocument } from "../types";

export const useDocumentLogic = (documents: IDocument[]) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const matchesStatus =
        statusFilter === "All" || doc.current_status === statusFilter;
      const matchesSearch =
        doc.document_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [documents, statusFilter, searchTerm]);

  const stats = useMemo(
    () => ({
      total: documents.length,
      pending: documents.filter(
        (d) => !["Completed", "Rejected", "Paid"].includes(d.current_status)
      ).length,
      completed: documents.filter((d) => d.current_status === "Completed")
        .length,
      rejected: documents.filter((d) => d.current_status === "Rejected").length,
    }),
    [documents]
  );

  const totalPages = Math.ceil(filteredDocs.length / itemsPerPage);
  const paginatedDocs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDocs.slice(start, start + itemsPerPage);
  }, [filteredDocs, currentPage]);

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    currentPage,
    setCurrentPage,
    filteredDocs,
    stats,
    totalPages,
    paginatedDocs,
  };
};
