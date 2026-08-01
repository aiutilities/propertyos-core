export class UpdateBinLocationDto {
  parentBinId?: string;
  name?: string;
  description?: string;
  barcode?: string;
  isReceivingBin?: boolean;
  isDispatchBin?: boolean;
  isQuarantineBin?: boolean;
  isActive?: boolean;
  updatedByPersonId!: string;
  remarks?: string;
}
