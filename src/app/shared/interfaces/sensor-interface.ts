export interface SensorInterface {
  id: string;
  name?: string;
  culture?: string;
  isAssociated: boolean;
  humidity: number;
  timestamp: number;
}
