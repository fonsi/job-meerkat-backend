import { generateAndStoreCompanyOgImage } from 'company/application/generateAndStoreCompanyOgImage';
import { generateAndStoreSiteOgImage } from 'company/application/generateAndStoreSiteOgImage';
import { Company, CompanyId } from 'company/domain/company';
import { companyRepository } from 'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository';
import { loadBrandAssets } from 'jobPost/infrastructure/og/loadBrandAssets';

const pool = async <T>(
    items: T[],
    size: number,
    worker: (item: T) => Promise<void>,
) => {
    let index = 0;
    const run = async () => {
        while (index < items.length) {
            const current = items[index];
            index += 1;
            await worker(current);
        }
    };
    const workers = Math.min(size, items.length);
    if (workers === 0) return;

    await Promise.all(Array.from({ length: workers }, () => run()));
};

export const runGenerateCompanyOgImages = async ({
    siteOnly,
    companyIds,
}: {
    siteOnly: boolean;
    companyIds: string[];
}) => {
    const brand = await loadBrandAssets();
    if (companyIds.length === 0) {
        await generateAndStoreSiteOgImage(brand);
        console.log('uploaded og.png');
    }
    if (siteOnly) return;

    const listed =
        companyIds.length > 0
            ? await Promise.all(
                  companyIds.map((companyId) =>
                      companyRepository.getById(companyId as CompanyId),
                  ),
              )
            : await companyRepository.getAll();
    const companies = listed.filter(
        (company): company is Company => company != null,
    );
    const missing = companyIds.filter(
        (companyId) => !companies.some((company) => company.id === companyId),
    );
    for (const companyId of missing) {
        console.error(`company not found: ${companyId}`);
    }

    let failed = 0;
    await pool(companies, 4, async (company) => {
        try {
            await generateAndStoreCompanyOgImage({ company, brand });
            console.log(`uploaded ${company.name}`);
        } catch (error) {
            failed += 1;
            const message = error instanceof Error ? error.message : 'failed';
            console.error(`failed ${company.name}: ${message}`);
        }
    });
    if (failed > 0) process.exitCode = 1;
    console.log(`done ${companies.length - failed}/${companies.length}`);
};
