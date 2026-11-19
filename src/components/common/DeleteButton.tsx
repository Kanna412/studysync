"use client";
import { Trash2 } from "lucide-react";
import { deleteRecord } from "@/lib/actions/records";
export default function DeleteButton({ module, id }: { module: string; id: string }) {
  return (
    <button aria-label="Delete" className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded"
      onClick={async () => { if (confirm("Delete this record? This cannot be undone.")) await deleteRecord(module, id); }}>
      <Trash2 size={16} />
    </button>
  );
}
