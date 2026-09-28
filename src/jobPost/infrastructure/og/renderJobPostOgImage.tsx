import React from 'react';
import { JobPostOgCard } from './layouts';
import { OgCardModel } from './ogShared';
import { renderSatoriPng } from './renderSatoriPng';

export const renderJobPostOgImage = (card: OgCardModel): Promise<Buffer> =>
    renderSatoriPng(<JobPostOgCard {...card} />);
