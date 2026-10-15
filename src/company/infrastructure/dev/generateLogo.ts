import { loadLocalAwsEnv } from 'shared/infrastructure/env/loadLocalAwsEnv';
import { CompanyId } from 'company/domain/company';
import { generateCompanyLogo } from 'company/application/generateCompanyLogo';
import { getPendingCompanies } from 'company/application/getPendingCompanies';

loadLocalAwsEnv();

const parseCompanyId = (): CompanyId | undefined => {
    const eqArg = process.argv.find((arg) => arg.startsWith('--companyId='));
    if (eqArg) return eqArg.slice('--companyId='.length) as CompanyId;
    const flagIndex = process.argv.indexOf('--companyId');
    if (flagIndex !== -1 && process.argv[flagIndex + 1]) {
        return process.argv[flagIndex + 1] as CompanyId;
    }

    return undefined;
};

const run = async (): Promise<void> => {
    const companyId = parseCompanyId();
    const ids = companyId
        ? [companyId]
        : (await getPendingCompanies()).map((company) => company.id);

    if (ids.length === 0) {
        console.log('No pending companies');
        return;
    }

    let failed = 0;
    for (const id of ids) {
        try {
            console.log(`Generating logo for ${id}...`);
            await generateCompanyLogo({ companyId: id });
            console.log(`Wrote .local/pending/${id}/logo.png`);
        } catch (error) {
            failed += 1;
            const message =
                error instanceof Error ? error.message : String(error);
            console.error(`Failed ${id}: ${message}`);
        }
    }

    if (failed) process.exitCode = 1;
};

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
