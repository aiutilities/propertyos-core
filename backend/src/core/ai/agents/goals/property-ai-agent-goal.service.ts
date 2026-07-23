import {
  Injectable,
} from '@nestjs/common';

import {
  PropertyAiAgentGoal,
} from './property-ai-agent-goal.types';


@Injectable()
export class PropertyAiAgentGoalService {


  private readonly goals:
    PropertyAiAgentGoal[] = [];


  create(
    goal:
      PropertyAiAgentGoal,
  ):
    PropertyAiAgentGoal {

    this.goals.push(
      goal,
    );

    return goal;

  }


  list(
    propertyId:
      string,
  ):
    PropertyAiAgentGoal[] {

    return this.goals.filter(
      item =>
        item.propertyId === propertyId,
    );

  }


  activate(
    id:
      string,
  ):
    PropertyAiAgentGoal | undefined {

    const goal =
      this.goals.find(
        item =>
          item.id === id,
      );


    if (goal) {

      goal.status =
        'ACTIVE';

    }


    return goal;

  }


  complete(
    id:
      string,
  ):
    PropertyAiAgentGoal | undefined {

    const goal =
      this.goals.find(
        item =>
          item.id === id,
      );


    if (goal) {

      goal.status =
        'COMPLETED';

      goal.completedAt =
        new Date()
          .toISOString();

    }


    return goal;

  }


  fail(
    id:
      string,
  ):
    PropertyAiAgentGoal | undefined {

    const goal =
      this.goals.find(
        item =>
          item.id === id,
      );


    if (goal) {

      goal.status =
        'FAILED';

    }


    return goal;

  }


}
