import { HelpdeskVisibility } from '../types/helpdesk.types';

export class AddHelpdeskCommentDto {
  authorPersonId!: string;
  body!: string;
  visibility: HelpdeskVisibility =
    HelpdeskVisibility.PUBLIC;
}
