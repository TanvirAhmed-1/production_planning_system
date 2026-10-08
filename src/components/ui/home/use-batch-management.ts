"use client";

import { useState } from "react";

interface DeleteModalState {
  isOpen: boolean;
  batchId: string;
  fileName: string;
  title?: string;
  description?: string;
}

export function useBatchManagement(
  onAfterDelete: (deletedBatchId: string) => Promise<void>
) {
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [deleteModalState, setDeleteModalState] = useState<DeleteModalState>({
    isOpen: false,
    batchId: "",
    fileName: "",
  });

  const promptDeleteBatch = (
    batchId: string,
    fileName: string,
    batchType?: string,
    childCount: number = 0,
    parentPlanName?: string
  ) => {
    let title = "Delete Import Batch";
    let description =
      "This action cannot be undone. All associated records will be permanently deleted.";

    if (batchType === "ACTUAL") {
      title = "Delete Actual Floor Data Batch";
      description = `This will delete actual production floor records from "${fileName}". The parent plan "${parentPlanName || "Plan"}" will remain intact, and its daily target metrics will reset to 0 actual output.`;
    } else {
      title = "Delete Production Plan (Parent)";
      if (childCount > 0) {
        description = `CRITICAL WARNING: This Production Plan "${fileName}" has ${childCount} attached Actual Production child batch(es). Deleting this plan will CASCADE DELETE all child actual records, daily outputs, and order logs.`;
      }
    }

    setDeleteModalState({
      isOpen: true,
      batchId,
      fileName,
      title,
      description,
    });
  };

  const confirmDeleteBatch = async () => {
    if (!deleteModalState.batchId) return;
    try {
      const res = await fetch(
        `/api/excel/history?id=${deleteModalState.batchId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        await onAfterDelete(deleteModalState.batchId);
      }
    } catch (err) {}
  };

  return {
    isImportModalOpen,
    setIsImportModalOpen,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    deleteModalState,
    setDeleteModalState,
    promptDeleteBatch,
    confirmDeleteBatch,
  };
}
