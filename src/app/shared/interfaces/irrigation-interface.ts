export interface IrrigationInterface {
  status: string;
  config: {
    Ef: number;
    Efc: number[];
    irrigationType: string;
    Kc: number;
    maxHeight: number;
    maxMoisture: number;
    minMoisture: number;
  },
  data: {
    adjustedKc: number;
    ETo: number;
    effectiveRain: number;
    finalIrrigation: number;
    totalIrrigation: number;
  }[]
}
