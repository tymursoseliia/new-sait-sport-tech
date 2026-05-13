'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';
import { deleteCar } from './actions';

interface DeleteCarButtonProps {
    carId: string | number;
    carName: string;
}

export function DeleteCarButton({ carId, carName }: DeleteCarButtonProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!window.confirm(`Вы уверены, что хотите удалить ${carName}?`)) {
            return;
        }

        setIsDeleting(true);
        try {
            await deleteCar(carId);
        } catch (error) {
            console.error(error);
            alert('Ошибка при удалении автомобиля');
            setIsDeleting(false);
        }
    };

    return (
        <Button
            onClick={handleDelete}
            disabled={isDeleting}
            variant="ghost"
            size="icon"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            title="Удалить"
        >
            {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <Trash2 className="w-4 h-4" />
            )}
        </Button>
    );
}
