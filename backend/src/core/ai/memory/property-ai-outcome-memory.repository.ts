import {
  PropertyAiOutcomeMemoryRecord,
} from './property-ai-outcome-memory.repository.types';


export interface PropertyAiOutcomeMemoryRepository {


  create(
    memory:
      PropertyAiOutcomeMemoryRecord,
  ):
    Promise<PropertyAiOutcomeMemoryRecord>;


  findByProperty(
    propertyId:
      string,
  ):
    Promise<PropertyAiOutcomeMemoryRecord[]>;


  findSuccessful(
    propertyId:
      string,
  ):
    Promise<PropertyAiOutcomeMemoryRecord[]>;


  count():
    Promise<number>;

}
