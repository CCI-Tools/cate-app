/**
 * Schema for "./resources/ecv-meta.json"
 */
export interface EcvMeta {
    ecvs: { [ecvId: string]: EcvMetaItem },
    colors: { [colorId: string]: string };
    mappings: { [ecvId: string]: string };
}

/**
 * Schema for ECV metadata
 */
export interface EcvMetaItem {
    group: string; // "atmosphere" | "terrestrial" | "ocean";
    color: string;
    label: string;
}

