
import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';

interface SearchSelectionModalProps<T> {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    items: T[];
    onSelect: (item: T) => void;
    /** Function to render each item in the list */
    renderItem: (item: T, isSelected?: boolean) => React.ReactNode;
    /** Keys of T to search against */
    searchKeys: (keyof T)[];
    /** Optional selected item to highlight */
    selectedItem?: T;
    /** Equality check for selection highlighting */
    isSelected?: (item: T) => boolean;
}

export function SearchSelectionModal<T>({
    isOpen,
    onClose,
    title,
    description,
    items,
    onSelect,
    renderItem,
    searchKeys,
    isSelected,
}: SearchSelectionModalProps<T>) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredItems = useMemo(() => {
        if (!searchTerm) return items;
        const lowerTerm = searchTerm.toLowerCase();
        return items.filter((item) => {
            return searchKeys.some((key) => {
                const value = item[key];
                return String(value).toLowerCase().includes(lowerTerm);
            });
        });
    }, [items, searchTerm, searchKeys]);

    const handleSelect = (item: T) => {
        onSelect(item);
        onClose();
        setSearchTerm(''); // Reset search on select
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>{title}</DialogTitle>
                    {description && <DialogDescription>{description}</DialogDescription>}
                    <div className="relative mt-4">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            placeholder="Search..."
                            className="w-full pl-9 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-2">
                    {filteredItems.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No results found for "{searchTerm}"
                        </div>
                    ) : (
                        <div className="grid gap-1">
                            {filteredItems.map((item, index) => {
                                const active = isSelected ? isSelected(item) : false;
                                return (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => handleSelect(item)}
                                        className={`text-left w-full rounded-md transition-colors ${active
                                                ? 'bg-orange-50 border-orange-200 ring-1 ring-orange-200'
                                                : 'hover:bg-gray-100'
                                            }`}
                                    >
                                        {renderItem(item, active)}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
