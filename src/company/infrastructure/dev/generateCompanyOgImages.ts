import './loadLocalEnv';
import { runGenerateCompanyOgImages } from './runGenerateCompanyOgImages';

const parseArgs = (argv: string[]) => {
    let siteOnly = false;
    const companyIds: string[] = [];
    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        if (arg === '--stage') {
            index += 1;
            continue;
        }
        if (arg === '--site') {
            siteOnly = true;
            continue;
        }
        companyIds.push(arg);
    }

    return { siteOnly, companyIds };
};

const { siteOnly, companyIds } = parseArgs(process.argv.slice(2));

runGenerateCompanyOgImages({ siteOnly, companyIds });
