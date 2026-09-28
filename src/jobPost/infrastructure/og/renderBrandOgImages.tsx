import React from 'react';
import { CompanyOgCard, SiteOgCard } from './brandCards';
import { renderSatoriPng } from './renderSatoriPng';

export const renderCompanyOgImage = ({
    companyName,
    logo,
    mark,
    wordmark,
}: {
    companyName: string;
    logo: Buffer | null;
    mark: Buffer;
    wordmark: Buffer;
}): Promise<Buffer> =>
    renderSatoriPng(
        <CompanyOgCard
            companyName={companyName}
            logo={logo}
            mark={mark}
            wordmark={wordmark}
        />,
    );

export const renderSiteOgImage = ({
    mark,
    wordmark,
}: {
    mark: Buffer;
    wordmark: Buffer;
}): Promise<Buffer> =>
    renderSatoriPng(<SiteOgCard mark={mark} wordmark={wordmark} />);
