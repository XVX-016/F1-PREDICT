const CIRCUIT_ALIASES: Record<string, string> = {
    albert_park: 'albert_park',
    shanghai: 'shanghai',
    suzuka: 'suzuka',
    bahrain_international: 'bahrain',
    jeddah_corniche: 'jeddah',
    miami: 'miami',
    imola: 'imola',
    circuit_de_monaco: 'monaco',
    de_barcelonacatalunya: 'catalunya',
    barcelonacatalunya: 'catalunya',
    gilles_villeneuve: 'montreal',
    red_bull_ring: 'spielberg',
    circuit_de_spafrancorchamps: 'spa',
    de_spafrancorchamps: 'spa',
    hungaroring: 'hungaroring',
    zandvoort: 'zandvoort',
    monza: 'monza',
    baku_city: 'baku',
    marina_bay: 'marina_bay',
    circuit_of_the_americas: 'cota',
    of_the_americas: 'cota',
    the_americas: 'cota',
    autdromo_hermanos_rodrguez: 'mexico_city',
    autodromo_hermanos_rodriguez: 'mexico_city',
    interlagos: 'interlagos',
    las_vegas_strip: 'las_vegas',
    lusail: 'lusail',
    yas_marina: 'yas_marina',
    abu_dhabi: 'yas_marina',
};

export const normalizeCircuitId = (circuitName: string): string => {
    const cleaned = circuitName
        .toLowerCase()
        .replace(/grand prix/g, '')
        .replace(/circuit/g, '')
        .replace(/autodrome|autodromo|international|street|raceway/g, '')
        .replace(/[^\w\s]/g, '')
        .trim()
        .replace(/\s+/g, '_');

    return CIRCUIT_ALIASES[cleaned] || cleaned;
};

