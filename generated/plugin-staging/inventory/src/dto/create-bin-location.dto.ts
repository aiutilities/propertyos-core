export class CreateBinLocationDto {
  storeId!: string;
  parentBinId?: string;
  binCode!: string;
  name!: string;
  description?: string;
  barcode?: string;
  isReceivingBin = false;
  isDispatchBin = false;
  isQuarantineBin = false;
  createdByPersonId!: string;
}
