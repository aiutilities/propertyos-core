import {
  Injectable,
} from '@nestjs/common';

import {
  InventoryStockBalance,
} from '../../inventory/types/inventory.types';

import {
  PropertyRiskSignal,
} from '../types/property-risk-signal.types';


@Injectable()
export class InventoryRiskAnalyzerService {


  analyze(
    stock:
      InventoryStockBalance[],
  ):
    PropertyRiskSignal[] {


    const signals:
      PropertyRiskSignal[] = [];


    for (
      const item of stock
    ) {


      if (
        item.availableQuantity <= 0
      ) {

        signals.push({

          category:
            'INVENTORY',

          severity:
            'HIGH',

          message:
            `Inventory unavailable for item ${item.itemId}`,

          source:
            'inventory',

        });

        continue;

      }


      if (
        item.reservedQuantity >
        item.quantityOnHand
      ) {

        signals.push({

          category:
            'INVENTORY',

          severity:
            'MEDIUM',

          message:
            `Inventory reservation exceeds available stock for item ${item.itemId}`,

          source:
            'inventory',

        });

      }

    }


    return signals;

  }

}
