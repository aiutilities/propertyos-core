export interface PropertyAiContext {

  propertyId:
    string;

  propertyName:
    string;


  maintenance: {

    openTickets:
      number;

    overdueTickets:
      number;

    highPriorityTickets:
      number;

  };


  helpdesk: {

    openTickets:
      number;

    escalatedTickets:
      number;

  };


  tenants: {

    total:
      number;

    active:
      number;

  };


  financials: {

    pendingRentAmount:
      number;

    overdueCount:
      number;

  };


  generatedAt:
    string;

}
