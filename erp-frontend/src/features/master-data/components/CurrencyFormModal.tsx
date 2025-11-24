import React, { useState } from "react";
import { Button } from "../../../components/ui/Button";
import { Label } from "../../../components/ui/Label";

interface CurrencyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (code: string) => void;
  realCurrencies: { code: string; name: string; symbol: string }[];
}

export function CurrencyFormModal({ isOpen, onClose, onAdd, realCurrencies }: CurrencyFormModalProps) {
  const [selectedCode, setSelectedCode] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Add New Currency</h2>

        <Label>Select Currency</Label>
        <select
          className="w-full mt-2 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-orange-500"
          value={selectedCode}
          onChange={(e) => setSelectedCode(e.target.value)}
        >
          <option value="">-- Select a currency --</option>
          {realCurrencies.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name} ({c.code}) {c.symbol}
            </option>
          ))}
        </select>

        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => {
              if (selectedCode) onAdd(selectedCode);
            }}
            disabled={!selectedCode}
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
