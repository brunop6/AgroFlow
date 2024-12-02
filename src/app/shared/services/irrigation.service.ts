import { Injectable } from '@angular/core';
import { IrrigationInterface } from '../interfaces/irrigation-interface';

@Injectable({
  providedIn: 'root'
})

export class IrrigationService {
  private readonly MJ_TO_MM = 0.408; // Conversion factor from MJ/m²/day to mm/day
  public readonly efficiencies: { [key: string]: [number, number] } = {
    "Bacias em nível": [60, 80],
    "Sulcos": [60, 80],
    "Pulso (Surge flow)": [65, 80],
    "Faixas": [55, 75],
    "Sulcos corrugados": [40, 55],
    "Linear move": [75, 90],
    "Pivô central de baixa pressão": [75, 90],
    "Aspersão fixa": [70, 85],
    "Pivô central de alta pressão": [65, 80],
    "Aspersão portátil": [50, 75],
    "Alto propulsão": [60, 70],
    "Gotejamento superficial": [85, 95],
    "Gotejamento enterrado": [85, 95],
    "Microaspersão": [85, 90],
    "Chuva": [80, 90],
    "Chuva intensa": [50, 70],
  }

  public irrigationData: IrrigationInterface;

  constructor() {
    this.irrigationData = {
      status: 'empty',
      config: {
        Ef: 0,
        Efc: [0, 0, 0, 0, 0, 0, 0],
        irrigationType: '',
        Kc: 0,
        maxHeight: 0,
        maxMoisture: 0,
        minMoisture: 0,
      },
      data: [],
    }
    const savedConfig = localStorage.getItem('irrigationConfig');
    if (savedConfig) {
      this.irrigationData.config = JSON.parse(savedConfig);
      this.irrigationData.status = 'ready';
    }
  }

  /**
   * Calcula a evapotranspiração de referência (ETo) usando o método Hargreaves-Samani
   * @param Tmax Temperatura máxima diária (°C)
   * @param Tmin Temperatura mínima diária (°C)
   * @param Tmed Temperatura média diária (°C)
   * @param Ra Radiação extraterrestre (MJ/m²/dia)
   * @returns ETo (mm/dia)
   * @see https://www.infoteca.cnptia.embrapa.br/infoteca/bitstream/doc/1136374/1/COT-254-Planilha-obtencao-coeficiente-de-cultura.pdf
   */
  calculateETo(Tmax: number, Tmin: number, Tmed: number, Ra: number): number {
    return 0.0023 * Ra * Math.sqrt(Tmax - Tmin) * (Tmed + 17.8) * this.MJ_TO_MM;
  }

  /**
   * Calcula a eficiência média de um sistema de irrigação
   * @param irrigationType Tipo de irrigação
   * @returns Eficiência média do sistema de irrigação
   * @see https://www.infoteca.cnptia.embrapa.br/infoteca/bitstream/doc/967585/1/Doc206DrEugenio.pdf
   */
  getAverageEfficiency(irrigationType: string, rain: number = 0): number {
    let efficiencyRange = this.efficiencies[irrigationType];

    if (irrigationType == "Chuva" && rain > 10) efficiencyRange = this.efficiencies["Chuva intensa"];

    if (efficiencyRange) {
      const [min, max] = efficiencyRange;
      return (min + max) / 2;
    } else {
      return 0;
    }
  }

  /**
   * Calcula o coeficiente de cultura ajustado (Kc)
   * @param KcTabulado Kc tabelado
   * @param u2 Velocidade do vento a 2 metros de altura (m/s)
   * @param URmin Umidade relativa mínima (%)
   * @param h Altura da cultura (m)
   * @returns Kc ajustado
   * @see https://www.infoteca.cnptia.embrapa.br/infoteca/bitstream/doc/1136374/1/COT-254-Planilha-obtencao-coeficiente-de-cultura.pdf
   */
  calculateAdjustedKc(KcTabulado: number, u2: number, URmin: number, h: number): number {
    return KcTabulado + (0.04 * (u2 - 2) - (0.004 * (URmin - 45))) * Math.pow(h, 0.3);
  }

  /**
   * Calcula a necessidade de irrigação para uma cultura
   * @param ETo Evapotranspiração de referência (mm/dia)
   * @param Kc Coeficiente de cultura
   * @param efficiency Eficiência do sistema de irrigação (padrão: 0.85)
   * @returns Necessidade de irrigação (mm/dia)
   */
  calculateIrrigationRequirement(ETo: number, Kc: number, efficiency: number): number {
    const ETc = ETo * Kc;
    return ETc / (efficiency / 100);
  }

  calculateEffectiveRain(rain: number, efficiency: number): number {
    return rain * (efficiency / 100);
  }
}
