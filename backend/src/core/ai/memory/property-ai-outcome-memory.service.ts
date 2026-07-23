import {
  Injectable,
} from '@nestjs/common';

import {
  PropertyAiOutcomeMemory,
} from './property-ai-outcome-memory.types';

import {
  PropertyAiOutcomeMemoryRepository,
} from './property-ai-outcome-memory.repository';

import {
  PropertyAiOutcomeMemoryRecord,
} from './property-ai-outcome-memory.repository.types';


@Injectable()
export class PropertyAiOutcomeMemoryService {


  constructor(
    private readonly repository:
      PropertyAiOutcomeMemoryRepository,
  ) {}


  async record(
    outcome:
      PropertyAiOutcomeMemory,
  ):
    Promise<PropertyAiOutcomeMemory> {


    const saved =
      await this.repository.create({

        id:
          outcome.id,

        propertyId:
          outcome.propertyId,

        command:
          outcome.command ?? '',

        decision:
          outcome.decision ?? '',

        action:
          outcome.action,

        confidence:
          outcome.recommendationConfidence,

        executionStatus:
          outcome.executionStatus,

        outcomeSummary:
          outcome.notes,

        createdAt:
          new Date(
            outcome.createdAt,
          ),

      });


    return this.toDomain(
      saved,
    );

  }


  async listByProperty(
    propertyId:
      string,
  ):
    Promise<PropertyAiOutcomeMemory[]> {


    const records =
      await this.repository.findByProperty(
        propertyId,
      );


    return records.map(
      record =>
        this.toDomain(record),
    );

  }


  async findSuccessfulActions(
    propertyId:
      string,
  ):
    Promise<PropertyAiOutcomeMemory[]> {


    const records =
      await this.repository.findSuccessful(
        propertyId,
      );


    return records.map(
      record =>
        this.toDomain(record),
    );

  }


  count():
    Promise<number> {

    return this.repository.count();

  }


  private toDomain(
    record:
      PropertyAiOutcomeMemoryRecord,
  ):
    PropertyAiOutcomeMemory {


    return {

      id:
        record.id,

      propertyId:
        record.propertyId,

      command:
        record.command,

      decision:
        record.decision,

      action:
        record.action ?? '',

      recommendationConfidence:
        record.confidence ?? 0,

      executionStatus:
        record.executionStatus as any,

      impactScore:
        0,

      notes:
        record.outcomeSummary ?? '',

      createdAt:
        record.createdAt
          .toISOString(),

    };

  }

}
