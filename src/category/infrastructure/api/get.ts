import { getCategories } from 'category/application/getCategories';
import { success } from 'shared/infrastructure/api/response';

export const categoryGet = async () => {
    const categories = getCategories();

    return success(categories);
};
