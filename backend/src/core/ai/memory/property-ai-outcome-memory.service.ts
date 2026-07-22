import {
  Injectable,
} from '@nestjs/common';

import {
  PropertyAiOutcomeMemory,
} from './property-ai-outcome-memory.types';


@Injectable()
export class PropertyAiOutcomeMemoryService {


  private readonly memories:
    PropertyAiOutcomeMemory[] =
    [];


  record(
    outcome:
      PropertyAiOutcomeMemory,
  ):
    PropertyAiOutcomeMemory {


    this.memories.push(
      outcome,
    );


    return outcome;

  }


  listByProperty(
    propertyId:
      string,
  ):
    PropertyAiOutcomeMemory[] {


    return this.memories.filter(
      memory =>
        memory.propertyId
          === propertyId,
    );

  }


  findSuccessfulActions(
    propertyId:
      string,
  ):
    PropertyAiOutcomeMemory[] {


    return this.memories.filter(
      memory =>
        memory.propertyId
          === propertyId
        &&
        memory.executionStatus
          === 'SUCCESS',
    );

  }


  count():
    number {

    return this.memories.length;

  }

}
