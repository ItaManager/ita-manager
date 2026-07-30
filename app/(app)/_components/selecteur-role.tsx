"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SelecteurRole() {
  return (
    <Select defaultValue="DAR">
      <SelectTrigger className="w-64">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="DG">Direction Générale</SelectItem>
        <SelectItem value="DFC">Direction Financière et Comptable</SelectItem>
        <SelectItem value="DT">Direction Technique</SelectItem>
        <SelectItem value="DAR">Directrice Administrative et RH</SelectItem>
      </SelectContent>
    </Select>
  );
}
