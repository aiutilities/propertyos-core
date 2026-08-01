import { AssetStatus } from '../types/facility.types';

export class TransitionAssetDto {
  status!: AssetStatus;
  changedByPersonId!: string;
  remarks?: string;
}
