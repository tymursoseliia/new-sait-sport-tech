'use server';

import { createAdminClient } from '@/utils/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function deleteCar(id: number | string) {
    const supabase = createAdminClient();

    const { error } = await supabase.from('cars').delete().eq('id', id);

    if (error) {
        console.error('Delete error:', error);
        throw new Error('Не удалось удалить автомобиль: ' + error.message);
    }

    revalidatePath('/catalog');
    revalidatePath('/admin/cars');
    revalidatePath('/');
}

export async function updateCar(id: number | string, carData: any) {
    const supabase = createAdminClient();

    const { error } = await supabase
        .from('cars')
        .update(carData)
        .eq('id', id);

    if (error) {
        console.error('Update error:', error);
        throw new Error('Не удалось обновить автомобиль: ' + error.message);
    }

    revalidatePath('/catalog');
    revalidatePath('/admin/cars');
    revalidatePath('/');
}

export async function revalidateAll() {
    revalidatePath('/catalog');
    revalidatePath('/admin/cars');
    revalidatePath('/');
}
