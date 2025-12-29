
import { ReactNode } from "react";

interface Props {
    title: string;
    description?: string;
    action?: ReactNode;
    breadcrumb?: { label: string; href?: string }[]; // Optional text breadcrumb if needed
}

export default function PageHeader({ title, description, action }: Props) {
    return (
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
                    {description && (
                        <p className="text-gray-600 text-sm mt-1">{description}</p>
                    )}
                </div>
                {action && <div>{action}</div>}
            </div>
        </div>
    );
}
